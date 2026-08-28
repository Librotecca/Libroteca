import Anthropic from "@anthropic-ai/sdk";

const MODELLO = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export interface CopertinaRiconosciuta {
  titolo: string | null;
  autore: string | null;
}

/**
 * Analizza la foto di una copertina di libro con Claude (visione) per leggerne
 * titolo e autore, così da poterlo cercare nel catalogo senza il codice a barre
 * (utile per libri usati, copertine rovinate, edizioni senza ISBN leggibile...).
 * Non è un database di immagini di copertine: Claude "legge" la foto come farebbe
 * una persona, quindi funziona meglio con buona luce e testo leggibile.
 */
export async function riconosciCopertina(
  immagineBase64: string,
  mediaType: MediaType
): Promise<CopertinaRiconosciuta> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY non configurata. Aggiungila alle variabili d'ambiente per abilitare il riconoscimento da copertina."
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const messaggio = await anthropic.messages.create({
    model: MODELLO,
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: immagineBase64 },
          },
          {
            type: "text",
            text: `Guarda questa foto di una copertina di libro. Individua il titolo esatto e il nome dell'autore, se sono leggibili nell'immagine.

Rispondi SOLO con un oggetto JSON valido (nessun testo prima o dopo), in questo formato esatto:
{"titolo": "...", "autore": "..."}

Se non riesci a leggere il titolo con ragionevole sicurezza, rispondi {"titolo": null, "autore": null}. Se leggi il titolo ma non l'autore, lascia "autore": null.`,
          },
        ],
      },
    ],
  });

  const testo = messaggio.content
    .filter((blocco) => blocco.type === "text")
    .map((blocco) => (blocco.type === "text" ? blocco.text : ""))
    .join("");

  try {
    const match = testo.match(/\{[\s\S]*\}/);
    const grezzo = JSON.parse(match ? match[0] : testo) as {
      titolo?: string | null;
      autore?: string | null;
    };
    return {
      titolo: grezzo.titolo?.trim() || null,
      autore: grezzo.autore?.trim() || null,
    };
  } catch (err) {
    console.error("Impossibile interpretare la risposta di Claude:", testo, err);
    return { titolo: null, autore: null };
  }
}
