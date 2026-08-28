"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BookCard from "@/components/BookCard";
import ShelfBadge from "@/components/ShelfBadge";
import StarRating from "@/components/StarRating";
import { ETICHETTE_STATO, type StatoLettura, type VoceLibreria } from "@/types";

const TAB: (StatoLettura | "tutti")[] = ["tutti", "da_leggere", "in_lettura", "letto", "abbandonato"];

export default function LibreriaClient({ voci }: { voci: VoceLibreria[] }) {
  const [tab, setTab] = useState<(typeof TAB)[number]>("tutti");

  const vociFiltrate = useMemo(
    () => (tab === "tutti" ? voci : voci.filter((v) => v.stato === tab)),
    [voci, tab]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">La tua libreria</h1>
        <Link
          href="/cerca"
          className="text-sm bg-accent hover:bg-accent-strong text-[#14110f] font-medium rounded-lg px-4 py-2 transition-colors"
        >
          + Aggiungi libro
        </Link>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
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

      {vociFiltrate.length === 0 ? (
        <p className="text-muted text-sm text-center py-12">
          Nessun libro qui. {tab === "tutti" && (
            <>
              Vai su <Link href="/cerca" className="text-accent underline">Cerca</Link> per
              aggiungerne uno.
            </>
          )}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {vociFiltrate.map((voce) =>
            voce.libro ? (
              <Link key={voce.id} href={`/libro/${voce.id}`}>
                <BookCard libro={voce.libro} compatto>
                  <div className="flex items-center gap-3">
                    <ShelfBadge stato={voce.stato} />
                    {voce.valutazione && <StarRating valore={voce.valutazione} leggibile />}
                  </div>
                </BookCard>
              </Link>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
