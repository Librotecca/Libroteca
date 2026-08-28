import Image from "next/image";
import type { ReactNode } from "react";
import type { Libro } from "@/types";
import CopertinaPlaceholder from "@/components/CopertinaPlaceholder";

export default function BookCard({
  libro,
  children,
  compatto = false,
}: {
  libro: Libro;
  children?: ReactNode;
  compatto?: boolean;
}) {
  return (
    <div className="flex gap-3 bg-surface border border-border rounded-lg p-3">
      <div className="shrink-0 w-16 h-24 bg-surface-2 rounded overflow-hidden relative">
        {libro.immagine_url ? (
          <Image
            src={libro.immagine_url}
            alt={libro.titolo}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2">
            <CopertinaPlaceholder />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-serif font-medium leading-tight line-clamp-2">{libro.titolo}</h3>
        {libro.autori.length > 0 && (
          <p className="text-sm text-muted mt-0.5">{libro.autori.join(", ")}</p>
        )}
        {!compatto && libro.descrizione && (
          <p className="text-xs text-muted mt-1.5 line-clamp-2">{libro.descrizione}</p>
        )}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}
