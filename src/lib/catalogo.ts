import type { Libro } from "@/types";
import { cercaLibri as cercaLibriGoogle, trovaLibroPerTitoloAutore as trovaSuGoogle } from "@/lib/google-books";
import { cercaLibriOpenLibrary } from "@/lib/open-library";

function chiaveDedupe(l: Libro): string {
  return `${l.titolo.toLowerCase().trim()}|${(l.autori[0] ?? "").toLowerCase().trim()}`;
}

/**
 * Cerca libri unendo due cataloghi: Google Books (fonte principale, dati più
 * ricchi) e Open Library (fonte secondaria, gratuita, per coprire titoli che
 * Google Books non ha — specie alcune edizioni italiane meno diffuse).
 * I duplicati (stesso titolo+autore) vengono rimossi, dando priorità a Google Books.
 */
export async function cercaLibriCompleto(
  query: string,
  { soloItaliano = true, maxResults = 20 }: { soloItaliano?: boolean; maxResults?: number } = {}
): Promise<Libro[]> {
  const [google, openLibrary] = await Promise.all([
    cercaLibriGoogle(query, { soloItaliano, maxResults }).catch(() => [] as Libro[]),
    cercaLibriOpenLibrary(query, maxResults).catch(() => [] as Libro[]),
  ]);

  const visti = new Set(google.map(chiaveDedupe));
  const extra = openLibrary.filter((l) => !visti.has(chiaveDedupe(l)));

  return [...google, ...extra].slice(0, maxResults);
}

/**
 * Cerca un singolo libro per titolo + autore, provando prima Google Books e
 * poi Open Library come ripiego. Usato per arricchire i consigli AI con dati
 * reali (copertina, link) anche quando Google Books non trova il titolo.
 */
export async function trovaLibroCompleto(titolo: string, autore?: string): Promise<Libro | null> {
  const daGoogle = await trovaSuGoogle(titolo, autore).catch(() => null);
  if (daGoogle) return daGoogle;

  const query = autore ? `${titolo} ${autore}` : titolo;
  const risultatiOL = await cercaLibriOpenLibrary(query, 3);
  return risultatiOL[0] ?? null;
}
