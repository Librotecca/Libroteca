"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Famiglia, MembroFamiglia } from "@/types";

export default function FamigliaClient({
  famigliaIniziale,
  membriIniziali,
  userId,
}: {
  famigliaIniziale: Famiglia | null;
  membriIniziali: MembroFamiglia[];
  userId: string;
}) {
  const router = useRouter();
  const [famiglia, setFamiglia] = useState(famigliaIniziale);
  const [membri, setMembri] = useState(membriIniziali);
  const [nome, setNome] = useState("");
  const [codice, setCodice] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [caricamento, setCaricamento] = useState(false);
  const [copiato, setCopiato] = useState(false);
  const [rimuovendo, setRimuovendo] = useState<string | null>(null);
  const [confermaEliminazione, setConfermaEliminazione] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const sonoCreatore = membri.find((m) => m.user_id === userId)?.ruolo === "creatore";

  async function ricarica() {
    const res = await fetch("/api/famiglia");
    const data = await res.json();
    setFamiglia(data.famiglia);
    setMembri(data.membri ?? []);
  }

  async function creaFamiglia(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setCaricamento(true);
    const res = await fetch("/api/famiglia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    const data = await res.json();
    setCaricamento(false);
    if (!res.ok) {
      setErrore(data.errore ?? "Errore sconosciuto");
      return;
    }
    await ricarica();
  }

  async function unisciti(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setCaricamento(true);
    const res = await fetch("/api/famiglia/unisciti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codice }),
    });
    const data = await res.json();
    setCaricamento(false);
    if (!res.ok) {
      setErrore(data.errore ?? "Errore sconosciuto");
      return;
    }
    await ricarica();
  }

  async function esci() {
    if (!confirm("Sei sicuro di voler uscire dalla famiglia?")) return;
    const res = await fetch("/api/famiglia", { method: "DELETE" });
    if (res.ok) {
      setFamiglia(null);
      setMembri([]);
      router.refresh();
    }
  }

  async function rimuoviMembro(id: string) {
    if (
      !confirm(
        "Rimuovere questa persona dalla famiglia? Manterrà il proprio account, ma non vedrà più la libreria condivisa (potrai invitarla di nuovo in futuro)."
      )
    )
      return;

    setErrore(null);
    setRimuovendo(id);
    const res = await fetch(`/api/famiglia/membri/${id}`, { method: "DELETE" });
    setRimuovendo(null);

    if (res.ok) {
      await ricarica();
    } else {
      const data = await res.json().catch(() => ({}));
      setErrore(data.errore ?? "Impossibile rimuovere il membro.");
    }
  }

  async function eliminaAccount(id: string) {
    setErrore(null);
    setEliminando(id);
    const res = await fetch(`/api/famiglia/membri/${id}/account`, { method: "DELETE" });
    setEliminando(null);
    setConfermaEliminazione(null);

    if (res.ok) {
      await ricarica();
    } else {
      const data = await res.json().catch(() => ({}));
      setErrore(data.errore ?? "Impossibile eliminare l'account.");
    }
  }

  function copiaLink() {
    if (!famiglia) return;
    const link = `${window.location.origin}/famiglia/unisciti/${famiglia.codice_invito}`;
    navigator.clipboard.writeText(link);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 2000);
  }

  if (!famiglia) {
    return (
      <div className="flex flex-col gap-8 max-w-md">
        <div>
          <h1 className="text-xl font-semibold">Famiglia</h1>
          <p className="text-muted text-sm mt-1">
            Crea un gruppo famiglia o unisciti con un codice invito per vedere cosa leggono gli
            altri (e mostrare cosa leggi tu).
          </p>
        </div>

        <form onSubmit={creaFamiglia} className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
          <h2 className="font-medium">Crea una famiglia</h2>
          <input
            type="text"
            required
            placeholder="Nome della famiglia (es. Famiglia Monti)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={caricamento}
            className="bg-accent hover:bg-accent-strong text-accent-contrast font-medium rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-60"
          >
            Crea
          </button>
        </form>

        <form onSubmit={unisciti} className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
          <h2 className="font-medium">Ho un codice invito</h2>
          <input
            type="text"
            required
            placeholder="Codice invito"
            value={codice}
            onChange={(e) => setCodice(e.target.value)}
            className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors uppercase"
          />
          <button
            type="submit"
            disabled={caricamento}
            className="bg-surface-2 hover:bg-border rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-60"
          >
            Unisciti
          </button>
        </form>

        {errore && <p className="text-danger text-sm">{errore}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold">{famiglia.nome}</h1>
        <p className="text-muted text-sm mt-1">
          Tutti i membri vedono le librerie (stato, voti e note) di tutti gli altri.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-2">
        <span className="text-sm text-muted">Link di invito</span>
        <div className="flex gap-2 min-w-0">
          <input
            readOnly
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/famiglia/unisciti/${famiglia.codice_invito}`}
            className="flex-1 min-w-0 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-muted"
          />
          <button
            onClick={copiaLink}
            className="text-sm bg-accent hover:bg-accent-strong text-accent-contrast font-medium rounded-lg px-4 py-2 transition-colors shrink-0"
          >
            {copiato ? "Copiato!" : "Copia"}
          </button>
        </div>
      </div>

      {errore && <p className="text-danger text-sm">{errore}</p>}

      <div className="flex flex-col gap-2">
        <h2 className="font-medium">Membri ({membri.length})</h2>
        {membri.map((m) => (
          <div
            key={m.user_id}
            className="flex flex-col gap-2 bg-surface border border-border rounded-lg p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-sm">
                  {m.profilo?.nome_visualizzato ?? m.profilo?.email ?? "Utente"}
                  {m.user_id === userId && " (tu)"}
                </span>
                {m.ruolo === "creatore" && (
                  <span className="text-xs text-accent-strong ml-2">creatore</span>
                )}
              </div>
              {m.user_id !== userId && (
                <Link href={`/famiglia/${m.user_id}`} className="text-xs text-accent underline shrink-0">
                  Vedi libreria
                </Link>
              )}
            </div>

            {sonoCreatore && m.user_id !== userId && (
              <div className="flex items-center gap-4 pt-2 border-t border-border">
                <button
                  onClick={() => rimuoviMembro(m.user_id)}
                  disabled={rimuovendo === m.user_id}
                  className="text-xs text-muted hover:text-foreground transition-colors disabled:opacity-60"
                >
                  {rimuovendo === m.user_id ? "Rimuovo..." : "Rimuovi dalla famiglia"}
                </button>
                <button
                  onClick={() => setConfermaEliminazione(m.user_id)}
                  className="text-xs text-danger hover:underline"
                >
                  Elimina account
                </button>
              </div>
            )}

            {confermaEliminazione === m.user_id && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 flex flex-col gap-2">
                <p className="text-xs text-danger">
                  Questo eliminerà per sempre l&apos;account di{" "}
                  <strong>{m.profilo?.nome_visualizzato ?? m.profilo?.email ?? "questo utente"}</strong>
                  : email, accesso e tutta la sua libreria personale. Non è reversibile.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => eliminaAccount(m.user_id)}
                    disabled={eliminando === m.user_id}
                    className="text-xs bg-danger text-white font-medium rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
                  >
                    {eliminando === m.user_id ? "Elimino..." : "Sì, elimina definitivamente"}
                  </button>
                  <button
                    onClick={() => setConfermaEliminazione(null)}
                    className="text-xs bg-surface-2 hover:bg-border rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={esci} className="text-sm text-danger self-start hover:underline">
        Esci dalla famiglia
      </button>
    </div>
  );
}
