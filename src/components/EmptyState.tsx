import type { ReactNode } from "react";

// Illustrazione semplice, coerente con lo stile del logo (libro aperto,
// luna e stelline), da mostrare al posto di un messaggio grigio isolato.
function IllustrazioneLibro() {
  return (
    <svg viewBox="0 0 120 90" className="w-28 h-auto" aria-hidden="true">
      <path
        d="M60 26c-8-6-22-8-34-6v46c12-2 26 0 34 6 8-6 22-8 34-6V20c-12-2-26 0-34 6Z"
        fill="var(--accent)"
        fillOpacity="0.14"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M60 26v46" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="96" cy="16" r="7" fill="var(--success)" fillOpacity="0.35" />
      <path
        d="M20 12l1.6 3.4L25 17l-3.4 1.6L20 22l-1.6-3.4L15 17l3.4-1.6L20 12Z"
        fill="var(--accent)"
        fillOpacity="0.5"
      />
      <path
        d="M104 46l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6-2.6-1.2 2.6-1.2 1.2-2.6Z"
        fill="var(--accent)"
        fillOpacity="0.5"
      />
    </svg>
  );
}

export default function EmptyState({
  titolo,
  descrizione,
  azione,
}: {
  titolo: string;
  descrizione?: ReactNode;
  azione?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-12 px-4">
      <IllustrazioneLibro />
      <p className="font-medium">{titolo}</p>
      {descrizione && <p className="text-muted text-sm max-w-xs">{descrizione}</p>}
      {azione}
    </div>
  );
}
