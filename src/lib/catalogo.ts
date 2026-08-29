import type { Libro } from "@/types";
import { cercaLibri as cercaLibriGoogle, trovaLibroPerTitoloAutore as trovaSuGoogle } from "@/lib/google-books";
import {
  cercaLibriOpenLibrary,
  cercaLibriOpenLibraryPerAutore,
  trovaLibroPerISBNOpenLibrary,
} from "@/lib/open-library";

function chiaveDedupe(l: Libro): string {
  return `${l.titolo.toLowerCase().trim()}|${(l.autori[0] ?? "").toLowerCase().trim()}`;
}

/**
 * Verifica se uno degli autori del libro corrisponde davvero al nome cercato
 * (in un senso o nell'altro, per tollerare nome+cognome invertiti o un nome
 * parziale) — serve a scartare i risultati che una ricerca per autore su
 * Google Books/Open Library a volte restituisce comunque anche se l'autore
 * non è esattamente quello (es. libri che lo citano, antologie curate da
 * altri, o semplici corrispondenze di rilevanza generica).
 */
function autoreCorrisponde(autoriLibro: string[], nomeCercato: string): boolean {
  const cercato = nomeCercato.toLowerCase().trim();
  if (!cercato) return false;
  return autoriLibro.some((autore) => {
    const a = autore.toLowerCase().trim();
    return a === cercato || a.includes(cercato) || cercato.includes(a);
  });
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
 * ricchi e in genere molto più veloce) e Open Library (fonte secondaria,
 * gratuita, per coprire titoli che Google Books non ha — specie alcune
 * edizioni italiane meno diffuse). I duplicati (stesso titolo+autore) vengono
 * rimossi, dando priorità a Google Books.
 *
 * Per avere titoli davvero in italiano (non solo etichettati come tali) viene
 * lanciata anche una seconda ricerca su Google Books con langRestrict=it, che
 * filtra per lingua del contenuto: recupera edizioni italiane vere e proprie
 * che la ricerca generica potrebbe non mostrare (perché Google la ordina per
 * rilevanza generale, non per lingua). Le due chiamate a Google Books vanno in
 * parallelo, quindi non aggiungono attesa percepita.
 *
 * Per la velocità: Open Library viene interrogata solo se Google Books da
 * solo non basta (poche corrispondenze). Nella maggior parte delle ricerche
 * (titoli noti) Google trova già abbastanza risultati, quindi la ricerca resta
 * una sola tornata di chiamate invece di tre sempre in sequenza — Open Library
 * è infatti spesso molto più lenta di Google Books, ed era la causa principale
 * della lentezza percepita premendo "Cerca". Quando serve comunque (titoli
 * meno comuni), ha un limite di tempo più stretto così non trascina troppo
 * a lungo l'attesa.
 */
export async function cercaLibriCompleto(
  query: string,
  { soloItaliano = true, maxResults = 30 }: { soloItaliano?: boolean; maxResults?: number } = {}
): Promise<Libro[]> {
  const [google, googleItaliano] = await Promise.all([
    cercaLibriGoogle(query, { maxResults: 30, timeoutMs: 5000 }).catch(() => [] as Libro[]),
    soloItaliano
      ? cercaLibriGoogle(query, { maxResults: 20, timeoutMs: 5000, langRestrict: "it" }).catch(
          () => [] as Libro[]
        )
      : Promise.resolve([] as Libro[]),
  ]);

  // Le edizioni italiane vere (langRestrict=it) vanno messe davanti a quelle
  // generiche già in fase di unione, prima ancora dell'ordinamento finale.
  const vistiItaliani = new Set(googleItaliano.map(chiaveDedupe));
  const googleUnito = [...googleItaliano, ...google.filter((l) => !vistiItaliani.has(chiaveDedupe(l)))];

  const bastaGoogle = googleUnito.length >= 8;
  const openLibrary = bastaGoogle
    ? []
    : await cercaLibriOpenLibrary(query, 24, 3500).catch(() => [] as Libro[]);

  const visti = new Set(googleUnito.map(chiaveDedupe));
  const extra = openLibrary.filter((l) => !visti.has(chiaveDedupe(l)));
  const uniti = [...googleUnito, ...extra];

  const ordinati = soloItaliano ? italianiPrima(uniti) : uniti;
  return ordinati.slice(0, maxResults);
}

/**
 * Cerca TUTTI i libri di un autore (e solo di quell'autore), per chi vuole
 * sfogliare l'intera bibliografia invece di cercare titolo per titolo.
 * A differenza di cercaLibriCompleto, qui la completezza conta più della
 * velocità: interroga sempre entrambe le fonti in parallelo (Google Books su
 * due pagine, per superare il limite di 40 risultati per chiamata, più Open
 * Library con il suo parametro "author" dedicato), poi filtra via tutto ciò
 * che non è davvero attribuito a quell'autore — perché "inauthor:" e
 * "author=" sono un aiuto alla ricerca, non un filtro esatto, e da soli
 * lascerebbero passare anche libri di altri autori solo abbastanza rilevanti.
 */
export async function cercaLibriPerAutoreCompleto(
  autore: string,
  { maxResults = 60 }: { maxResults?: number } = {}
): Promise<Libro[]> {
  if (!autore.trim()) return [];

  const [paginaUno, paginaDue, openLibrary] = await Promise.all([
    cercaLibriGoogle(`inauthor:${autore}`, { maxResults: 40, timeoutMs: 6000 }).catch(
      () => [] as Libro[]
    ),
    cercaLibriGoogle(`inauthor:${autore}`, { maxResults: 40, timeoutMs: 6000, startIndex: 40 }).catch(
      () => [] as Libro[]
    ),
    cercaLibriOpenLibraryPerAutore(autore, 60, 6000).catch(() => [] as Libro[]),
  ]);

  const visti = new Set<string>();
  const uniti: Libro[] = [];
  for (const libro of [...paginaUno, ...paginaDue, ...openLibrary]) {
    const chiave = chiaveDedupe(libro);
    if (visti.has(chiave)) continue;
    visti.add(chiave);
    uniti.push(libro);
  }

  const soloDiQuestoAutore = uniti.filter((l) => autoreCorrisponde(l.autori, autore));
  return italianiPrima(soloDiQuestoAutore).slice(0, maxResults);
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
