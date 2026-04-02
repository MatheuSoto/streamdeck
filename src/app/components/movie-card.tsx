import type { Movie } from "@/types";

export function MovieCard({ m, onClick }: { m: Movie; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group text-left rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200">
      {m.poster ? (
        <img src={m.poster} alt={m.title} className="w-full aspect-[2/3] object-cover rounded-lg" />
      ) : (
        <div className="w-full aspect-[2/3] bg-[#1a1a1a] flex items-center justify-center text-white/30 rounded-lg">Sin imagen</div>
      )}
      <div className="pt-2 px-1">
        <p className="text-[15px] font-medium truncate text-white/90">{m.title}</p>
        <p className="text-sm text-white/50 mt-0.5">{m.year} · ⭐ {m.rating}</p>
      </div>
    </button>
  );
}

export function MovieGrid({ movies, onSelect }: { movies: Movie[]; onSelect: (m: Movie) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      {movies.map((m) => <MovieCard key={m.id} m={m} onClick={() => onSelect(m)} />)}
    </div>
  );
}
