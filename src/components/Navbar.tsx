import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-border bg-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-accent-strong">
          📚 Libroteca
        </Link>

        {user && (
          <nav className="flex items-center gap-1 sm:gap-4 text-sm">
            <Link href="/libreria" className="px-2 py-1 rounded hover:bg-surface-2 transition-colors">
              Libreria
            </Link>
            <Link href="/cerca" className="px-2 py-1 rounded hover:bg-surface-2 transition-colors">
              Cerca
            </Link>
            <Link href="/consigli" className="px-2 py-1 rounded hover:bg-surface-2 transition-colors">
              Consigli
            </Link>
            <LogoutButton />
          </nav>
        )}
      </div>
    </header>
  );
}
