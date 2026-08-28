export default function CaricamentoFamiglia() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-6 w-40 rounded bg-surface-2" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-surface-2" />
      ))}
    </div>
  );
}
