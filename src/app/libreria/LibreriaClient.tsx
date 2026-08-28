"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BookCard from "@/components/BookCard";
import BookCoverCard from "@/components/BookCoverCard";
import ShelfBadge from "@/components/ShelfBadge";
import StarRating from "@/components/StarRating";
import BarraProgresso from "@/components/BarraProgresso";
import HeroBand from "@/components/HeroBand";
import EmptyState from "@/components/EmptyState";
import { ETICHETTE_STATO, type StatoLettura, type VoceLibreria } from "@/types";

const TAB: (StatoLettura | "tutti")[] = ["tutti", "da_leggere", "in_lettura", "letto", "abbandonato"];

function percentoDi(voce: VoceLibreria): number | null {
  return voce.libro?.pagine && voce.pagina_corrente
    ? (voce.pagina_corrente / voce.libro.pagine) * 100
    : null;
}

export default function LibreriaClient({ voci }: { voci: VoceLibreria[] }) {
  const [tab, setTab] = useState<(typeof TAB)[number]>("tutti");
  const [vista, setVista] = useState<"griglia" | "lista">("griglia");

  const vociFiltrate = useMemo(
    () => (tab === "tutti" ? voci : voci.filter((v) => v.stato === tab)),
    [voci, tab]
  );

  return (
    <div className="flex flex-col gap-6">
      <HeroBand
        titolo="La tua libreria"
        sottotitolo={`${voci.length} ${voci.length === 1 ? "libro" : "libri"} in totale`}
      >
        <Link
          href="/cerca"
          className="mt-3 self-start text-sm bg-white/15 hover:bg-white/25 border border-white/30 text-white font-medium rounded-lg px-4 py-2 transition-colors backdrop-blur-sm"
        >
          + Aggiungi libro
        </Link>
      </HeroBand>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 border-b border-border overflow-x-auto flex-1">
          {TAB.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                tab === t
                  ? "border-accent text-accent-strong"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t === "tutti" ? "Tutti" : ETICHETTE_STATO[t]}
              <span className="ml-1 text-xs text-muted">
                ({t === "tutti" ? voci.length : voci.filter((v) => v.stato === t).length})
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-surface-2 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setVista("griglia")}
            aria-label="Vista a griglia"
            title="Vista a griglia"
            className={`px-2 py-1.5 rounded-md text-sm transition-colors ${
              vista === "griglia" ? "bg-surface shadow-sm" : "text-muted"
            }`}
          >
            ▦
          </button>
          <button
            onClick={() => setVista("lista")}
            aria-label="Vista a lista"
            title="Vista a lista"
            className={`px-2 py-1.5 rounded-md text-sm transition-colors ${
              vista === "lista" ? "bg-surface shadow-sm" : "text-muted"
            }`}
          >
            ☰
          </button>
        </div>
      </div>

      {vociFiltrate.length === 0 ? (
        <EmptyState
          titolo={tab === "tutti" ? "La tua libreria è ancora vuota" : "Nessun libro qui"}
          descrizione={
            tab === "tutti"
              ? "Cerca un titolo e aggiungilo per iniziare a tenere traccia delle tue letture."
              : "Non hai libri in questa categoria."
          }
          azione={
            tab === "tutti" ? (
              <Link
                href="/cerca"
                className="text-sm bg-accent hover:bg-accent-strong text-accent-contrast font-medium rounded-lg px-4 py-2 transition-colors"
              >
                Cerca un libro
              </Link>
            ) : undefined
          }
        />
      ) : vista === "griglia" ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
          {vociFiltrate.map((voce) =>
            voce.libro ? (
              <Link key={voce.id} href={`/libro/${voce.id}`}>
                <BookCoverCard libro={voce.libro} stato={voce.stato} percentoLetto={percentoDi(voce)} />
              </Link>
            ) : null
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {vociFiltrate.map((voce) => {
            const percento = percentoDi(voce);
            return voce.libro ? (
              <Link key={voce.id} href={`/libro/${voce.id}`}>
                <BookCard libro={voce.libro} compatto>
                  <div className="flex items-center gap-3">
                    <ShelfBadge stato={voce.stato} />
                    {voce.valutazione && <StarRating valore={voce.valutazione} leggibile />}
                  </div>
                  {percento !== null && (
                    <div className="mt-2 max-w-40">
                      <BarraProgresso percento={percento} altezza="h-1.5" />
                    </div>
                  )}
                </BookCard>
              </Link>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
