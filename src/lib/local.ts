import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { execSync } from "child_process";

const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(process.env.HOME || "/tmp", "Movies/StreamDeck");
const VALID_EXTENSIONS = new Set([".mkv", ".mp4", ".avi", ".m4v", ".webm"]);

export async function downloadFile(url: string, folder: string, onProgress: (pct: number) => void): Promise<string | null> {
  const dir = path.join(DOWNLOAD_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });

  // Get filename and total size once
  let fileName = "movie.mkv";
  let totalBytes = 0;
  try {
    const head = await fetch(url, { method: "HEAD" });
    const disp = head.headers.get("content-disposition");
    const match = disp?.match(/filename="?([^";\n]+)"?/);
    fileName = match?.[1] || new URL(url).pathname.split("/").pop() || "movie.mkv";
    totalBytes = parseInt(head.headers.get("content-length") || "0");
  } catch {}

  fileName = decodeURIComponent(fileName);
  const dest = path.join(dir, fileName);

  return new Promise((resolve) => {
    const proc = spawn("curl", ["-fSL", "-C", "-", "-o", dest, url]);

    let done = false;
    proc.on("close", (code) => { done = true; resolve(code === 0 ? dest : null); });
    proc.on("error", () => { done = true; resolve(null); });

    // Poll local file size only (no more HEAD requests)
    const interval = setInterval(() => {
      if (done) { clearInterval(interval); return; }
      try {
        const stat = fs.statSync(dest);
        if (totalBytes > 0) onProgress(Math.round((stat.size / totalBytes) * 100));
      } catch {}
    }, 5000);
  });
}

export function validateFile(filePath: string): { ok: boolean; reason?: string; fileName?: string } {
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);

  if (!VALID_EXTENSIONS.has(ext)) return { ok: false, reason: `Formato no soportado: ${ext}` };
  if (/bdmv|\.iso$|\.img$/i.test(filePath)) return { ok: false, reason: `Archivo inválido: ${name}` };

  try {
    const stat = fs.statSync(filePath);
    if (stat.size < 50 * 1024 * 1024) return { ok: false, reason: "Archivo muy pequeño (<50MB)" };
  } catch {
    return { ok: false, reason: "Archivo no encontrado" };
  }

  try {
    const probe = execSync(`ffprobe -v quiet -print_format json -show_streams "${filePath}"`, { timeout: 15000, encoding: "utf-8" });
    const hasVideo = JSON.parse(probe).streams?.some((s: any) => s.codec_type === "video");
    if (!hasVideo) return { ok: false, reason: "Sin stream de video" };
  } catch {}

  return { ok: true, fileName: name };
}

export function deleteFile(filePath: string) {
  try { fs.unlinkSync(filePath); } catch {}
  try {
    const dir = path.dirname(filePath);
    if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  } catch {}
}
