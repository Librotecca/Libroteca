"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { Libro, StatoLettura } from "@/types";
import { ETICHETTE_STATO } from "@/types";
import CopertinaPlaceholder from "@/components/CopertinaPlaceholder";

/**
 * Popup con tutti i dettagli di un libro trovato in ricerca, da cui si può
 * scegliere direttamente lo scaffale (da leggere / in lettura / letto /
 * abbandonato) senza dover tornare all'elenco dei risultati.
 */
export default function ModaleLibro({
  libro,
  statoAttuale,
  onAggiungi,
  onChiudi,
}: {
  libro: Libro;
  statoAttuale: StatoLettura | null;
  onAggiungi: (stato: StatoLettura) => void;
  onChiudi: () => void;
}) {
  useEffect(() => {
    function suTastoPremuto(e: KeyboardEvent) {
      if (e.key === "Escape") onChiudi();
    }
    window.addEventListener("keydown", suTastoPremuto);
    return () => window.removeEventListener("keydown", suTastoPremuto);
  }, [onChiudi]);

  const dettagli = [libro.editore, libro.data_pubblicazione, libro.pagine ? `${libro.pagine} pagine` : null].filter(
    Boolean
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
      onClick={onChiudi}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-1 -mr-1">
          <button
            type="button"
            onClick={onChiudi}
            aria-label="Chiudi"
            className="text-muted hover:text-foreground text-xl leading-none px-2 py-1 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-4 -mt-6">
          <div className="shrink-0 w-24 h-36 bg-surface-2 rounded overflow-hidden relative">
            {libro.immagine_url ? (
              <Image
                src={libro.immagine_url}
                alt={libro.titolo}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-3">
                <CopertinaPlaceholder />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-semibold leading-tight">{libro.titolo}</h2>
            {libro.sottotitolo && <p className="text-sm text-muted mt-0.5">{libro.sottotitolo}</p>}
            {libro.autori.length > 0 && <p className="text-sm text-muted mt-1.5">{libro.autori.join(", ")}</p>}
            {dettagli.length > 0 && (
              <p className="text-xs text-muted mt-2 leading-relaxed">{dettagli.join(" · ")}</p>
            )}
          </div>
        </div>

        {libro.categorie.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {libro.categorie.map((c) => (
              <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted">
                {c}
              </span>
            ))}
          </div>
        )}

        {libro.descrizione && (
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{libro.descrizione}</p>
        )}

        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium mb-2">
            {statoAttuale ? "Nella tua libreria come:" : "Aggiungi alla tua libreria"}
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ETICHETTE_STATO) as StatoLettura[]).map((stato) => (
              <button
                key={stato}
                type="button"
                onClick={() => onAggiungi(stato)}
                className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                  statoAttuale === stato
                    ? "bg-accent text-accent-contrast"
                    : "bg-surface-2 hover:bg-border"
                }`}
              >
                {statoAttuale === stato ? "✓ " : "+ "}
                {ETICHETTE_STATO[stato]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
