"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnisciteClient({ codice }: { codice: string }) {
  const router = useRouter();
  const [stato, setStato] = useState<"pronto" | "caricamento" | "errore" | "fatto">("pronto");
  const [errore, setErrore] = useState<string | null>(null);

  async function conferma() {
    setStato("caricamento");
    const res = await fetch("/api/famiglia/unisciti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codice }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrore(data.errore ?? "Errore sconosciuto");
      setStato("errore");
      return;
    }
    setStato("fatto");
    setTimeout(() => {
      router.push("/famiglia");
      router.refresh();
    }, 1200);
  }

  return (
    <div className="max-w-sm mx-auto mt-16 flex flex-col gap-4 text-center">
      <h1 className="text-xl font-semibold">Invito famiglia</h1>

      {stato === "fatto" ? (
        <p className="text-accent-strong text-sm">Fatto! Ti sto portando alla pagina famiglia...</p>
      ) : (
        <>
          <p className="text-muted text-sm">
            Sei stato invitato a unirti a una famiglia su Libroteca. Se accetti, gli altri membri
            potranno vedere la tua libreria (e tu la loro).
          </p>
          <button
            onClick={conferma}
            disabled={stato === "caricamento"}
            className="bg-accent hover:bg-accent-strong text-[#14110f] font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            {stato === "caricamento" ? "Un momento..." : "Unisciti alla famiglia"}
          </button>
          {errore && <p className="text-danger text-sm">{errore}</p>}
        </>
      )}
    </div>
  );
}
