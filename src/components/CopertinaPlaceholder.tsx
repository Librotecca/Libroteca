/**
 * Segnaposto mostrato al posto della copertina quando un libro non ne ha una.
 * Un libro aperto con una stellina, in stile coerente col logo dell'app,
 * al posto della vecchia emoji generica "📖".
 */
export default function CopertinaPlaceholder({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={`w-full h-full text-muted ${className}`}
      aria-hidden="true"
    >
      <path
        d="M32 16c-4-3-11-4-17-3v29c6-1 13 0 17 3 4-3 11-4 17-3V13c-6-1-13 0-17 3Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M32 16v29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M46 12.5l1.1 2.4 2.4 1.1-2.4 1.1-1.1 2.4-1.1-2.4-2.4-1.1 2.4-1.1 1.1-2.4Z"
        fill="currentColor"
      />
    </svg>
  );
}
