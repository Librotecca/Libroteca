// Mostrato istantaneamente da Next.js mentre la pagina Libreria carica i dati
// sul server, così il cambio pagina si vede subito invece di restare "fermo".
export default function CaricamentoLibreria() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-32 rounded-2xl bg-surface-2" />
      <div className="flex gap-2 border-b border-border pb-2">
        <div className="h-6 w-16 rounded bg-surface-2" />
        <div className="h-6 w-20 rounded bg-surface-2" />
        <div className="h-6 w-20 rounded bg-surface-2" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="aspect-[2/3] rounded-lg bg-surface-2" />
            <div className="h-3 w-full rounded bg-surface-2" />
            <div className="h-3 w-2/3 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
