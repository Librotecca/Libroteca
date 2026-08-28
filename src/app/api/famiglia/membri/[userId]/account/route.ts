import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE: il creatore della famiglia elimina DEFINITIVAMENTE l'account di un
 * membro (email, accesso, libreria personale, valutazioni: tutto). Azione
 * irreversibile — da usare solo se quella persona non deve più avere alcun
 * accesso all'app, nemmeno con un account nuovo creato da lei in seguito.
 *
 * Le tabelle collegate (profili, voci_libreria, membri_famiglia) hanno tutte
 * "on delete cascade" su auth.users, quindi eliminare l'utente ripulisce
 * automaticamente ogni suo dato senza bisogno di query aggiuntive.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  if (userId === user.id) {
    return NextResponse.json(
      { errore: "Non puoi eliminare il tuo stesso account da qui." },
      { status: 400 }
    );
  }

  const { data: propriaRiga } = await supabase
    .from("membri_famiglia")
    .select("famiglia_id, ruolo")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!propriaRiga || propriaRiga.ruolo !== "creatore") {
    return NextResponse.json(
      { errore: "Solo il creatore della famiglia può eliminare l'account di un membro." },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // Verifica che l'utente da eliminare faccia davvero parte della stessa
  // famiglia di chi fa la richiesta, per evitare che un creatore possa
  // eliminare account estranei conoscendone solo l'id.
  const { data: membroTarget } = await admin
    .from("membri_famiglia")
    .select("user_id")
    .eq("user_id", userId)
    .eq("famiglia_id", propriaRiga.famiglia_id)
    .maybeSingle();

  if (!membroTarget) {
    return NextResponse.json(
      { errore: "Questo utente non fa parte della tua famiglia." },
      { status: 404 }
    );
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Errore eliminazione account:", error);
    return NextResponse.json({ errore: "Impossibile eliminare l'account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
