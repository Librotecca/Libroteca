import { redirect } from "next/navigation";
import { idUtenteCorrente } from "@/lib/supabase/server";

export default async function Home() {
  const userId = await idUtenteCorrente();
  redirect(userId ? "/libreria" : "/login");
}
