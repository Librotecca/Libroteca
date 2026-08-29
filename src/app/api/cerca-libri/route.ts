import { NextRequest, NextResponse } from "next/server";
import { cercaLibriCompleto, cercaLibriPerAutoreCompleto, cercaLibroPerISBN } from "@/lib/catalogo";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const soloItaliano = request.nextUrl.searchParams.get("soloItaliano") !== "false";
  const perAutore = request.nextUrl.searchParams.get("tipo") === "autore";

  if (!q.trim()) {
    return NextResponse.json({ risultati: [] });
  }

  try {
    if (perAutore) {
      const risultati = await cercaLibriPerAutoreCompleto(q);
      return NextResponse.json({ risultati });
    }

    if (q.toLowerCase().startsWith("isbn:")) {
      const isbn = q.slice(5);
      const libro = await cercaLibroPerISBN(isbn);
      if (libro) {
        return NextResponse.json({ risultati: [libro] });
      }
      // Ripiego finale: se l'ISBN esatto non è indicizzato da nessuna delle due fonti,
      // prova comunque una ricerca a testo libero con lo stesso codice.
      const risultati = await cercaLibriCompleto(isbn, { soloItaliano: false });
      return NextResponse.json({ risultati });
    }

    const risultati = await cercaLibriCompleto(q, { soloItaliano });
    return NextResponse.json({ risultati });
  } catch (err) {
    console.error("Errore ricerca Google Books:", err);
    return NextResponse.json(
      { errore: "Ricerca non riuscita. Riprova tra qualche istante." },
      { status: 502 }
    );
  }
}
