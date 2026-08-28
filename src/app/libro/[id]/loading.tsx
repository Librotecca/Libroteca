export default function CaricamentoDettaglio() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl animate-pulse">
      <div className="flex gap-4">
        <div className="shrink-0 w-28 h-40 rounded bg-surface-2" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="h-5 w-3/4 rounded bg-surface-2" />
          <div className="h-4 w-1/2 rounded bg-surface-2" />
          <div className="h-3 w-2/3 rounded bg-surface-2" />
        </div>
      </div>
      <div className="h-40 rounded-lg bg-surface-2" />
    </div>
  );
}
