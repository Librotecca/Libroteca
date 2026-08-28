import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client Supabase con la Service Role Key: bypassa la Row Level Security.
// Da usare SOLO in codice server-side (Route Handler), mai esposto al browser.
// Serve unicamente per scrivere nella cache condivisa "libri" (catalogo Google Books).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
