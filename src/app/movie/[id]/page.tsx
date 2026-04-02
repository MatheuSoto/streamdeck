import { MovieDetailPage } from "./detail";

const TMDB_TOKEN = process.env.TMDB_TOKEN!;

async function getMovie(id: string) {
  const [movieRes, idsRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/${id}?language=es-MX`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }),
    fetch(`https://api.themoviedb.org/3/movie/${id}/external_ids`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }),
  ]);
  const r = await movieRes.json();
  const ids = await idsRes.json();
  return {
    id: r.id,
    imdbType: "movie" as const,
    title: r.title,
    year: (r.release_date || "").slice(0, 4),
    poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
    backdrop: r.backdrop_path ? `https://image.tmdb.org/t/p/w1280${r.backdrop_path}` : null,
    overview: r.overview,
    rating: r.vote_average?.toFixed(1),
    runtime: r.runtime,
    genres: (r.genres || []).map((g: any) => g.name),
    imdbId: ids.imdb_id || null,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await getMovie(id);
  return <MovieDetailPage movie={movie} />;
}
