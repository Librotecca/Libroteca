export default function CaricamentoLibreriaFamiliare() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-5 w-56 rounded bg-surface-2" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
