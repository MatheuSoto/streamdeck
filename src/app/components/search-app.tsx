"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Movie } from "@/types";
import { MovieGrid } from "./movie-card";
import { SearchBar } from "./search-bar";

export function SearchApp({ trending, nowPlaying }: { trending: Movie[]; nowPlaying: Movie[] }) {
  const [results, setResults] = useState<Movie[]>([]);
  const router = useRouter();

  function goToMovie(m: Movie) {
    router.push(`/movie/${m.id}`);
  }

  async function onSearch(q: string) {
    if (!q.trim()) return;
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    setResults(await res.json());
  }

  // RESULTS
  if (results.length > 0) {
    return (
      <div className="min-h-screen bg-[#141414] text-white antialiased">
        <header className="sticky top-0 z-50 bg-[#141414] border-b border-white/[0.06]">
          <div className="px-8 h-20 flex items-center gap-6">
            <button onClick={() => setResults([])} className="text-2xl font-bold text-white hover:opacity-80 transition-opacity flex-shrink-0">StreamDeck</button>
            <div className="flex-1 max-w-xl">
              <SearchBar onSelect={goToMovie} onSearch={onSearch} size="sm" />
            </div>
            <Link href="/library" className="text-sm text-white/40 hover:text-white transition-colors">Librería</Link>
          </div>
        </header>
        <div className="px-8 pt-8 pb-24">
          <MovieGrid movies={results} onSelect={goToMovie} />
        </div>
      </div>
    );
  }

  // HOME
  return (
    <div className="min-h-screen bg-[#141414] text-white antialiased flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-4">
        <h1 className="text-4xl font-bold text-white mb-10">StreamDeck</h1>
        <div className="w-full max-w-2xl">
          <SearchBar onSelect={goToMovie} onSearch={onSearch} size="lg" />
          <div className="text-center mt-4">
            <Link href="/library" className="text-sm text-white/30 hover:text-white/60 transition-colors">Ver mi librería →</Link>
          </div>
        </div>
      </div>

      <div className="px-8 pb-20 space-y-14">
        <section>
          <h2 className="text-2xl font-bold mb-6">Tendencias de la semana</h2>
          <MovieGrid movies={trending} onSelect={goToMovie} />
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-6">En cartelera</h2>
          <MovieGrid movies={nowPlaying} onSelect={goToMovie} />
        </section>
      </div>
    </div>
  );
}
