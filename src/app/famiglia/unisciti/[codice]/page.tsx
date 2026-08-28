import { redirect } from "next/navigation";
import { idUtenteCorrente } from "@/lib/supabase/server";
import UnisciteClient from "./UnisciteClient";

export default async function UnisciteAllaFamigliaPage({
  params,
}: {
  params: Promise<{ codice: string }>;
}) {
  const { codice } = await params;
  const userId = await idUtenteCorrente();
  if (!userId) redirect("/login");

  return <UnisciteClient codice={codice} />;
}
