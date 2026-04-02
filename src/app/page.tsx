import { SearchApp } from "./components/search-app";

const TMDB_TOKEN = process.env.TMDB_TOKEN!;

async function fetchMovies(url: string) {
  const pages = await Promise.all(
    [1, 2, 3, 4].map(p =>
      fetch(`${url}&page=${p}`, {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
        next: { revalidate: 3600 },
      }).then(r => r.json())
    )
  );
  return pages.flatMap(r => r.results || []).slice(0, 40).map((r: any) => ({
    id: r.id,
    imdbType: r.media_type || "movie",
    title: r.title || r.name,
    year: (r.release_date || r.first_air_date || "").slice(0, 4),
    poster: r.poster_path ? `https://image.tmdb.org/t/p/w300${r.poster_path}` : null,
    overview: r.overview,
    rating: r.vote_average?.toFixed(1),
  }));
}

export default async function Page() {
  const [trending, nowPlaying] = await Promise.all([
    fetchMovies("https://api.themoviedb.org/3/trending/movie/week?language=es-MX"),
    fetchMovies("https://api.themoviedb.org/3/movie/now_playing?language=es-MX"),
  ]);

  return <SearchApp trending={trending} nowPlaying={nowPlaying} />;
}
