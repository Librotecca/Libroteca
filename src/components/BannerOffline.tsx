"use client";

import { useEffect, useState } from "react";

/**
 * Mostra un avviso quando il dispositivo perde la connessione, per chiarire
 * che si sta vedendo l'ultima versione salvata della libreria e che aggiunte
 * o modifiche non sono disponibili finché non si torna online.
 */
export default function BannerOffline() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Stato iniziale letto al montaggio: sappiamo se siamo offline solo lato client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOffline(!navigator.onLine);

    function aggiornaStato() {
      setOffline(!navigator.onLine);
    }

    window.addEventListener("online", aggiornaStato);
    window.addEventListener("offline", aggiornaStato);
    return () => {
      window.removeEventListener("online", aggiornaStato);
      window.removeEventListener("offline", aggiornaStato);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="bg-accent/15 text-accent-strong text-xs text-center py-1.5 px-4">
      Sei offline: stai vedendo l&apos;ultima versione salvata della tua libreria. Aggiunte e
      modifiche non sono disponibili finché non torni online.
    </div>
  );
}
