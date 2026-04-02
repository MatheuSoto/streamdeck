"use client";
import { useState, useRef } from "react";
import type { Movie } from "@/types";

export function SearchBar({ onSelect, onSearch, size = "lg" }: {
  onSelect: (m: Movie) => void;
  onSearch: (q: string) => void;
  size?: "lg" | "sm";
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [show, setShow] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(val: string) {
    setQuery(val);
    if (val.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
      setSuggestions(await res.json());
      setShow(true);
    }, 300);
  }

  const isLg = size === "lg";

  return (
    <div className="relative">
      <svg className={`absolute ${isLg ? "left-6 w-7 h-7" : "left-4 w-5 h-5"} top-1/2 -translate-y-1/2 text-white/40`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        className={`w-full bg-[#222] border border-white/10 outline-none placeholder:text-white/30 focus:border-white/25 focus:bg-[#2a2a2a] transition-all ${isLg ? "rounded-2xl py-5 text-xl pl-16 pr-16" : "rounded-xl py-3 text-base pl-11 pr-12"}`}
        placeholder={isLg ? "What do you want to watch?" : "Search..."}
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { setShow(false); onSearch(query); } }}
        onFocus={() => suggestions.length > 0 && setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
      />
      {query && (
        <button
          onClick={() => { setQuery(""); setSuggestions([]); setShow(false); inputRef.current?.focus(); }}
          className={`absolute ${isLg ? "right-6 w-8 h-8" : "right-3 w-7 h-7"} top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors`}
        >
          <svg className={`${isLg ? "w-5 h-5" : "w-4 h-4"} text-white/50`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {show && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#222] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
          {suggestions.slice(0, 6).map((m) => (
            <button key={m.id} onMouseDown={() => { setQuery(m.title); setShow(false); onSelect(m); }} className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.08] transition-colors text-left">
              {m.poster ? <img src={m.poster} alt="" className="w-11 h-16 rounded object-cover flex-shrink-0" /> : <div className="w-11 h-16 rounded bg-white/[0.06] flex-shrink-0" />}
              <div className="min-w-0">
                <p className="text-base font-medium truncate">{m.title}</p>
                <p className="text-sm text-white/40 mt-0.5">{m.year} · ⭐ {m.rating} · {m.imdbType === "movie" ? "Película" : "Serie"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
