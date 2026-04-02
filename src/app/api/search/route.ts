import { NextResponse } from "next/server";

const TMDB_TOKEN = process.env.TMDB_TOKEN!;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json([]);

  const res = await fetch(
    `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&language=es-MX&page=1`,
    { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
  );
  const data = await res.json();
  return NextResponse.json(
    (data.results || [])
      .filter((r: any) => r.media_type === "movie" || r.media_type === "tv")
      .slice(0, 12)
      .map((r: any) => ({
        id: r.id, imdbType: r.media_type,
        title: r.title || r.name,
        year: (r.release_date || r.first_air_date || "").slice(0, 4),
        poster: r.poster_path ? `https://image.tmdb.org/t/p/w300${r.poster_path}` : null,
        overview: r.overview, rating: r.vote_average?.toFixed(1),
      }))
  );
}
