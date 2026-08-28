import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST: unisce l'utente corrente alla famiglia identificata dal codice invito.
 * Usa la service role solo per cercare la famiglia dal codice (chi non è ancora
 * membro non può leggere la tabella "famiglie" per via delle policy RLS).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  const { codice } = (await request.json()) as { codice: string };
  if (!codice?.trim()) {
    return NextResponse.json({ errore: "Codice invito mancante." }, { status: 400 });
  }

  const { data: esistente } = await supabase
    .from("membri_famiglia")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (esistente) {
    return NextResponse.json(
      { errore: "Fai già parte di una famiglia. Esci prima di entrare in un'altra." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: famiglia } = await admin
    .from("famiglie")
    .select("id, nome")
    .eq("codice_invito", codice.trim().toUpperCase())
    .maybeSingle();

  if (!famiglia) {
    return NextResponse.json({ errore: "Codice invito non valido." }, { status: 404 });
  }

  const { error } = await supabase
    .from("membri_famiglia")
    .insert({ user_id: user.id, famiglia_id: famiglia.id, ruolo: "membro" });

  if (error) {
    console.error("Errore ingresso famiglia:", error);
    return NextResponse.json({ errore: "Impossibile unirsi alla famiglia." }, { status: 500 });
  }

  return NextResponse.json({ famiglia });
}
