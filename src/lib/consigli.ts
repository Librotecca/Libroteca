import Anthropic from "@anthropic-ai/sdk";
import type { Consiglio, VoceLibreria } from "@/types";
import { trovaLibroCompleto } from "@/lib/catalogo";

const MODELLO = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

interface TitoloNonGradito {
  titolo: string;
  autore: string | null;
}

function buildPrompt(
  letti: VoceLibreria[],
  abbandonati: VoceLibreria[],
  nonGraditi: TitoloNonGradito[]
): string {
  const righeLetti = letti
    .map((v) => {
      const l = v.libro;
      if (!l) return null;
      const voto = v.valutazione ? ` — voto personale: ${v.valutazione}/5` : "";
      const nota = v.note ? ` — nota: "${v.note}"` : "";
      const genere = l.categorie?.length ? ` (${l.categorie.join(", ")})` : "";
      return `- "${l.titolo}" di ${l.autori.join(", ") || "autore sconosciuto"}${genere}${voto}${nota}`;
    })
    .filter(Boolean)
    .join("\n");

  const righeAbbandonati = abbandonati
    .map((v) => {
      const l = v.libro;
      if (!l) return null;
      return `- "${l.titolo}" di ${l.autori.join(", ") || "autore sconosciuto"}`;
    })
    .filter(Boolean)
    .join("\n");

  const righeNonGraditi = nonGraditi
    .map((n) => `- "${n.titolo}"${n.autore ? ` di ${n.autore}` : ""}`)
    .join("\n");

  return `Sei un bibliotecario esperto di letteratura italiana e internazionale. Un lettore italiano ti mostra la sua libreria personale.

LIBRI LETTI (con eventuale voto personale da 1 a 5 e note):
${righeLetti || "(nessuno)"}

LIBRI ABBANDONATI (non finiti perché non piaciuti):
${righeAbbandonati || "(nessuno)"}

TITOLI GIÀ SUGGERITI E SCARTATI DAL LETTORE (non riproporli mai):
${righeNonGraditi || "(nessuno)"}

Analizza i gusti di questo lettore: generi preferiti, temi ricorrenti, stile di scrittura apprezzato, cosa invece lo annoia (guarda i libri abbandonati, i voti bassi e i titoli scartati). Poi consiglia 8 libri NUOVI che non sono già in nessuno degli elenchi sopra, che potrebbero piacergli. Dai priorità a libri disponibili in lingua italiana (originali italiani o tradotti in italiano), ma includi anche qualche titolo internazionale rilevante se pertinente.

Rispondi SOLO con un array JSON valido (nessun testo prima o dopo), con questo formato esatto:
[
  { "titolo": "...", "autore": "...", "genere": "...", "motivo": "una frase breve e personale sul perché potrebbe piacergli, in italiano" }
]`;
}

/**
 * Genera consigli di lettura personalizzati con Claude, basandosi sui libri
 * letti (e abbandonati) dall'utente, poi arricchisce ogni suggerimento con
 * i dati reali (copertina, descrizione) dal catalogo Google Books.
 */
export async function generaConsigli(
  letti: VoceLibreria[],
  abbandonati: VoceLibreria[],
  nonGraditi: TitoloNonGradito[] = []
): Promise<Consiglio[]> {
  if (letti.length === 0) {
    return [];
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY non configurata. Aggiungila alle variabili d'ambiente per abilitare i consigli AI."
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const messaggio = await anthropic.messages.create({
    model: MODELLO,
    max_tokens: 2000,
    messages: [{ role: "user", content: buildPrompt(letti, abbandonati, nonGraditi) }],
  });

  const testo = messaggio.content
    .filter((blocco) => blocco.type === "text")
    .map((blocco) => (blocco.type === "text" ? blocco.text : ""))
    .join("");

  let grezzi: { titolo: string; autore: string; genere?: string; motivo: string }[] = [];
  try {
    const match = testo.match(/\[[\s\S]*\]/);
    grezzi = JSON.parse(match ? match[0] : testo);
  } catch (err) {
    console.error("Impossibile interpretare la risposta di Claude:", testo, err);
    throw new Error("Risposta AI non valida, riprova.");
  }

  const titoliDaEscludere = new Set([
    ...[...letti, ...abbandonati].map((v) => v.libro?.titolo?.toLowerCase().trim()),
    ...nonGraditi.map((n) => n.titolo.toLowerCase().trim()),
  ]);

  const consigliFiltrati = grezzi.filter(
    (c) => !titoliDaEscludere.has(c.titolo?.toLowerCase().trim())
  );

  // Arricchisci ogni consiglio con i dati reali di Google Books (copertina, descrizione)
  const consigli: Consiglio[] = await Promise.all(
    consigliFiltrati.map(async (c) => {
      let libro = null;
      try {
        libro = await trovaLibroCompleto(c.titolo, c.autore);
      } catch {
        libro = null;
      }
      return { ...c, libro };
    })
  );

  return consigli;
}
