"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { MovieDetail, DownloadStatus } from "@/types";

export function MovieDetailPage({ movie }: { movie: MovieDetail }) {
  const [dl, setDl] = useState<DownloadStatus>({ status: "none" });
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState("");
  const pollRef = useRef<NodeJS.Timeout>(undefined);

  // Check existing status
  useEffect(() => {
    if (!movie.imdbId) { setLoading(false); return; }
    fetch(`/api/status?imdbId=${movie.imdbId}`)
      .then(r => r.json())
      .then(d => { if (d.status !== "none") setDl(d); })
      .finally(() => setLoading(false));
  }, [movie.imdbId]);

  // Poll while in progress
  useEffect(() => {
    const inProgress = ["queued", "searching", "ranking", "adding", "downloading", "refreshing"].includes(dl.status);
    if (inProgress && dl.id) {
      pollRef.current = setInterval(async () => {
        const res = await fetch(`/api/status?id=${dl.id}`);
        const d = await res.json();
        setDl(d);
        if (d.status === "done" || d.status === "failed") clearInterval(pollRef.current);
      }, 2000);
    }
    return () => clearInterval(pollRef.current);
  }, [dl.status, dl.id]);

  async function download(userReport?: string) {
    setDl({ status: "queued", step: "En cola..." });
    setShowReport(false);
    setReportText("");
    const res = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imdbId: movie.imdbId, tmdbId: movie.id, movieTitle: movie.title, movieYear: movie.year, userReport }),
    });
    const data = await res.json();
    setDl({ id: data.downloadId, status: "queued", step: "En cola..." });
  }

  const inProgress = ["queued", "searching", "ranking", "adding", "downloading", "refreshing"].includes(dl.status);
  const pct = dl.step?.match(/(\d+)%/)?.[1];

  return (
    <div className="min-h-screen bg-[#141414] text-white antialiased">
      {movie.backdrop && (
        <div className="relative h-[50vh] w-full overflow-hidden">
          <img src={movie.backdrop} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-8 -mt-32 relative z-10 pb-24">
        <Link href="/" className="inline-flex items-center gap-2 text-base text-white/50 hover:text-white transition-colors mb-8">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver
        </Link>

        <div className="flex gap-8 mb-10 items-start">
          {movie.poster && <img src={movie.poster} alt={movie.title} className="w-52 rounded-xl shadow-2xl flex-shrink-0" />}
          <div className="min-w-0 pt-4">
            <h1 className="text-4xl font-bold leading-tight">{movie.title}</h1>
            <div className="flex items-center gap-3 mt-3 text-base text-white/50">
              <span>{movie.year}</span>
              <span>·</span>
              <span>⭐ {movie.rating}</span>
              {movie.runtime > 0 && <><span>·</span><span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span></>}
            </div>
            {movie.genres.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {movie.genres.map(g => (
                  <span key={g} className="text-sm px-3 py-1 rounded-full bg-white/10 text-white/70">{g}</span>
                ))}
              </div>
            )}
            <p className="text-base text-white/60 mt-5 leading-relaxed">{movie.overview}</p>

            <div className="mt-8">
              {loading && <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />}

              {/* Download button */}
              {!loading && dl.status === "none" && (
                <button onClick={() => download()} className="bg-red-600 hover:bg-red-700 text-white text-lg font-semibold px-10 py-4 rounded-xl transition-all">
                  Descargar
                </button>
              )}

              {/* In progress */}
              {!loading && inProgress && (
                <div className="bg-white/[0.05] border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-red-500 rounded-full animate-spin flex-shrink-0" />
                    <span className="text-lg font-medium">Descargando...</span>
                  </div>
                  {pct && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-white/50 mb-1.5">
                        <span>Descargando...</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                  {!pct && <p className="text-sm text-white/50">{dl.step}</p>}
                  {dl.torrent && <p className="text-xs text-white/30 mt-2 truncate">{dl.torrent}</p>}
                </div>
              )}

              {/* Done */}
              {!loading && dl.status === "done" && (
                <div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                    <p className="text-lg text-emerald-400 font-medium">✅ Descarga completada</p>
                    {dl.torrent && <p className="text-sm text-emerald-400/60 mt-2 truncate">{dl.torrent}</p>}
                    {dl.sizeGB && <p className="text-xs text-white/30 mt-1">{dl.sizeGB} GB</p>}
                  </div>

                  {/* Report problem */}
                  {!showReport ? (
                    <button onClick={() => setShowReport(true)} className="mt-4 text-sm text-white/30 hover:text-white/50 transition-colors">
                      Reportar problema
                    </button>
                  ) : (
                    <div className="mt-4 bg-white/[0.03] border border-white/10 rounded-xl p-5">
                      <p className="text-sm text-white/60 mb-3">¿Qué salió mal? (ej: "el idioma no es correcto", "la calidad es mala")</p>
                      <textarea
                        value={reportText}
                        onChange={e => setReportText(e.target.value)}
                        className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-white/25 resize-none"
                        rows={2}
                        placeholder="Describe el problema..."
                      />
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => download(reportText)}
                          disabled={!reportText.trim()}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all"
                        >
                          Buscar otra opción
                        </button>
                        <button onClick={() => setShowReport(false)} className="text-sm text-white/30 hover:text-white/50 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Failed */}
              {!loading && dl.status === "failed" && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                  <p className="text-lg text-red-400 font-medium">❌ Error</p>
                  <p className="text-sm text-white/40 mt-2">{dl.step}</p>
                  <button onClick={() => download()} className="mt-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all">
                    Reintentar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
