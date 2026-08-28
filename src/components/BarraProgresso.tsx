// Barra di progresso viola → verde (stile "quanto manca al traguardo"),
// riusata sia per il segnalibro di un libro sia per l'obiettivo annuale.
export default function BarraProgresso({
  percento,
  altezza = "h-2.5",
  traccia = "bg-surface-2",
}: {
  percento: number;
  altezza?: string;
  traccia?: string;
}) {
  const clampato = Math.max(0, Math.min(100, percento));
  return (
    <div className={`w-full ${altezza} rounded-full ${traccia} overflow-hidden`}>
      <div
        className={`${altezza} rounded-full transition-[width] duration-300`}
        style={{
          width: `${clampato}%`,
          background: "linear-gradient(90deg, var(--accent-strong), var(--success))",
        }}
      />
    </div>
  );
}
