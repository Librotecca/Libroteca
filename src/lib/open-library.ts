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

interface OpenLibraryBookData {
  title?: string;
  subtitle?: string;
  authors?: { name: string }[];
  publishers?: { name: string }[];
  publish_date?: string;
  number_of_pages?: number;
  cover?: { small?: string; medium?: string; large?: string };
  subjects?: { name: string }[];
  url?: string;
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
  maxResults = 30,
  timeoutMs = 6000
): Promise<Libro[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    limit: String(maxResults),
    fields: "key,title,author_name,first_publish_year,isbn,publisher,subject,language,cover_i",
  });

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(timeoutMs),
    });
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

/**
 * Cerca tutti i libri di un autore su Open Library, usando il parametro
 * dedicato "author" (più mirato della ricerca a testo libero "q=...", che
 * mescolerebbe anche libri che citano l'autore senza esserne scritti da lui).
 */
export async function cercaLibriOpenLibraryPerAutore(
  autore: string,
  maxResults = 60,
  timeoutMs = 6000
): Promise<Libro[]> {
  if (!autore.trim()) return [];

  const params = new URLSearchParams({
    author: autore,
    limit: String(maxResults),
    fields: "key,title,author_name,first_publish_year,isbn,publisher,subject,language,cover_i",
  });

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
    return (data.docs ?? []).filter((doc) => doc.title).map(mappaDoc);
  } catch (err) {
    console.error("Errore ricerca autore Open Library:", err);
    return [];
  }
}

/**
 * Cerca un libro per ISBN esatto usando l'endpoint dedicato di Open Library
 * (molto più affidabile della ricerca generica "q=isbn:..." per un match preciso,
 * specie per edizioni italiane meno diffuse che la ricerca a testo libero non trova).
 */
export async function trovaLibroPerISBNOpenLibrary(isbn: string): Promise<Libro | null> {
  const isbnPulito = isbn.replace(/[^0-9Xx]/g, "");
  if (!isbnPulito) return null;

  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbnPulito}&format=json&jscmd=data`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, OpenLibraryBookData>;
    const libro = data[`ISBN:${isbnPulito}`];
    if (!libro?.title) return null;

    return {
      id: `ol:isbn:${isbnPulito}`,
      titolo: libro.title,
      sottotitolo: libro.subtitle ?? null,
      autori: (libro.authors ?? []).map((a) => a.name),
      descrizione: null,
      immagine_url: libro.cover?.medium ?? libro.cover?.large ?? libro.cover?.small ?? null,
      isbn_13: isbnPulito.length === 13 ? isbnPulito : null,
      isbn_10: isbnPulito.length === 10 ? isbnPulito : null,
      editore: libro.publishers?.[0]?.name ?? null,
      data_pubblicazione: libro.publish_date ?? null,
      categorie: (libro.subjects ?? []).slice(0, 5).map((s) => s.name),
      lingua: null,
      pagine: libro.number_of_pages ?? null,
      link_google_books: libro.url ?? `https://openlibrary.org/isbn/${isbnPulito}`,
    };
  } catch (err) {
    console.error("Errore ricerca ISBN Open Library:", err);
    return null;
  }
}
