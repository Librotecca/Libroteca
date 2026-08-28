import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Famiglia, MembroFamiglia } from "@/types";

function generaCodiceInvito(): string {
  return randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
}

/**
 * GET: restituisce la famiglia dell'utente (se ne fa parte) con l'elenco dei membri.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  const { data: propriaRiga } = await supabase
    .from("membri_famiglia")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!propriaRiga) {
    return NextResponse.json({ famiglia: null, membri: [] });
  }

  const { data: famiglia } = await supabase
    .from("famiglie")
    .select("*")
    .eq("id", propriaRiga.famiglia_id)
    .single();

  const { data: membriGrezzi } = await supabase
    .from("membri_famiglia")
    .select("*, profilo:profili(*)")
    .eq("famiglia_id", propriaRiga.famiglia_id);

  return NextResponse.json({
    famiglia: famiglia as Famiglia,
    membri: (membriGrezzi ?? []) as unknown as MembroFamiglia[],
  });
}

/**
 * POST: crea una nuova famiglia con l'utente corrente come creatore.
 * Fallisce se l'utente fa già parte di una famiglia.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  const { data: esistente } = await supabase
    .from("membri_famiglia")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (esistente) {
    return NextResponse.json({ errore: "Fai già parte di una famiglia." }, { status: 400 });
  }

  const { nome } = (await request.json()) as { nome: string };
  if (!nome?.trim()) {
    return NextResponse.json({ errore: "Il nome della famiglia è obbligatorio." }, { status: 400 });
  }

  // Genera un codice invito univoco (riprova in caso di rarissima collisione).
  let famiglia = null;
  for (let tentativo = 0; tentativo < 5 && !famiglia; tentativo++) {
    const codice_invito = generaCodiceInvito();
    const { data, error } = await supabase
      .from("famiglie")
      .insert({ nome: nome.trim(), codice_invito, creato_da: user.id })
      .select()
      .single();

    if (!error) {
      famiglia = data;
    } else if (error.code !== "23505") {
      // Errore diverso da "codice duplicato": interrompi subito.
      console.error("Errore creazione famiglia:", error);
      return NextResponse.json({ errore: "Impossibile creare la famiglia." }, { status: 500 });
    }
  }

  if (!famiglia) {
    return NextResponse.json({ errore: "Impossibile generare un codice invito, riprova." }, { status: 500 });
  }

  const { error: erroreMembro } = await supabase
    .from("membri_famiglia")
    .insert({ user_id: user.id, famiglia_id: famiglia.id, ruolo: "creatore" });

  if (erroreMembro) {
    console.error("Errore aggiunta creatore alla famiglia:", erroreMembro);
    return NextResponse.json({ errore: "Impossibile completare la creazione." }, { status: 500 });
  }

  return NextResponse.json({ famiglia });
}

/**
 * DELETE: l'utente esce dalla propria famiglia.
 */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  const { error } = await supabase.from("membri_famiglia").delete().eq("user_id", user.id);
  if (error) {
    console.error("Errore uscita famiglia:", error);
    return NextResponse.json({ errore: "Impossibile uscire dalla famiglia." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
