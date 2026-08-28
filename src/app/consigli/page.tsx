"use client";

import { useEffect, useState } from "react";
import BookCard from "@/components/BookCard";
import type { Consiglio, StatoLettura } from "@/types";

type Voto = "mi_piace" | "non_mi_piace";

export default function ConsigliPage() {
  const [consigli, setConsigli] = useState<Consiglio[]>([]);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [caricamento, setCaricamento] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [aggiunti, setAggiunti] = useState<Record<string, boolean>>({});
  const [voti, setVoti] = useState<Record<string, Voto>>({});

  async function carica(rigenera = false) {
    try {
      const res = await fetch(`/api/consigli${rigenera ? "?rigenera=true" : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.errore ?? "Errore nel caricamento dei consigli");
      setConsigli(data.consigli ?? []);
      setMessaggio(data.messaggio ?? null);
      setGeneratedAt(data.generated_at ?? null);
      setErrore(null);
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setCaricamento(false);
    }
  }

  function rigenera() {
    setCaricamento(true);
    carica(true);
  }

  useEffect(() => {
    // Caricamento iniziale dei consigli al montaggio della pagina.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carica();
  }, []);

  async function aggiungiADaLeggere(consiglio: Consiglio) {
    if (!consiglio.libro) return;
    const stato: StatoLettura = "da_leggere";
    const res = await fetch("/api/libri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ libro: consiglio.libro, stato }),
    });
    if (res.ok) {
      setAggiunti((prev) => ({ ...prev, [consiglio.titolo]: true }));
    }
  }

  async function vota(consiglio: Consiglio, voto: Voto) {
    setVoti((prev) => ({ ...prev, [consiglio.titolo]: voto }));
    await fetch("/api/consigli/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titolo: consiglio.titolo, autore: consiglio.autore, voto }),
    });
    if (voto === "non_mi_piace") {
      // Rimuovi subito dalla vista: non verrà più riproposto nelle prossime generazioni.
      setConsigli((prev) => prev.filter((c) => c.titolo !== consiglio.titolo));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Consigliati per te</h1>
          <p className="text-muted text-sm mt-1">
            Generati da Claude in base ai libri che hai letto e valutato.
          </p>
        </div>
        <button
          onClick={rigenera}
          disabled={caricamento}
          className="text-sm bg-surface-2 hover:bg-border rounded-lg px-4 py-2 transition-colors disabled:opacity-60"
        >
          {caricamento ? "Genero..." : "🔄 Rigenera consigli"}
        </button>
      </div>

      {generatedAt && !caricamento && (
        <p className="text-xs text-muted -mt-4">
          Ultimo aggiornamento: {new Date(generatedAt).toLocaleString("it-IT")}
        </p>
      )}

      {caricamento && <p className="text-muted text-sm">Sto pensando a qualche buon libro per te...</p>}

      {errore && <p className="text-danger text-sm">{errore}</p>}

      {!caricamento && messaggio && <p className="text-muted text-sm">{messaggio}</p>}

      <div className="flex flex-col gap-3">
        {consigli.map((c) => {
          const voto = voti[c.titolo];
          const bottoniVoto = (
            <div className="flex items-center gap-1">
              <button
                onClick={() => vota(c, "mi_piace")}
                title="Mi piace"
                className={`text-sm px-2 py-1 rounded-full transition-colors ${
                  voto === "mi_piace" ? "bg-accent/20" : "hover:bg-surface-2"
                }`}
              >
                👍
              </button>
              <button
                onClick={() => vota(c, "non_mi_piace")}
                title="Non mi interessa"
                className="text-sm px-2 py-1 rounded-full hover:bg-surface-2 transition-colors"
              >
                👎
              </button>
            </div>
          );

          return (
            <div key={c.titolo} className="flex flex-col gap-2">
              {c.libro ? (
                <BookCard libro={c.libro}>
                  <p className="text-xs text-accent-strong italic mb-2">&ldquo;{c.motivo}&rdquo;</p>
                  <div className="flex items-center justify-between gap-2">
                    {aggiunti[c.titolo] ? (
                      <span className="text-sm text-accent-strong">
                        ✓ Aggiunto a &ldquo;Da leggere&rdquo;
                      </span>
                    ) : (
                      <button
                        onClick={() => aggiungiADaLeggere(c)}
                        className="text-xs px-2.5 py-1 rounded-full bg-surface-2 hover:bg-border transition-colors"
                      >
                        + Da leggere
                      </button>
                    )}
                    {bottoniVoto}
                  </div>
                </BookCard>
              ) : (
                <div className="bg-surface border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{c.titolo}</h3>
                      <p className="text-sm text-muted">{c.autore}</p>
                    </div>
                    {bottoniVoto}
                  </div>
                  <p className="text-xs text-accent-strong italic mt-1">&ldquo;{c.motivo}&rdquo;</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
