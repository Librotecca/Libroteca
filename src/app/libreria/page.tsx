import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { VoceLibreria } from "@/types";
import LibreriaClient from "./LibreriaClient";

export default async function LibreriaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("voci_libreria")
    .select("*, libro:libri(*)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Errore caricamento libreria:", error);
  }

  return <LibreriaClient voci={(data ?? []) as unknown as VoceLibreria[]} />;
}
