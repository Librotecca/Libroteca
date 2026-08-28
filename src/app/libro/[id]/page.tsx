import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { VoceLibreria } from "@/types";
import DettaglioClient from "./DettaglioClient";

export default async function DettaglioLibroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("voci_libreria")
    .select("*, libro:libri(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) notFound();

  return <DettaglioClient voce={data as unknown as VoceLibreria} />;
}
