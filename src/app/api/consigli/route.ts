import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generaConsigli } from "@/lib/consigli";
import type { VoceLibreria } from "@/types";

async function caricaVoci(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  stato: "letto" | "abbandonato"
) {
  const { data, error } = await supabase
    .from("voci_libreria")
    .select("*, libro:libri(*)")
    .eq("user_id", userId)
    .eq("stato", stato);

  if (error) throw error;
  return (data ?? []) as unknown as VoceLibreria[];
}

/**
 * GET: restituisce gli ultimi consigli generati (cache), se presenti.
 * Aggiungi ?rigenera=true per forzare una nuova generazione.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  const rigenera = request.nextUrl.searchParams.get("rigenera") === "true";

  if (!rigenera) {
    const { data: cache } = await supabase
      .from("consigli_cache")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cache) {
      return NextResponse.json({ consigli: cache.consigli, generated_at: cache.generated_at });
    }
  }

  try {
    const [letti, abbandonati] = await Promise.all([
      caricaVoci(supabase, user.id, "letto"),
      caricaVoci(supabase, user.id, "abbandonato"),
    ]);

    if (letti.length === 0) {
      return NextResponse.json({
        consigli: [],
        messaggio: "Segna almeno un libro come 'Letto' per ricevere consigli personalizzati.",
      });
    }

    const consigli = await generaConsigli(letti, abbandonati);
    const generatedAt = new Date().toISOString();

    await supabase
      .from("consigli_cache")
      .upsert({ user_id: user.id, consigli, generated_at: generatedAt }, { onConflict: "user_id" });

    return NextResponse.json({ consigli, generated_at: generatedAt });
  } catch (err) {
    console.error("Errore generazione consigli:", err);
    const messaggio = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ errore: messaggio }, { status: 500 });
  }
}
