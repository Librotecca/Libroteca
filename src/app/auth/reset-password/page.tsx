"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Pagina dove l'utente atterra dal link "password dimenticata" ricevuto via
// email (dopo lo scambio del codice in /auth/callback, che lo porta qui con
// una sessione di recupero già attiva) per impostare una nuova password.
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confermaPassword, setConfermaPassword] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [caricamento, setCaricamento] = useState(false);
  const [completato, setCompletato] = useState(false);

  async function salvaNuovaPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);

    if (password !== confermaPassword) {
      setErrore("Le due password non coincidono.");
      return;
    }

    setCaricamento(true);
    const { error } = await supabase.auth.updateUser({ password });
    setCaricamento(false);

    if (error) {
      setErrore(
        error.message === "Auth session missing!"
          ? "Il link non è più valido. Richiedi un nuovo link dalla pagina di login."
          : error.message
      );
      return;
    }

    setCompletato(true);
    setTimeout(() => {
      router.push("/libreria");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="max-w-sm mx-auto mt-16 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-accent-strong">📚 Libroteca</h1>
        <p className="text-muted mt-1 text-sm">Imposta la tua nuova password.</p>
      </div>

      {completato ? (
        <div className="bg-surface border border-border rounded-lg p-4 text-sm text-center">
          Password aggiornata. Ti stiamo portando alla tua libreria...
        </div>
      ) : (
        <form onSubmit={salvaNuovaPassword} className="flex flex-col gap-3">
          <input
            type="password"
            required
            minLength={6}
            placeholder="Nuova password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="bg-surface border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Conferma nuova password"
            value={confermaPassword}
            onChange={(e) => setConfermaPassword(e.target.value)}
            autoComplete="new-password"
            className="bg-surface border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={caricamento}
            className="bg-accent hover:bg-accent-strong text-[#14110f] font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            {caricamento ? "Un momento..." : "Salva nuova password"}
          </button>
          {errore && <p className="text-danger text-sm text-center">{errore}</p>}
        </form>
      )}
    </div>
  );
}
