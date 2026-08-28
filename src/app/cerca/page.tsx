"use client";

import { useState } from "react";
import BookCard from "@/components/BookCard";
import type { Libro, StatoLettura } from "@/types";
import { ETICHETTE_STATO } from "@/types";

export default function CercaPage() {
  const [query, setQuery] = useState("");
  const [risultati, setRisultati] = useState<Libro[]>([]);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [aggiunti, setAggiunti] = useState<Record<string, StatoLettura>>({});

  async function cerca(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setCaricamento(true);
    setErrore(null);

    try {
      const res = await fetch(`/api/cerca-libri?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.errore ?? "Errore di ricerca");
      setRisultati(data.risultati);
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore di ricerca");
    } finally {
      setCaricamento(false);
    }
  }

  async function aggiungi(libro: Libro, stato: StatoLettura) {
    const res = await fetch("/api/libri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ libro, stato }),
    });
    if (res.ok) {
      setAggiunti((prev) => ({ ...prev, [libro.id]: stato }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Cerca un libro</h1>
        <p className="text-muted text-sm mt-1">
          Cerca nel catalogo Google Books (con priorità ai libri in italiano) e aggiungi alla tua
          libreria.
        </p>
      </div>

      <form onSubmit={cerca} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Titolo, autore..."
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={caricamento}
          className="bg-accent hover:bg-accent-strong text-[#14110f] font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60"
        >
          {caricamento ? "..." : "Cerca"}
        </button>
      </form>

      {errore && <p className="text-danger text-sm">{errore}</p>}

      <div className="flex flex-col gap-3">
        {risultati.map((libro) => (
          <BookCard key={libro.id} libro={libro}>
            {aggiunti[libro.id] ? (
              <span className="text-sm text-accent-strong">
                ✓ Aggiunto come &ldquo;{ETICHETTE_STATO[aggiunti[libro.id]]}&rdquo;
              </span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ETICHETTE_STATO) as StatoLettura[]).map((stato) => (
                  <button
                    key={stato}
                    onClick={() => aggiungi(libro, stato)}
                    className="text-xs px-2.5 py-1 rounded-full bg-surface-2 hover:bg-border transition-colors"
                  >
                    + {ETICHETTE_STATO[stato]}
                  </button>
                ))}
              </div>
            )}
          </BookCard>
        ))}
      </div>
    </div>
  );
}
