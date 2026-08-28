import type { ReactNode } from "react";

/**
 * Fascia decorativa in cima a Libreria e Statistiche: gradiente viola con
 * stelline e luna, che richiama l'illustrazione del logo. È sempre "scura"
 * (colori fissi, non le variabili di tema) così mantiene lo stesso aspetto
 * sia in chiaro sia in scuro.
 */
export default function HeroBand({
  titolo,
  sottotitolo,
  children,
}: {
  titolo: string;
  sottotitolo?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 py-6 sm:px-7 sm:py-7 text-white"
      style={{ background: "linear-gradient(135deg, #3d2240 0%, #55295c 55%, #7a4380 100%)" }}
    >
      <svg
        viewBox="0 0 200 100"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full opacity-70"
      >
        <circle cx="176" cy="18" r="9" fill="#F2DCC3" opacity="0.9" />
        <circle cx="172" cy="14" r="7.5" fill="#3d2240" />
        {[
          [18, 14, 2.2],
          [40, 30, 1.4],
          [150, 55, 1.6],
          [130, 20, 1.2],
          [60, 12, 1.1],
          [190, 70, 1.3],
          [10, 60, 1.5],
        ].map(([cx, cy, r], i) => (
          <path
            key={i}
            d={`M${cx} ${cy - r} L${cx + r * 0.3} ${cy - r * 0.3} L${cx + r} ${cy} L${cx + r * 0.3} ${cy + r * 0.3} L${cx} ${cy + r} L${cx - r * 0.3} ${cy + r * 0.3} L${cx - r} ${cy} L${cx - r * 0.3} ${cy - r * 0.3} Z`}
            fill="#F2DCC3"
            opacity="0.85"
          />
        ))}
      </svg>

      <div className="relative flex flex-col gap-1">
        <h1 className="font-serif text-xl sm:text-2xl font-semibold leading-tight">{titolo}</h1>
        {sottotitolo && <p className="text-sm text-white/80">{sottotitolo}</p>}
        {children}
      </div>
    </div>
  );
}
