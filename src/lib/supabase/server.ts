import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

// Client Supabase da usare in Server Components, Route Handler e Server Actions.
// Rispetta la sessione dell'utente loggato e quindi le policy di Row Level Security.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chiamato da un Server Component: ignorabile se c'è il middleware
            // che tiene aggiornata la sessione.
          }
        },
      },
    }
  );
}

// L'id dell'utente già verificato da proxy.ts (che chiama supabase.auth.getUser()
// una volta per ogni richiesta e lo passa qui via header). Usare questo invece
// di richiamare di nuovo supabase.auth.getUser() in ogni pagina/componente:
// getUser() è una chiamata di rete verso Supabase, e ripeterla 2-3 volte a ogni
// cambio pagina (proxy + pagina + Navbar) era la causa principale della
// navigazione percepita come lenta. Le pagine protette da proxy.ts possono
// fidarsi di questo valore: se è vuoto, l'utente non era autenticato.
export async function idUtenteCorrente(): Promise<string | null> {
  const elencoHeader = await headers();
  return elencoHeader.get("x-user-id") || null;
}
