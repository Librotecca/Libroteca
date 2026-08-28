"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function esci() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={esci}
      className="px-2 py-1 rounded text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
    >
      Esci
    </button>
  );
}
