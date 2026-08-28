"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Modalita = "password" | "link";
type AzionePassword = "accedi" | "registrati";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [modalita, setModalita] = useState<Modalita>("password");
  const [azione, setAzione] = useState<AzionePassword>("accedi");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviato, setInviato] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [caricamento, setCaricamento] = useState(false);

  async function inviaLink(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setCaricamento(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setCaricamento(false);
    if (error) {
      setErrore(error.message);
    } else {
      setInviato(true);
    }
  }

  async function inviaPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setMessaggio(null);
    setCaricamento(true);

    if (azione === "accedi") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setCaricamento(false);
      if (error) {
        setErrore(
          error.message === "Invalid login credentials"
            ? "Email o password non corrette."
            : error.message
        );
        return;
      }
      router.push("/libreria");
      router.refresh();
      return;
    }

    // Registrazione con password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setCaricamento(false);
    if (error) {
      setErrore(error.message);
      return;
    }

    if (data.session) {
      // Conferma email disattivata sul progetto Supabase: sessione già attiva
      router.push("/libreria");
      router.refresh();
    } else {
      setMessaggio(
        `Ti abbiamo inviato un'email di conferma a ${email}. Aprila per attivare l'account, poi accedi con la tua password.`
      );
      setAzione("accedi");
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-accent-strong">📚 Libroteca</h1>
        <p className="text-muted mt-1 text-sm">
          La tua libreria personale, con consigli di lettura su misura.
        </p>
      </div>

      <div className="flex gap-1 bg-surface-2 rounded-lg p-1 text-sm">
        <button
          onClick={() => {
            setModalita("password");
            setErrore(null);
            setMessaggio(null);
          }}
          className={`flex-1 rounded-md py-1.5 transition-colors ${
            modalita === "password" ? "bg-accent text-[#14110f] font-medium" : "text-muted"
          }`}
        >
          Password
        </button>
        <button
          onClick={() => {
            setModalita("link");
            setErrore(null);
            setMessaggio(null);
            setInviato(false);
          }}
          className={`flex-1 rounded-md py-1.5 transition-colors ${
            modalita === "link" ? "bg-accent text-[#14110f] font-medium" : "text-muted"
          }`}
        >
          Link via email
        </button>
      </div>

      {modalita === "password" ? (
        <form onSubmit={inviaPassword} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="La tua email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surface border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={azione === "accedi" ? "current-password" : "new-password"}
            className="bg-surface border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={caricamento}
            className="bg-accent hover:bg-accent-strong text-[#14110f] font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            {caricamento
              ? "Un momento..."
              : azione === "accedi"
                ? "Accedi"
                : "Crea account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setAzione(azione === "accedi" ? "registrati" : "accedi");
              setErrore(null);
              setMessaggio(null);
            }}
            className="text-sm text-muted hover:text-foreground text-center transition-colors"
          >
            {azione === "accedi"
              ? "Non hai un account? Registrati"
              : "Hai già un account? Accedi"}
          </button>

          {messaggio && <p className="text-accent-strong text-sm text-center">{messaggio}</p>}
          {errore && <p className="text-danger text-sm text-center">{errore}</p>}
        </form>
      ) : inviato ? (
        <div className="bg-surface border border-border rounded-lg p-4 text-sm text-center">
          Ti abbiamo inviato un link di accesso a <strong>{email}</strong>. Apri la tua email e
          clicca sul link per entrare.
        </div>
      ) : (
        <form onSubmit={inviaLink} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="La tua email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surface border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={caricamento}
            className="bg-accent hover:bg-accent-strong text-[#14110f] font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            {caricamento ? "Invio in corso..." : "Inviami il link di accesso"}
          </button>
          {errore && <p className="text-danger text-sm text-center">{errore}</p>}
        </form>
      )}
    </div>
  );
}
