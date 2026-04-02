import { createDownload, updateDownload, getFailedHashes, addFailedHash } from "./db";
import { fetchStreams } from "./peerflix";
import { askLLM } from "./llm";
import { addMagnet, waitForReady, getDownloadLink, deleteTorrent } from "./rd";
import { downloadFile, validateFile, deleteFile } from "./local";

function sanitize(name: string): string {
  return name.replace(/[^\w\s\-().áéíóúñÁÉÍÓÚÑ]/g, "").replace(/\s+/g, " ").trim();
}

export function startDownload(imdbId: string, tmdbId: number, movieTitle: string, movieYear?: string, userReport?: string): number {
  const id = createDownload(imdbId, tmdbId, movieTitle, userReport);
  runPipeline(id, imdbId, movieTitle, movieYear, userReport);
  return id;
}

async function runPipeline(id: number, imdbId: string, title: string, year?: string, report?: string) {
  try {
    // 1. Fetch cached streams
    updateDownload(id, { status: "searching", step: "Buscando opciones disponibles en Real-Debrid..." });
    const all = await fetchStreams(imdbId);
    console.log(`[Pipeline] Fetched ${all.length} total streams for ${imdbId}`);
    if (!all.length) return updateDownload(id, { status: "failed", step: "No se encontraron opciones disponibles." });

    const failed = new Set(getFailedHashes(imdbId));
    const streams = all.filter(s => !failed.has(s.hash));
    const esStreams = streams.filter(s => s.lang === "es");
    console.log(`[Pipeline] ${streams.length} valid (${failed.size} failed excluded), ${esStreams.length} in Spanish`);

    if (!streams.length) return updateDownload(id, { status: "failed", step: "Todas las opciones fueron descartadas." });

    // 2. LLM ranking
    updateDownload(id, { status: "ranking", step: `Analizando ${streams.length} opciones con IA...` });
    const listText = streams.map((s, i) =>
      `${i}. [${s.lang === "es" ? "🇪🇸" : "🇬🇧"}] [${s.quality}] [${s.sizeGB}GB] [${s.seeders} seeders] ${s.title}`
    ).join("\n");
    const ranked = await askLLM(title, year || "", listText, report);
    console.log(`[Pipeline] LLM result: ${ranked === "none" ? "NONE" : Array.isArray(ranked) ? ranked.join(",") : "empty"}`);

    if (ranked === "none") return updateDownload(id, { status: "failed", step: "No hay opciones aceptables." });

    const ordered = ranked.length > 0
      ? ranked.map(i => streams[i]).filter(Boolean)
      : streams;

    console.log(`[Pipeline] Ordered ${ordered.length} options to try`);
    if (!ordered.length) return updateDownload(id, { status: "failed", step: "La IA no seleccionó opciones válidas." });

    // 3. Try top picks
    const folder = sanitize(`${title} (${year || ""})`).replace(/\(\s*\)/, "").trim();

    for (let rank = 0; rank < Math.min(ordered.length, 5); rank++) {
      const pick = ordered[rank]!;
      console.log(`[Pipeline] === Trying option ${rank + 1}: hash=${pick.hash.slice(0, 12)}... fileId=${pick.fileId} lang=${pick.lang} quality=${pick.quality} size=${pick.sizeGB}GB`);
      console.log(`[Pipeline]   title: ${pick.title.slice(0, 100)}`);
      console.log(`[Pipeline]   fileName: ${pick.fileName.slice(0, 100)}`);

      updateDownload(id, {
        status: "adding",
        step: `Opción ${rank + 1}: ${pick.title.slice(0, 60)}...`,
        hash: pick.hash, torrent_name: pick.title, size_gb: parseFloat(pick.sizeGB), rank: rank + 1,
      });

      try {
        const rdId = await addMagnet(pick.hash);
        if (!rdId) {
          console.log(`[Pipeline] addMagnet failed for option ${rank + 1}`);
          addFailedHash(imdbId, pick.hash, "magnet failed");
          continue;
        }

        updateDownload(id, { rd_id: rdId, step: "Procesando en Real-Debrid..." });
        const ready = await waitForReady(rdId, (pct) => {
          updateDownload(id, { step: `Real-Debrid procesando... ${pct}%` });
        });
        if (!ready) {
          console.log(`[Pipeline] waitForReady failed for option ${rank + 1}`);
          addFailedHash(imdbId, pick.hash, "RD timeout");
          await deleteTorrent(rdId);
          continue;
        }

        console.log(`[Pipeline] RD ready! Getting download link...`);
        updateDownload(id, { status: "downloading", step: "Obteniendo enlace..." });
        const url = await getDownloadLink(rdId);
        if (!url) {
          console.log(`[Pipeline] No download link for option ${rank + 1}`);
          addFailedHash(imdbId, pick.hash, "no link");
          await deleteTorrent(rdId);
          continue;
        }

        console.log(`[Pipeline] Downloading to ${folder}...`);
        updateDownload(id, { step: `Descargando ${pick.sizeGB}GB...` });
        const filePath = await downloadFile(url, folder, (pct) => {
          updateDownload(id, { step: `Descargando... ${pct}%` });
        });
        if (!filePath) {
          console.log(`[Pipeline] Download failed for option ${rank + 1}`);
          addFailedHash(imdbId, pick.hash, "download failed");
          await deleteTorrent(rdId);
          continue;
        }

        console.log(`[Pipeline] Validating ${filePath}...`);
        updateDownload(id, { step: "Validando archivo..." });
        const valid = validateFile(filePath);
        if (!valid.ok) {
          console.log(`[Pipeline] Validation failed: ${valid.reason}`);
          deleteFile(filePath);
          addFailedHash(imdbId, pick.hash, valid.reason);
          await deleteTorrent(rdId);
          updateDownload(id, { step: `Opción ${rank + 1} inválida: ${valid.reason}` });
          continue;
        }

        await deleteTorrent(rdId);
        console.log(`[Pipeline] ✅ SUCCESS: ${valid.fileName} (${pick.sizeGB}GB)`);
        updateDownload(id, { status: "done", step: `¡Listo! ${valid.fileName} (${pick.sizeGB}GB)` });
        return;
      } catch (e: any) {
        console.log(`[Pipeline] Exception on option ${rank + 1}: ${e.message}`);
        addFailedHash(imdbId, pick.hash, e.message?.slice(0, 80));
        continue;
      }
    }

    updateDownload(id, { status: "failed", step: "Las mejores opciones fallaron." });
  } catch (e: any) {
    console.log(`[Pipeline] Fatal error: ${e.message}`);
    updateDownload(id, { status: "failed", step: `Error: ${e.message?.slice(0, 80)}` });
  }
}
