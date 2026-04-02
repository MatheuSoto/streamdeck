import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { DownloadRow } from "@/types";

const DB_PATH = path.join(process.cwd(), "data", "streamdeck.db");
let _db: Database.Database | null = null;

function getDb() {
  if (!_db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.exec(`
      CREATE TABLE IF NOT EXISTS downloads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imdb_id TEXT NOT NULL,
        tmdb_id INTEGER,
        movie_title TEXT NOT NULL,
        status TEXT DEFAULT 'queued',
        step TEXT DEFAULT 'Iniciando...',
        hash TEXT,
        torrent_name TEXT,
        size_gb REAL,
        rank INTEGER,
        rd_id TEXT,
        user_report TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_downloads_imdb ON downloads(imdb_id);
      CREATE TABLE IF NOT EXISTS failed_hashes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imdb_id TEXT NOT NULL,
        hash TEXT NOT NULL,
        reason TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_failed_imdb ON failed_hashes(imdb_id);
    `);
  }
  return _db;
}

export function createDownload(imdbId: string, tmdbId: number, movieTitle: string, userReport?: string): number {
  const result = getDb().prepare(
    "INSERT INTO downloads (imdb_id, tmdb_id, movie_title, status, step, user_report) VALUES (?, ?, ?, 'queued', 'En cola...', ?)"
  ).run(imdbId, tmdbId, movieTitle, userReport || null);
  return result.lastInsertRowid as number;
}

export function updateDownload(id: number, fields: Partial<Pick<DownloadRow, "status" | "step" | "hash" | "torrent_name" | "size_gb" | "rank" | "rd_id">>) {
  const sets: string[] = ["updated_at = datetime('now')"];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
  }
  vals.push(id);
  getDb().prepare(`UPDATE downloads SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
}

export function getDownload(imdbId: string): DownloadRow | undefined {
  return getDb().prepare("SELECT * FROM downloads WHERE imdb_id = ? ORDER BY created_at DESC LIMIT 1").get(imdbId) as DownloadRow | undefined;
}

export function getDownloadById(id: number): DownloadRow | undefined {
  return getDb().prepare("SELECT * FROM downloads WHERE id = ?").get(id) as DownloadRow | undefined;
}

export function addFailedHash(imdbId: string, hash: string, reason?: string) {
  getDb().prepare("INSERT INTO failed_hashes (imdb_id, hash, reason) VALUES (?, ?, ?)").run(imdbId, hash, reason || null);
}

export function getFailedHashes(imdbId: string): string[] {
  return (getDb().prepare("SELECT hash FROM failed_hashes WHERE imdb_id = ?").all(imdbId) as { hash: string }[]).map(r => r.hash);
}
