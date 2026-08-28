import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient, idUtenteCorrente } from "@/lib/supabase/server";
import BookCard from "@/components/BookCard";
import ShelfBadge from "@/components/ShelfBadge";
import StarRating from "@/components/StarRating";
import type { VoceLibreria } from "@/types";

export default async function LibreriaFamiliarePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const propriaId = await idUtenteCorrente();
  if (!propriaId) redirect("/login");

  const supabase = await createClient();

  // La policy RLS "voci_libreria: lettura famiglia" permette di leggere queste
  // righe solo se userId condivide effettivamente una famiglia con l'utente
  // corrente. Le due query sono indipendenti: eseguite in parallelo.
  const [{ data: voci, error }, { data: profilo }] = await Promise.all([
    supabase
      .from("voci_libreria")
      .select("*, libro:libri(*)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase.from("profili").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (error || !profilo) notFound();

  const elenco = (voci ?? []) as unknown as VoceLibreria[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/famiglia" className="text-sm text-accent underline">
          ← Famiglia
        </Link>
        <h1 className="text-xl font-semibold mt-2">
          Libreria di {profilo.nome_visualizzato ?? profilo.email}
        </h1>
      </div>

      {elenco.length === 0 ? (
        <p className="text-muted text-sm">Non ha ancora aggiunto libri.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {elenco.map((voce) =>
            voce.libro ? (
              <BookCard key={voce.id} libro={voce.libro} compatto>
                <div className="flex items-center gap-3 flex-wrap">
                  <ShelfBadge stato={voce.stato} />
                  {voce.valutazione && <StarRating valore={voce.valutazione} leggibile />}
                </div>
                {voce.note && <p className="text-xs text-muted mt-1.5 italic">&ldquo;{voce.note}&rdquo;</p>}
              </BookCard>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
