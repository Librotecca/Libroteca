import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { riconosciCopertina } from "@/lib/riconoscimento-copertina";

const TIPI_IMMAGINE_VALIDI = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  try {
    const { immagine } = (await request.json()) as { immagine?: string };
    if (!immagine) {
      return NextResponse.json({ errore: "Immagine mancante" }, { status: 400 });
    }

    const match = immagine.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match || !TIPI_IMMAGINE_VALIDI.has(match[1])) {
      return NextResponse.json({ errore: "Formato immagine non valido" }, { status: 400 });
    }
    const [, mediaType, dati] = match;

    const risultato = await riconosciCopertina(
      dati,
      mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif"
    );
    return NextResponse.json(risultato);
  } catch (err) {
    console.error("Errore riconoscimento copertina:", err);
    const messaggio = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ errore: messaggio }, { status: 500 });
  }
}
