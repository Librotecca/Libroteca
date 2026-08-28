import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
