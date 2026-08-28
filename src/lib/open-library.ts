import type { Libro } from "@/types";

const BASE_URL = "https://openlibrary.org/search.json";

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  publisher?: string[];
  subject?: string[];
  language?: string[];
  cover_i?: number;
}

function mappaDoc(doc: OpenLibraryDoc): Libro {
  const isbnPuliti = (doc.isbn ?? []).map((i) => i.replace(/-/g, ""));
  const isbn13 = isbnPuliti.find((i) => i.length === 13);
  const isbn10 = isbnPuliti.find((i) => i.length === 10);
  const idOpenLibrary = doc.key.replace("/works/", "");

  return {
    // Prefisso "ol:" per distinguerlo dagli id di Google Books ed evitare collisioni
    // nella cache condivisa "libri".
    id: `ol:${idOpenLibrary}`,
    titolo: doc.title,
    sottotitolo: null,
    autori: doc.author_name ?? [],
    // La ricerca di Open Library non include la descrizione (serve una chiamata
    // separata per ogni "work"): la lasciamo vuota, copertina e dati essenziali
    // restano comunque disponibili.
    descrizione: null,
    immagine_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    isbn_13: isbn13 ?? null,
    isbn_10: isbn10 ?? null,
    editore: doc.publisher?.[0] ?? null,
    data_pubblicazione: doc.first_publish_year ? String(doc.first_publish_year) : null,
    categorie: doc.subject?.slice(0, 5) ?? [],
    lingua: doc.language?.includes("ita") ? "it" : (doc.language?.[0] ?? null),
    pagine: null,
    link_google_books: `https://openlibrary.org${doc.key}`,
  };
}

/**
 * Cerca libri su Open Library (catalogo libero, senza necessità di API key).
 * Usato come seconda fonte per completare i risultati di Google Books.
 */
export async function cercaLibriOpenLibrary(
  query: string,
  maxResults = 20
): Promise<Libro[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    limit: String(maxResults),
    fields: "key,title,author_name,first_publish_year,isbn,publisher,subject,language,cover_i",
  });

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
    return (data.docs ?? [])
      .filter((doc) => doc.title)
      .map(mappaDoc);
  } catch (err) {
    console.error("Errore ricerca Open Library:", err);
    return [];
  }
}
