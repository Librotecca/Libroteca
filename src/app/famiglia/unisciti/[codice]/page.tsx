import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UnisciteClient from "./UnisciteClient";

export default async function UnisciteAllaFamigliaPage({
  params,
}: {
  params: Promise<{ codice: string }>;
}) {
  const { codice } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <UnisciteClient codice={codice} />;
}
