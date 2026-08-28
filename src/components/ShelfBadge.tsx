import { ETICHETTE_STATO, type StatoLettura } from "@/types";

const COLORI: Record<StatoLettura, string> = {
  da_leggere: "bg-surface-2 text-muted",
  in_lettura: "bg-accent/20 text-accent-strong",
  letto: "bg-success/20 text-success-strong",
  abbandonato: "bg-danger/20 text-danger",
};

export default function ShelfBadge({ stato }: { stato: StatoLettura }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COLORI[stato]}`}>
      {ETICHETTE_STATO[stato]}
    </span>
  );
}
