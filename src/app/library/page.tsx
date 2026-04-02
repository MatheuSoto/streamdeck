"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface LibraryItem {
  id: string;
  name: string;
  size: string;
  status: string;
  added: string;
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/library").then(r => r.json()).then(setItems).finally(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    setDeleting(id);
    await fetch("/api/add", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleting(null);
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white antialiased">
      <header className="sticky top-0 z-50 bg-[#141414] border-b border-white/[0.06]">
        <div className="px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-bold text-white hover:opacity-80 transition-opacity">StreamDeck</Link>
            <span className="text-lg text-white/50">/ Librería</span>
          </div>
          <span className="text-sm text-white/30">{items.length} elementos</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 pt-8 pb-24">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-white/30 mb-4">Tu librería está vacía</p>
            <Link href="/" className="text-red-400 hover:text-red-300 transition-colors">Buscar películas →</Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-4 rounded-xl bg-[#1a1a1a] border border-white/[0.06] hover:border-white/10 transition-all">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm text-white/40">{item.size} GB</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "downloaded" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {item.status === "downloaded" ? "Listo" : item.status}
                    </span>
                    <span className="text-xs text-white/20">{new Date(item.added).toLocaleDateString("es-PE")}</span>
                  </div>
                </div>
                <button
                  onClick={() => remove(item.id)}
                  disabled={deleting === item.id}
                  className="text-sm text-red-400/60 hover:text-red-400 border border-red-400/20 hover:border-red-400/40 px-4 py-2 rounded-lg transition-all flex-shrink-0 disabled:opacity-40"
                >
                  {deleting === item.id ? "..." : "Eliminar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
