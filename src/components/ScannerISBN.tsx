"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";

export default function ScannerISBN({
  onRilevato,
  onChiudi,
}: {
  onRilevato: (codice: string) => void;
  onChiudi: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlliRef = useRef<IScannerControls | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

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

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">Inquadra il codice a barre (ISBN)</h2>
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
        Il codice a barre ISBN si trova di solito sul retro del libro, sopra o sotto il codice a
        barre stesso (inizia spesso con 978 o 979).
      </p>
    </div>
  );
}
