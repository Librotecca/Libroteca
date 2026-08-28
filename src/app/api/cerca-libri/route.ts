import { NextRequest, NextResponse } from "next/server";
import { cercaLibri } from "@/lib/google-books";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const soloItaliano = request.nextUrl.searchParams.get("soloItaliano") !== "false";

  if (!q.trim()) {
    return NextResponse.json({ risultati: [] });
  }

  try {
    const risultati = await cercaLibri(q, { soloItaliano });
    return NextResponse.json({ risultati });
  } catch (err) {
    console.error("Errore ricerca Google Books:", err);
    return NextResponse.json(
      { errore: "Ricerca non riuscita. Riprova tra qualche istante." },
      { status: 502 }
    );
  }
}
