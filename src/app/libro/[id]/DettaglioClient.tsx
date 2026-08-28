"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";
import { ETICHETTE_STATO, type StatoLettura, type VoceLibreria } from "@/types";

export default function DettaglioClient({ voce: iniziale }: { voce: VoceLibreria }) {
  const router = useRouter();
  const [voce, setVoce] = useState(iniziale);
  const [note, setNote] = useState(iniziale.note ?? "");
  const [salvando, setSalvando] = useState(false);
  const libro = voce.libro!;

  async function aggiorna(campi: Partial<VoceLibreria>) {
    setSalvando(true);
    const res = await fetch("/api/libri", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: voce.id, ...campi }),
    });
    setSalvando(false);
    if (res.ok) {
      const { voce: aggiornata } = await res.json();
      setVoce((prev) => ({ ...prev, ...aggiornata }));
    }
  }

  async function rimuovi() {
    if (!confirm(`Rimuovere "${libro.titolo}" dalla libreria?`)) return;
    const res = await fetch(`/api/libri?id=${voce.id}`, { method: "DELETE" });
    if (res.ok) router.push("/libreria");
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex gap-4">
        <div className="shrink-0 w-28 h-40 bg-surface-2 rounded overflow-hidden relative">
          {libro.immagine_url ? (
            <Image
              src={libro.immagine_url}
              alt={libro.titolo}
              fill
              sizes="112px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold leading-tight">{libro.titolo}</h1>
          {libro.sottotitolo && <p className="text-muted text-sm">{libro.sottotitolo}</p>}
          {libro.autori.length > 0 && (
            <p className="text-muted mt-1">{libro.autori.join(", ")}</p>
          )}
          {libro.categorie.length > 0 && (
            <p className="text-xs text-muted mt-2">{libro.categorie.join(" · ")}</p>
          )}
          {libro.editore && (
            <p className="text-xs text-muted mt-1">
              {libro.editore}
              {libro.data_pubblicazione ? `, ${libro.data_pubblicazione}` : ""}
              {libro.pagine ? ` · ${libro.pagine} pagine` : ""}
            </p>
          )}
        </div>
      </div>

      {libro.descrizione && (
        <p className="text-sm text-muted leading-relaxed">{libro.descrizione}</p>
      )}

      <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-4">
        <div>
          <label className="text-sm text-muted block mb-1.5">Stato di lettura</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ETICHETTE_STATO) as StatoLettura[]).map((stato) => (
              <button
                key={stato}
                onClick={() => aggiorna({ stato })}
                className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                  voce.stato === stato
                    ? "bg-accent text-[#14110f] font-medium"
                    : "bg-surface-2 hover:bg-border"
                }`}
              >
                {ETICHETTE_STATO[stato]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-muted block mb-1.5">La tua valutazione</label>
          <StarRating valore={voce.valutazione} onChange={(v) => aggiorna({ valutazione: v })} />
        </div>

        <div>
          <label className="text-sm text-muted block mb-1.5">Note personali</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => aggiorna({ note })}
            rows={3}
            placeholder="Cosa ne pensi di questo libro?"
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        {salvando && <p className="text-xs text-muted">Salvataggio...</p>}
      </div>

      <button onClick={rimuovi} className="text-sm text-danger self-start hover:underline">
        Rimuovi dalla libreria
      </button>
    </div>
  );
}
