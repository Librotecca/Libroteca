import { redirect } from "next/navigation";
import { createClient, idUtenteCorrente } from "@/lib/supabase/server";
import type { Famiglia, MembroFamiglia } from "@/types";
import FamigliaClient from "./FamigliaClient";

export default async function FamigliaPage() {
  const userId = await idUtenteCorrente();
  if (!userId) redirect("/login");

  const supabase = await createClient();
  const { data: propriaRiga } = await supabase
    .from("membri_famiglia")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  let famiglia: Famiglia | null = null;
  let membri: MembroFamiglia[] = [];

  if (propriaRiga) {
    // Nessuna delle due dipende dall'altra: eseguite in parallelo invece che
    // in sequenza per dimezzare il tempo di attesa della pagina.
    const [{ data: famigliaData }, { data: membriGrezzi }] = await Promise.all([
      supabase.from("famiglie").select("*").eq("id", propriaRiga.famiglia_id).single(),
      supabase
        .from("membri_famiglia")
        .select("*, profilo:profili(*)")
        .eq("famiglia_id", propriaRiga.famiglia_id),
    ]);
    famiglia = famigliaData as Famiglia;
    membri = (membriGrezzi ?? []) as unknown as MembroFamiglia[];
  }

  return <FamigliaClient famigliaIniziale={famiglia} membriIniziali={membri} userId={userId} />;
}
