"use client";

import { useState } from "react";
import BookCard from "@/components/BookCard";
import ModaleLibro from "@/components/ModaleLibro";
import ScannerISBN from "@/components/ScannerISBN";
import type { Libro, StatoLettura } from "@/types";
import { ETICHETTE_STATO } from "@/types";

type TipoRicerca = "titolo" | "autore";

export default function CercaPage() {
  const [query, setQuery] = useState("");
  const [modalita, setModalita] = useState<TipoRicerca>("titolo");
  const [risultati, setRisultati] = useState<Libro[]>([]);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [aggiunti, setAggiunti] = useState<Record<string, StatoLettura>>({});
  const [scannerAperto, setScannerAperto] = useState(false);
  const [libroSelezionato, setLibroSelezionato] = useState<Libro | null>(null);

  async function cercaSulServer(testo: string, tipo: TipoRicerca): Promise<Libro[]> {
    const parametroTipo = tipo === "autore" ? "&tipo=autore" : "";
    const res = await fetch(`/api/cerca-libri?q=${encodeURIComponent(testo)}${parametroTipo}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.errore ?? "Errore di ricerca");
    return data.risultati as Libro[];
  }

  async function attesa(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Senza una API key di Google Books configurata, le richieste condividono
  // un limite di traffico pubblico con moltissime altre app: capita che una
  // singola richiesta venga rifiutata o rallentata anche se il libro esiste
  // davvero (da qui il "non lo trova, riprovo e lo trova"). Per non far
  // ripetere la ricerca a mano, ne facciamo fino a 3 in automatico, con una
  // breve pausa crescente tra un tentativo e l'altro (dà tempo al limite di
  // traffico di "liberarsi") prima di mostrare davvero "nessun risultato".
  const PAUSE_TENTATIVI_MS = [0, 700, 1400];

  async function cercaConRitentativi(testo: string, tipo: TipoRicerca): Promise<Libro[]> {
    let risultati: Libro[] = [];
    for (const pausa of PAUSE_TENTATIVI_MS) {
      if (pausa > 0) await attesa(pausa);
      risultati = await cercaSulServer(testo, tipo).catch(() => []);
      if (risultati.length > 0) break;
    }
    return risultati;
  }

  async function eseguiRicerca(testo: string, tipoForzato?: TipoRicerca) {
    if (!testo.trim()) return;
    const tipo = tipoForzato ?? modalita;
    setCaricamento(true);
    setErrore(null);

    try {
      const risultatiTrovati = await cercaConRitentativi(testo, tipo);

      setRisultati(risultatiTrovati);
      if (risultatiTrovati.length === 0) {
        setErrore(
          testo.toLowerCase().startsWith("isbn:")
            ? "Nessun libro trovato con questo codice. Prova con la ricerca per titolo."
            : tipo === "autore"
              ? "Nessun libro trovato per questo autore. Controlla come hai scritto il nome."
              : "Nessun libro trovato. Prova con altre parole o riprova tra poco."
        );
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
    // Ripulisce il codice letto dalla fotocamera da eventuali spazi/trattini,
    // così la ricerca ISBN riceve sempre solo cifre (e l'eventuale "X" finale).
    // Uno scan è sempre una ricerca per titolo/codice, indipendentemente dalla
    // modalità selezionata a mano.
    const codicePulito = codice.replace(/[^0-9Xx]/g, "");
    setScannerAperto(false);
    setModalita("titolo");
    setQuery(codicePulito);
    eseguiRicerca(`isbn:${codicePulito}`, "titolo");
  }

  function copertinaRilevata(titolo: string, autore: string | null) {
    const testo = autore ? `${titolo} ${autore}` : titolo;
    setScannerAperto(false);
    setModalita("titolo");
    setQuery(testo);
    eseguiRicerca(testo, "titolo");
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
          {modalita === "autore"
            ? "Trova tutti i libri di un autore, e solo di quell'autore."
            : "Cerca nel catalogo Google Books + Open Library (con priorità ai libri in italiano) e aggiungi alla tua libreria."}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModalita("titolo")}
          className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
            modalita === "titolo" ? "bg-accent text-accent-contrast" : "bg-surface-2 hover:bg-border"
          }`}
        >
          Per titolo
        </button>
        <button
          type="button"
          onClick={() => setModalita("autore")}
          className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
            modalita === "autore" ? "bg-accent text-accent-contrast" : "bg-surface-2 hover:bg-border"
          }`}
        >
          Per autore
        </button>
      </div>

      <div className="flex gap-2 min-w-0">
        <form onSubmit={cerca} className="flex gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={modalita === "autore" ? "Nome e cognome dell'autore..." : "Titolo, autore..."}
            className="flex-1 min-w-0 bg-surface border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={caricamento}
            className="shrink-0 bg-accent hover:bg-accent-strong text-accent-contrast font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60"
          >
            {caricamento ? "..." : "Cerca"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setScannerAperto((v) => !v)}
          title="Cerca con la fotocamera (codice a barre o copertina)"
          className="shrink-0 bg-surface-2 hover:bg-border rounded-lg px-4 py-2.5 transition-colors"
        >
          📷
        </button>
      </div>

      {scannerAperto && (
        <ScannerISBN
          onRilevato={codiceRilevato}
          onCopertinaRilevata={copertinaRilevata}
          onChiudi={() => setScannerAperto(false)}
        />
      )}

      {errore && <p className="text-danger text-sm">{errore}</p>}

      <div className="flex flex-col gap-3">
        {risultati.map((libro) => (
          <button
            key={libro.id}
            type="button"
            onClick={() => setLibroSelezionato(libro)}
            className="text-left w-full"
          >
            <BookCard libro={libro}>
              {aggiunti[libro.id] && (
                <span className="text-sm text-accent-strong">
                  ✓ Aggiunto come &ldquo;{ETICHETTE_STATO[aggiunti[libro.id]]}&rdquo;
                </span>
              )}
            </BookCard>
          </button>
        ))}
      </div>

      {libroSelezionato && (
        <ModaleLibro
          libro={libroSelezionato}
          statoAttuale={aggiunti[libroSelezionato.id] ?? null}
          onAggiungi={(stato) => aggiungi(libroSelezionato, stato)}
          onChiudi={() => setLibroSelezionato(null)}
        />
      )}
    </div>
  );
}
