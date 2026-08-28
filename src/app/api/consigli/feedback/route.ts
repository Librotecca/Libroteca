import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST: registra un 👍/👎 dell'utente su un consiglio ricevuto.
 * I titoli con 👎 non verranno più riproposti nelle prossime generazioni.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  const { titolo, autore, voto } = (await request.json()) as {
    titolo: string;
    autore?: string;
    voto: "mi_piace" | "non_mi_piace";
  };

  if (!titolo || !voto) {
    return NextResponse.json({ errore: "Dati mancanti" }, { status: 400 });
  }

  const { error } = await supabase
    .from("consigli_feedback")
    .upsert(
      { user_id: user.id, titolo, autore: autore ?? null, voto },
      { onConflict: "user_id,titolo" }
    );

  if (error) {
    console.error("Errore salvataggio feedback consiglio:", error);
    return NextResponse.json({ errore: "Impossibile salvare il feedback" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
