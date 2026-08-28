import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Libro, StatoLettura } from "@/types";

/**
 * POST: aggiunge un libro (dal risultato di ricerca Google Books) alla libreria
 * dell'utente con uno stato di lettura. Se il libro non è ancora nella cache
 * condivisa "libri", lo salva prima lì.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  const body = (await request.json()) as { libro: Libro; stato: StatoLettura };
  const { libro, stato } = body;

  if (!libro?.id || !stato) {
    return NextResponse.json({ errore: "Dati mancanti" }, { status: 400 });
  }

  // Cache del libro nel catalogo condiviso (service role: bypassa RLS, dato non sensibile)
  const admin = createAdminClient();
  const { error: erroreCache } = await admin.from("libri").upsert(
    {
      id: libro.id,
      titolo: libro.titolo,
      sottotitolo: libro.sottotitolo ?? null,
      autori: libro.autori ?? [],
      descrizione: libro.descrizione ?? null,
      immagine_url: libro.immagine_url ?? null,
      isbn_13: libro.isbn_13 ?? null,
      isbn_10: libro.isbn_10 ?? null,
      editore: libro.editore ?? null,
      data_pubblicazione: libro.data_pubblicazione ?? null,
      categorie: libro.categorie ?? [],
      lingua: libro.lingua ?? null,
      pagine: libro.pagine ?? null,
      link_google_books: libro.link_google_books ?? null,
    },
    { onConflict: "id" }
  );

  if (erroreCache) {
    console.error("Errore cache libro:", erroreCache);
    return NextResponse.json({ errore: "Impossibile salvare il libro" }, { status: 500 });
  }

  const dataInizio =
    stato === "in_lettura" || stato === "letto" ? new Date().toISOString().slice(0, 10) : null;
  const dataFine = stato === "letto" ? new Date().toISOString().slice(0, 10) : null;

  const { data: voce, error: erroreVoce } = await supabase
    .from("voci_libreria")
    .upsert(
      {
        user_id: user.id,
        libro_id: libro.id,
        stato,
        data_inizio: dataInizio,
        data_fine: dataFine,
      },
      { onConflict: "user_id,libro_id" }
    )
    .select()
    .single();

  if (erroreVoce) {
    console.error("Errore aggiunta alla libreria:", erroreVoce);
    return NextResponse.json({ errore: "Impossibile aggiornare la libreria" }, { status: 500 });
  }

  return NextResponse.json({ voce });
}

/**
 * PATCH: aggiorna stato, valutazione, note o date di una voce già in libreria.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id: string;
    stato?: StatoLettura;
    valutazione?: number | null;
    note?: string | null;
    data_inizio?: string | null;
    data_fine?: string | null;
    pagina_corrente?: number | null;
  };

  if (!body.id) {
    return NextResponse.json({ errore: "Id mancante" }, { status: 400 });
  }

  const aggiornamenti: Record<string, unknown> = {};
  for (const campo of [
    "stato",
    "valutazione",
    "note",
    "data_inizio",
    "data_fine",
    "pagina_corrente",
  ] as const) {
    if (campo in body) aggiornamenti[campo] = body[campo];
  }

  const { data: voce, error } = await supabase
    .from("voci_libreria")
    .update(aggiornamenti)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Errore aggiornamento voce:", error);
    return NextResponse.json({ errore: "Impossibile aggiornare" }, { status: 500 });
  }

  return NextResponse.json({ voce });
}

/**
 * DELETE: rimuove un libro dalla libreria dell'utente.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errore: "Non autenticato" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ errore: "Id mancante" }, { status: 400 });
  }

  const { error } = await supabase.from("voci_libreria").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("Errore rimozione voce:", error);
    return NextResponse.json({ errore: "Impossibile rimuovere" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
