import Link from "next/link";
import Image from "next/image";
import { idUtenteCorrente } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import BottomNav from "@/components/BottomNav";

export default async function Navbar() {
  // Solo lettura dell'header impostato da proxy.ts: niente più chiamata di
  // rete a supabase.auth.getUser() a ogni cambio pagina (la Navbar è nel
  // layout condiviso, quindi si rieseguiva ad ogni navigazione).
  const userId = await idUtenteCorrente();
  const user = Boolean(userId);

  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif font-semibold tracking-tight text-accent-strong shrink-0"
          >
            <Image src="/icon.png" alt="" width={28} height={28} className="rounded-lg" priority />
            Libroteca
          </Link>

          {user && (
            <nav className="flex items-center gap-0.5 sm:gap-3 text-sm overflow-x-auto">
              {/* Su mobile questi link sono sostituiti dalla barra fissa in basso (BottomNav). */}
              <div className="hidden sm:flex items-center gap-3">
                <Link href="/libreria" className="px-2 py-1 rounded hover:bg-surface-2 transition-colors whitespace-nowrap">
                  Libreria
                </Link>
                <Link href="/cerca" className="px-2 py-1 rounded hover:bg-surface-2 transition-colors whitespace-nowrap">
                  Cerca
                </Link>
                <Link href="/consigli" className="px-2 py-1 rounded hover:bg-surface-2 transition-colors whitespace-nowrap">
                  Consigli
                </Link>
                <Link href="/statistiche" className="px-2 py-1 rounded hover:bg-surface-2 transition-colors whitespace-nowrap">
                  Statistiche
                </Link>
                <Link href="/famiglia" className="px-2 py-1 rounded hover:bg-surface-2 transition-colors whitespace-nowrap">
                  Famiglia
                </Link>
              </div>
              <ThemeToggle />
              <LogoutButton />
            </nav>
          )}
        </div>
      </header>
      {user && <BottomNav />}
    </>
  );
}
