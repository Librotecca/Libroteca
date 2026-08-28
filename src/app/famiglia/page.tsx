import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Famiglia, MembroFamiglia } from "@/types";
import FamigliaClient from "./FamigliaClient";

export default async function FamigliaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: propriaRiga } = await supabase
    .from("membri_famiglia")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  let famiglia: Famiglia | null = null;
  let membri: MembroFamiglia[] = [];

  if (propriaRiga) {
    const { data: famigliaData } = await supabase
      .from("famiglie")
      .select("*")
      .eq("id", propriaRiga.famiglia_id)
      .single();
    famiglia = famigliaData as Famiglia;

    const { data: membriGrezzi } = await supabase
      .from("membri_famiglia")
      .select("*, profilo:profili(*)")
      .eq("famiglia_id", propriaRiga.famiglia_id);
    membri = (membriGrezzi ?? []) as unknown as MembroFamiglia[];
  }

  return <FamigliaClient famigliaIniziale={famiglia} membriIniziali={membri} userId={user.id} />;
}
