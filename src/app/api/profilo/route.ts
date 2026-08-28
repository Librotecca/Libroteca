import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH: aggiorna campi del proprio profilo (per ora solo l'obiettivo di
 * lettura annuale, mostrato nella pagina Statistiche).
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  const body = (await request.json()) as { obiettivo_lettura_annuale?: number | null };

  if (!("obiettivo_lettura_annuale" in body)) {
    return NextResponse.json({ errore: "Dati mancanti" }, { status: 400 });
  }

  const { data: profilo, error } = await supabase
    .from("profili")
    .update({ obiettivo_lettura_annuale: body.obiettivo_lettura_annuale })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Errore aggiornamento profilo:", error);
    return NextResponse.json({ errore: "Impossibile aggiornare il profilo" }, { status: 500 });
  }

  return NextResponse.json({ profilo });
}
