import type { Libro } from "@/types";

const BASE_URL = "https://www.googleapis.com/books/v1/volumes";

interface GoogleBooksVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    language?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    industryIdentifiers?: { type: string; identifier: string }[];
    infoLink?: string;
  };
}

function mappaVolume(v: GoogleBooksVolume): Libro {
  const info = v.volumeInfo ?? {};
  const isbn13 = info.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier;
  const isbn10 = info.industryIdentifiers?.find((i) => i.type === "ISBN_10")?.identifier;

  return {
    id: v.id,
    titolo: info.title ?? "Titolo sconosciuto",
    sottotitolo: info.subtitle ?? null,
    autori: info.authors ?? [],
    descrizione: info.description ?? null,
    // Google Books serve le immagini in http: forziamo https per evitare mixed-content
    immagine_url: info.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
    isbn_13: isbn13 ?? null,
    isbn_10: isbn10 ?? null,
    editore: info.publisher ?? null,
    data_pubblicazione: info.publishedDate ?? null,
    categorie: info.categories ?? [],
    lingua: info.language ?? null,
    pagine: info.pageCount ?? null,
    link_google_books: info.infoLink ?? null,
  };
}

function apiKeyParam(): string {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  return key ? `&key=${key}` : "";
}

/**
 * Cerca libri su Google Books. Di norma la ricerca non è ristretta per lingua
 * (per avere un catalogo il più ampio possibile): la priorità ai titoli in
 * italiano viene data più avanti, ordinando i risultati uniti di tutte le
 * fonti. Se si passa langRestrict, invece, Google Books filtra i risultati
 * per lingua del contenuto (non solo un'etichetta): usato per recuperare
 * edizioni italiane vere e proprie — con il titolo stesso in italiano — anche
 * quando la ricerca generica restituisce solo edizioni in altre lingue. Ha un
 * limite di tempo (timeoutMs) per non far aspettare troppo chi cerca da rete
 * lenta.
 */
export async function cercaLibri(
  query: string,
  {
    maxResults = 30,
    timeoutMs = 6000,
    langRestrict,
    startIndex,
  }: { maxResults?: number; timeoutMs?: number; langRestrict?: string; startIndex?: number } = {}
): Promise<Libro[]> {
  if (!query.trim()) return [];

  const restrizioneLingua = langRestrict ? `&langRestrict=${langRestrict}` : "";
  const indicePartenza = startIndex ? `&startIndex=${startIndex}` : "";
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}${restrizioneLingua}${indicePartenza}${apiKeyParam()}`;

  const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    throw new Error(`Google Books API ha risposto ${res.status}`);
  }
  const data = (await res.json()) as { items?: GoogleBooksVolume[] };
  return (data.items ?? []).map(mappaVolume);
}

export async function ottieniLibroPerId(id: string): Promise<Libro | null> {
  const res = await fetch(`${BASE_URL}/${id}?${apiKeyParam().slice(1)}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as GoogleBooksVolume;
  return mappaVolume(data);
}

/**
 * Cerca un singolo libro per titolo + autore (usato per arricchire i consigli AI
 * con dati reali e copertina dal catalogo Google Books).
 */
export async function trovaLibroPerTitoloAutore(
  titolo: string,
  autore?: string
): Promise<Libro | null> {
  const query = autore ? `intitle:${titolo} inauthor:${autore}` : `intitle:${titolo}`;
  const risultati = await cercaLibri(query, { maxResults: 3 });
  return risultati[0] ?? null;
}
