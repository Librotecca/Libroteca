import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-border bg-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <Link href="/" className="font-semibold tracking-tight text-accent-strong shrink-0">
          📚 Libroteca
        </Link>

        {user && (
          <nav className="flex items-center gap-0.5 sm:gap-3 text-sm overflow-x-auto">
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
            <ThemeToggle />
            <LogoutButton />
          </nav>
        )}
      </div>
    </header>
  );
}
