"use client";

import { useState } from "react";
import BookCard from "@/components/BookCard";
import ScannerISBN from "@/components/ScannerISBN";
import type { Libro, StatoLettura } from "@/types";
import { ETICHETTE_STATO } from "@/types";

export default function CercaPage() {
  const [query, setQuery] = useState("");
  const [risultati, setRisultati] = useState<Libro[]>([]);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [aggiunti, setAggiunti] = useState<Record<string, StatoLettura>>({});
  const [scannerAperto, setScannerAperto] = useState(false);

  async function eseguiRicerca(testo: string) {
    if (!testo.trim()) return;
    setCaricamento(true);
    setErrore(null);

    try {
      const res = await fetch(`/api/cerca-libri?q=${encodeURIComponent(testo)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.errore ?? "Errore di ricerca");
      setRisultati(data.risultati);
      if (data.risultati.length === 0) {
        setErrore("Nessun libro trovato con questo codice. Prova con la ricerca per titolo.");
      }
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore di ricerca");
    } finally {
      setCaricamento(false);
    }
  }

  function cerca(e: React.FormEvent) {
    e.preventDefault();
    eseguiRicerca(query);
  }

  function codiceRilevato(codice: string) {
    setScannerAperto(false);
    setQuery(codice);
    eseguiRicerca(`isbn:${codice}`);
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
          Cerca nel catalogo Google Books + Open Library (con priorità ai libri in italiano) e
          aggiungi alla tua libreria.
        </p>
      </div>

      <div className="flex gap-2">
        <form onSubmit={cerca} className="flex gap-2 flex-1">
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
            className="bg-accent hover:bg-accent-strong text-accent-contrast font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60"
          >
            {caricamento ? "..." : "Cerca"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setScannerAperto((v) => !v)}
          title="Scansiona codice a barre ISBN"
          className="shrink-0 bg-surface-2 hover:bg-border rounded-lg px-4 py-2.5 transition-colors"
        >
          📷
        </button>
      </div>

      {scannerAperto && (
        <ScannerISBN onRilevato={codiceRilevato} onChiudi={() => setScannerAperto(false)} />
      )}

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
