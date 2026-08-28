"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";

// Larghezza massima della foto della copertina inviata per il riconoscimento:
// abbastanza per leggere bene il testo, senza appesantire troppo la richiesta.
const LARGHEZZA_MASSIMA_FOTO = 1024;

export default function ScannerISBN({
  onRilevato,
  onCopertinaRilevata,
  onChiudi,
}: {
  onRilevato: (codice: string) => void;
  onCopertinaRilevata: (titolo: string, autore: string | null) => void;
  onChiudi: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlliRef = useRef<IScannerControls | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [analisiInCorso, setAnalisiInCorso] = useState(false);
  const [erroreCopertina, setErroreCopertina] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let annullato = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (risultato) => {
        if (risultato && !annullato) {
          onRilevato(risultato.getText());
        }
      })
      .then((controlli) => {
        if (annullato) {
          controlli.stop();
        } else {
          controlliRef.current = controlli;
        }
      })
      .catch((err) => {
        console.error("Errore avvio fotocamera:", err);
        setErrore(
          "Impossibile accedere alla fotocamera. Controlla di aver dato il permesso al browser."
        );
      });

    return () => {
      annullato = true;
      controlliRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function scattaCopertina() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    setErroreCopertina(null);
    setAnalisiInCorso(true);

    try {
      const scala = Math.min(1, LARGHEZZA_MASSIMA_FOTO / video.videoWidth);
      canvas.width = video.videoWidth * scala;
      canvas.height = video.videoHeight * scala;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Impossibile catturare l'immagine.");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const immagine = canvas.toDataURL("image/jpeg", 0.85);

      const res = await fetch("/api/riconosci-copertina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ immagine }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errore ?? "Riconoscimento non riuscito");

      if (!data.titolo) {
        setErroreCopertina(
          "Non sono riuscito a leggere il titolo dalla copertina. Prova ad avvicinarti, migliora la luce, oppure cerca il libro per nome."
        );
        return;
      }

      onCopertinaRilevata(data.titolo, data.autore ?? null);
    } catch (err) {
      setErroreCopertina(
        err instanceof Error ? err.message : "Riconoscimento non riuscito, riprova."
      );
    } finally {
      setAnalisiInCorso(false);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">Cerca un libro con la fotocamera</h2>
        <button onClick={onChiudi} className="text-sm text-muted hover:text-foreground">
          ✕ Chiudi
        </button>
      </div>

      {errore ? (
        <p className="text-danger text-sm">{errore}</p>
      ) : (
        <div className="rounded-lg overflow-hidden bg-black aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        </div>
      )}

      <p className="text-xs text-muted">
        Inquadra il codice a barre ISBN (di solito sul retro, inizia spesso con 978 o 979): viene
        rilevato automaticamente. In alternativa, se non c&apos;è un codice a barre leggibile,
        inquadra la copertina del libro e premi il pulsante qui sotto.
      </p>

      <button
        type="button"
        onClick={scattaCopertina}
        disabled={!!errore || analisiInCorso}
        className="text-sm bg-accent hover:bg-accent-strong text-accent-contrast font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60"
      >
        {analisiInCorso ? "Sto riconoscendo il libro..." : "📖 Riconosci dalla copertina"}
      </button>

      {erroreCopertina && <p className="text-danger text-xs">{erroreCopertina}</p>}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
