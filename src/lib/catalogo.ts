import type { Libro } from "@/types";
import { cercaLibri as cercaLibriGoogle, trovaLibroPerTitoloAutore as trovaSuGoogle } from "@/lib/google-books";
import { cercaLibriOpenLibrary, trovaLibroPerISBNOpenLibrary } from "@/lib/open-library";

function chiaveDedupe(l: Libro): string {
  return `${l.titolo.toLowerCase().trim()}|${(l.autori[0] ?? "").toLowerCase().trim()}`;
}

/**
 * Riordina mettendo prima i libri in italiano, senza scartare gli altri:
 * serve a dare priorità ai titoli italiani mantenendo un catalogo ampio.
 * Array.sort è stabile, quindi l'ordine di rilevanza originale resta invariato
 * all'interno di ciascun gruppo (italiani / non italiani).
 */
function italianiPrima(libri: Libro[]): Libro[] {
  return [...libri].sort((a, b) => Number(b.lingua === "it") - Number(a.lingua === "it"));
}

/**
 * Cerca libri unendo due cataloghi: Google Books (fonte principale, dati più
 * ricchi) e Open Library (fonte secondaria, gratuita, per coprire titoli che
 * Google Books non ha — specie alcune edizioni italiane meno diffuse).
 * I duplicati (stesso titolo+autore) vengono rimossi, dando priorità a Google Books.
 *
 * Le due fonti vengono interrogate in parallelo e senza restrizione di lingua
 * (per avere un catalogo il più ampio possibile, comprese le edizioni italiane
 * meno comuni); i risultati in italiano vengono poi portati in cima alla lista.
 * Ogni fonte ha un limite di tempo, così una fonte lenta non rallenta tutta
 * la ricerca: se scade il tempo, si procede solo con i risultati dell'altra.
 */
export async function cercaLibriCompleto(
  query: string,
  { soloItaliano = true, maxResults = 30 }: { soloItaliano?: boolean; maxResults?: number } = {}
): Promise<Libro[]> {
  const [google, openLibrary] = await Promise.all([
    cercaLibriGoogle(query, { maxResults: 40 }).catch(() => [] as Libro[]),
    cercaLibriOpenLibrary(query, 40).catch(() => [] as Libro[]),
  ]);

  const visti = new Set(google.map(chiaveDedupe));
  const extra = openLibrary.filter((l) => !visti.has(chiaveDedupe(l)));
  const uniti = [...google, ...extra];

  const ordinati = soloItaliano ? italianiPrima(uniti) : uniti;
  return ordinati.slice(0, maxResults);
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

/**
 * Cerca un libro per ISBN esatto (usato dallo scanner del codice a barre).
 * Prova prima una ricerca dedicata su Google Books, poi l'endpoint ISBN
 * esatto di Open Library — molto più affidabile della ricerca a testo libero
 * per trovare edizioni specifiche, comprese quelle italiane meno diffuse.
 */
export async function cercaLibroPerISBN(isbn: string): Promise<Libro | null> {
  const isbnPulito = isbn.replace(/[^0-9Xx]/g, "");
  if (!isbnPulito) return null;

  const daGoogle = await cercaLibriGoogle(`isbn:${isbnPulito}`, { maxResults: 1 }).catch(
    () => [] as Libro[]
  );
  if (daGoogle[0]) return daGoogle[0];

  const daOpenLibrary = await trovaLibroPerISBNOpenLibrary(isbnPulito).catch(() => null);
  if (daOpenLibrary) return daOpenLibrary;

  return null;
}
