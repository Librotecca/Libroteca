import { redirect } from "next/navigation";
import { createClient, idUtenteCorrente } from "@/lib/supabase/server";
import HeroBand from "@/components/HeroBand";
import ObiettivoAnnuale from "@/components/ObiettivoAnnuale";
import type { VoceLibreria } from "@/types";

interface Conteggio {
  nome: string;
  conteggio: number;
}

function contaTop(voci: VoceLibreria[], campo: "categorie" | "autori", max: number): Conteggio[] {
  const mappa = new Map<string, number>();
  for (const v of voci) {
    const valori = v.libro?.[campo] ?? [];
    for (const valore of valori) {
      if (!valore) continue;
      mappa.set(valore, (mappa.get(valore) ?? 0) + 1);
    }
  }
  return Array.from(mappa.entries())
    .map(([nome, conteggio]) => ({ nome, conteggio }))
    .sort((a, b) => b.conteggio - a.conteggio)
    .slice(0, max);
}

const COLORI_BARRA = {
  accent: "bg-accent",
  muted: "bg-muted",
  success: "bg-success",
  danger: "bg-danger",
} as const;

function BarraLista({
  dati,
  colore = "accent",
}: {
  dati: (Conteggio & { colore?: keyof typeof COLORI_BARRA })[];
  colore?: keyof typeof COLORI_BARRA;
}) {
  if (dati.length === 0) {
    return <p className="text-muted text-sm">Non ci sono ancora abbastanza dati.</p>;
  }
  const massimo = Math.max(...dati.map((d) => d.conteggio), 1);
  return (
    <div className="flex flex-col gap-2">
      {dati.map((d) => (
        <div key={d.nome} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span>{d.nome}</span>
            <span className="text-muted">{d.conteggio}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${COLORI_BARRA[d.colore ?? colore]}`}
              style={{ width: `${Math.max(6, (d.conteggio / massimo) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function StatistichePage() {
  const userId = await idUtenteCorrente();
  if (!userId) redirect("/login");

  const supabase = await createClient();
  const [{ data, error }, { data: profilo }] = await Promise.all([
    supabase.from("voci_libreria").select("*, libro:libri(*)").eq("user_id", userId),
    supabase
      .from("profili")
      .select("obiettivo_lettura_annuale")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (error) {
    console.error("Errore caricamento statistiche:", error);
  }

  const voci = (data ?? []) as unknown as VoceLibreria[];

  const letti = voci.filter((v) => v.stato === "letto");
  const inLettura = voci.filter((v) => v.stato === "in_lettura");
  const daLeggere = voci.filter((v) => v.stato === "da_leggere");
  const abbandonati = voci.filter((v) => v.stato === "abbandonato");

  const annoCorrente = new Date().getFullYear();
  const lettiQuestAnno = letti.filter(
    (v) => v.data_fine && new Date(v.data_fine).getFullYear() === annoCorrente
  ).length;

  const paginetotali = letti.reduce((somma, v) => somma + (v.libro?.pagine ?? 0), 0);

  const votati = letti.filter((v) => typeof v.valutazione === "number");
  const votoMedio =
    votati.length > 0
      ? votati.reduce((somma, v) => somma + (v.valutazione ?? 0), 0) / votati.length
      : null;

  const topGeneri = contaTop(letti, "categorie", 5);
  const topAutori = contaTop(letti, "autori", 5);

  const conteggioPerStato: { etichetta: string; conteggio: number; colore: "success" | "accent" | "muted" | "danger" }[] = [
    { etichetta: "Letti", conteggio: letti.length, colore: "success" },
    { etichetta: "In lettura", conteggio: inLettura.length, colore: "accent" },
    { etichetta: "Da leggere", conteggio: daLeggere.length, colore: "muted" },
    { etichetta: "Abbandonati", conteggio: abbandonati.length, colore: "danger" },
  ];

  const tessere: { etichetta: string; valore: string }[] = [
    { etichetta: "Libri letti", valore: String(letti.length) },
    { etichetta: `Letti nel ${annoCorrente}`, valore: String(lettiQuestAnno) },
    { etichetta: "Pagine lette", valore: paginetotali.toLocaleString("it-IT") },
    { etichetta: "Voto medio", valore: votoMedio ? `${votoMedio.toFixed(1)} / 5` : "—" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <HeroBand titolo="Le tue statistiche" sottotitolo="Un riepilogo di come e cosa hai letto finora.">
        <ObiettivoAnnuale
          anno={annoCorrente}
          lettiQuestAnno={lettiQuestAnno}
          obiettivoIniziale={profilo?.obiettivo_lettura_annuale ?? null}
        />
      </HeroBand>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tessere.map((t) => (
          <div
            key={t.etichetta}
            className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-1"
          >
            <span className="text-2xl font-semibold text-accent-strong">{t.valore}</span>
            <span className="text-xs text-muted">{t.etichetta}</span>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg p-4">
        <h2 className="font-medium text-sm mb-3">Libri per stato</h2>
        <BarraLista
          dati={conteggioPerStato.map((c) => ({
            nome: c.etichetta,
            conteggio: c.conteggio,
            colore: c.colore,
          }))}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4">
          <h2 className="font-medium text-sm mb-3">Generi più letti</h2>
          <BarraLista dati={topGeneri} />
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <h2 className="font-medium text-sm mb-3">Autori più letti</h2>
          <BarraLista dati={topAutori} />
        </div>
      </div>

      {letti.length === 0 && (
        <p className="text-muted text-sm">
          Segna qualche libro come &ldquo;Letto&rdquo; nella tua libreria per iniziare a vedere le
          statistiche qui.
        </p>
      )}
    </div>
  );
}
