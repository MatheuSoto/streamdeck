import { NextResponse } from "next/server";
import { getFailedHashes } from "@/lib/db";
import { fetchStreams } from "@/lib/peerflix";
import { askLLM } from "@/lib/llm";

const TMDB_TOKEN = process.env.TMDB_TOKEN!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get("tmdbId");
  const type = searchParams.get("type") || "movie";
  if (!tmdbId) return NextResponse.json({ error: "tmdbId required" }, { status: 400 });

  const [tmdbRes, detailRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }),
    fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}?language=es-MX`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }),
  ]);
  const imdbId = (await tmdbRes.json()).imdb_id;
  const movieTitle = (await detailRes.json()).title || "";
  if (!imdbId) return NextResponse.json({ error: "No IMDB ID found" }, { status: 404 });

  const streams = await fetchStreams(imdbId);
  const failed = new Set(getFailedHashes(imdbId));

  const torrents = streams
    .filter(s => !failed.has(s.hash))
    .map((s, i) => ({
      name: s.title, hash: s.hash, sizeGB: s.sizeGB,
      tags: [...(s.lang === "es" ? ["🇪🇸 Español"] : [])],
      idx: i,
    }));

  const listText = torrents.map(t => `${t.idx}. [${t.sizeGB}GB] ${t.name}`).join("\n");
  const ranked = await askLLM(movieTitle, "", listText);

  let results;
  if (ranked !== "none" && ranked.length > 0) {
    const seen = new Set(ranked);
    const top = ranked.map(i => torrents.find(t => t.idx === i)).filter(Boolean);
    results = [...top, ...torrents.filter(t => !seen.has(t.idx))];
  } else {
    results = torrents;
  }

  return NextResponse.json({ imdbId, results: results.slice(0, 50).map(({ idx, ...r }: any) => r) });
}
