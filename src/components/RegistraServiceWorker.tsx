"use client";

import { useEffect } from "react";

/**
 * Registra il service worker che permette di rivedere la libreria e le
 * statistiche già caricate anche senza connessione internet.
 */
export default function RegistraServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Registrazione service worker fallita:", err);
      });
    }
  }, []);

  return null;
}
