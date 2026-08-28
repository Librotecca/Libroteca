import Image from "next/image";
import CopertinaPlaceholder from "@/components/CopertinaPlaceholder";
import ShelfBadge from "@/components/ShelfBadge";
import BarraProgresso from "@/components/BarraProgresso";
import type { StatoLettura, Libro } from "@/types";

// Card per la vista a griglia della Libreria: copertina grande in evidenza,
// stato in overlay, e una mini barra di progresso per i libri in lettura.
export default function BookCoverCard({
  libro,
  stato,
  percentoLetto,
}: {
  libro: Libro;
  stato: StatoLettura;
  percentoLetto: number | null;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-[2/3] bg-surface-2 rounded-lg overflow-hidden border border-border">
        {libro.immagine_url ? (
          <Image
            src={libro.immagine_url}
            alt={libro.titolo}
            fill
            sizes="(max-width: 640px) 33vw, 150px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <CopertinaPlaceholder />
          </div>
        )}
        <div className="absolute top-1.5 right-1.5">
          <ShelfBadge stato={stato} />
        </div>
        {percentoLetto !== null && (
          <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
            <BarraProgresso percento={percentoLetto} altezza="h-1.5" traccia="bg-white/25" />
          </div>
        )}
      </div>
      <h3 className="font-serif text-sm font-medium leading-tight line-clamp-2">{libro.titolo}</h3>
      {libro.autori.length > 0 && (
        <p className="text-xs text-muted line-clamp-1">{libro.autori.join(", ")}</p>
      )}
    </div>
  );
}
