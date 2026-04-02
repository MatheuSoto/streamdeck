const RD_TOKEN = process.env.RD_TOKEN!;

const SOURCES = [
  { name: "Peerflix", url: `https://addon.peerflix.mov/realdebrid=${RD_TOKEN}` },
  { name: "Torrentio", url: `https://torrentio.strem.fun/realdebrid=${RD_TOKEN}` },
];

export interface Stream {
  title: string;
  hash: string;
  sizeGB: string;
  lang: string;
  quality: string;
  seeders: number;
  fileName: string;
  fileId: string | null;
  source: string;
  cached: boolean;
}

export async function fetchStreams(imdbId: string, type: "movie" | "series" = "movie"): Promise<Stream[]> {
  const results = await Promise.all(
    SOURCES.map(async (src) => {
      try {
        const res = await fetch(`${src.url}/stream/${type}/${imdbId}.json`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.streams || [])
          .filter((s: any) => s.url)
          .map((s: any) => parseStream(s, src.name))
          .filter(Boolean) as Stream[];
      } catch { return []; }
    })
  );

  // Deduplicate by hash, prefer cached
  const map = new Map<string, Stream>();
  for (const stream of results.flat()) {
    const existing = map.get(stream.hash);
    if (!existing || (stream.cached && !existing.cached)) map.set(stream.hash, stream);
  }
  return Array.from(map.values());
}

function parseStream(s: any, source: string): Stream | null {
  const url: string = s.url || "";
  const hash = url.split("/").find((p: string) => /^[a-f0-9]{40}$/.test(p));
  if (!hash) return null;

  // Extract file_id from URL: .../hash/null/{fileId}/filename
  const urlParts = url.split("/");
  const hashIdx = urlParts.findIndex((p: string) => p === hash);
  const rawFileId = hashIdx >= 0 ? urlParts[hashIdx + 2] : null;
  const fileId = rawFileId && rawFileId !== "null" && rawFileId !== "undefined" ? rawFileId : null;

  const name: string = s.name || "";
  const titleLines: string[] = (s.title || "").split("\n");
  const title = titleLines[0] || "";

  // Size
  let sizeGB = "0";
  for (const line of titleLines) {
    const gb = line.match(/💾\s*([\d.]+)\s*GB/);
    if (gb) { sizeGB = gb[1]; break; }
    const mb = line.match(/💾\s*([\d.]+)\s*MB/);
    if (mb) { sizeGB = (parseFloat(mb[1]) / 1024).toFixed(2); break; }
  }

  // Seeders
  let seeders = 0;
  for (const line of titleLines) {
    const m = line.match(/👤\s*(\d+)/);
    if (m) { seeders = parseInt(m[1]); break; }
  }

  // Lang from flags
  const allText = name + " " + (s.title || "");
  const lang = (allText.includes("🇪🇸") || allText.includes("🇲🇽") || /\bLAT\b/i.test(allText)) ? "es" : allText.includes("🇬🇧") ? "en" : "other";

  // Quality
  const quality = name.match(/\d{3,4}p/)?.[0] || (name.includes("4k") || name.includes("4K") ? "4K" : "");

  // Filename — prefer behaviorHints
  const fileName = s.behaviorHints?.filename || decodeURIComponent(url.split("/").pop() || "");

  // Cached: [RD+] = cached and streamable, [RD download] = cached for download
  const cached = name.includes("[RD+]") || name.includes("[RD download]");

  return { title, hash, sizeGB, lang, quality, seeders, fileName, fileId, source, cached };
}