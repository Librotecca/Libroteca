"use client";

import { useState } from "react";
import BarraProgresso from "@/components/BarraProgresso";

export default function ObiettivoAnnuale({
  anno,
  lettiQuestAnno,
  obiettivoIniziale,
}: {
  anno: number;
  lettiQuestAnno: number;
  obiettivoIniziale: number | null;
}) {
  const [obiettivo, setObiettivo] = useState(obiettivoIniziale);
  const [modifica, setModifica] = useState(obiettivoIniziale === null);
  const [valoreInput, setValoreInput] = useState(String(obiettivoIniziale ?? 12));
  const [salvando, setSalvando] = useState(false);

  async function salva() {
    const nuovo = Math.max(1, parseInt(valoreInput, 10) || 1);
    setSalvando(true);
    const res = await fetch("/api/profilo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obiettivo_lettura_annuale: nuovo }),
    });
    setSalvando(false);
    if (res.ok) {
      setObiettivo(nuovo);
      setModifica(false);
    }
  }

  if (modifica) {
    return (
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <label className="text-sm text-white/80">Obiettivo per il {anno}:</label>
        <input
          type="number"
          min={1}
          value={valoreInput}
          onChange={(e) => setValoreInput(e.target.value)}
          className="w-20 bg-white/15 border border-white/30 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-white/60"
        />
        <span className="text-sm text-white/80">libri</span>
        <button
          onClick={salva}
          disabled={salvando}
          className="text-sm bg-white/15 hover:bg-white/25 border border-white/30 rounded-lg px-3 py-1 transition-colors disabled:opacity-50"
        >
          Salva
        </button>
      </div>
    );
  }

  const percento = obiettivo ? (lettiQuestAnno / obiettivo) * 100 : 0;
  const completato = obiettivo !== null && lettiQuestAnno >= obiettivo;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-sm text-white/90 mb-1.5">
        <span>
          {completato
            ? `Obiettivo raggiunto! ${lettiQuestAnno}/${obiettivo} libri 🎉`
            : `${lettiQuestAnno} di ${obiettivo} libri nel ${anno}`}
        </span>
        <button onClick={() => setModifica(true)} className="text-white/70 hover:text-white underline">
          modifica
        </button>
      </div>
      <BarraProgresso percento={percento} traccia="bg-white/20" />
    </div>
  );
}
