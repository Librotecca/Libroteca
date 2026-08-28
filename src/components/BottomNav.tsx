"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const VOCI = [
  { href: "/libreria", etichetta: "Libreria", icona: "📚" },
  { href: "/cerca", etichetta: "Cerca", icona: "🔍" },
  { href: "/consigli", etichetta: "Consigli", icona: "✨" },
  { href: "/statistiche", etichetta: "Statistiche", icona: "📊" },
  { href: "/famiglia", etichetta: "Famiglia", icona: "👪" },
];

// Barra di navigazione fissa in basso, visibile solo su mobile: più comoda da
// raggiungere col pollice rispetto ai link testuali in alto, come nelle app
// di lettura native.
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-surface border-t border-border flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {VOCI.map((voce) => {
        const attivo = pathname === voce.href || pathname.startsWith(`${voce.href}/`);
        return (
          <Link
            key={voce.href}
            href={voce.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors ${
              attivo ? "text-accent-strong" : "text-muted"
            }`}
          >
            <span className="text-lg leading-none">{voce.icona}</span>
            {voce.etichetta}
          </Link>
        );
      })}
    </nav>
  );
}
