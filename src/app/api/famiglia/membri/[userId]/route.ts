import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE: il creatore della famiglia rimuove un membro dal gruppo condiviso.
 * Azione reversibile: il membro rimosso mantiene il proprio account e la
 * propria libreria personale, perde solo l'accesso a quella condivisa (può
 * essere invitato di nuovo in futuro con un nuovo codice).
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
      { errore: 'Per uscire dalla famiglia usa il pulsante "Esci dalla famiglia".' },
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
      { errore: "Solo il creatore della famiglia può rimuovere un membro." },
      { status: 403 }
    );
  }

  // Serve il client admin: la RLS permette a ciascun utente di rimuovere solo
  // la propria riga, non quella di un altro membro (anche se creatore).
  const admin = createAdminClient();
  const { error } = await admin
    .from("membri_famiglia")
    .delete()
    .eq("user_id", userId)
    .eq("famiglia_id", propriaRiga.famiglia_id);

  if (error) {
    console.error("Errore rimozione membro famiglia:", error);
    return NextResponse.json({ errore: "Impossibile rimuovere il membro." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
