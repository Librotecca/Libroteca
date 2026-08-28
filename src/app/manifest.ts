import type { MetadataRoute } from "next";

// Permette di "installare" Libroteca come vera app (icona sulla schermata Home,
// niente barra degli indirizzi) sia su Android sia, tramite le impostazioni
// apple-mobile-web-app in layout.tsx, su iPhone/iPad.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Libroteca",
    short_name: "Libroteca",
    description: "La tua libreria personale, con consigli di lettura su misura.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf5ee",
    theme_color: "#55295c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
