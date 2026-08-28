export default function CaricamentoStatistiche() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="h-40 rounded-2xl bg-surface-2" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-surface-2" />
        ))}
      </div>
      <div className="h-32 rounded-lg bg-surface-2" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="h-40 rounded-lg bg-surface-2" />
        <div className="h-40 rounded-lg bg-surface-2" />
      </div>
    </div>
  );
}
