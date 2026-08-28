import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeScript from "@/components/ThemeScript";
import RegistraServiceWorker from "@/components/RegistraServiceWorker";
import BannerOffline from "@/components/BannerOffline";

export const metadata: Metadata = {
  title: "Libroteca",
  description: "La tua libreria personale, con consigli di lettura su misura.",
  // Permette di aggiungere Libroteca alla schermata Home su iPhone/iPad come
  // una vera app (icona personalizzata, niente barra di Safari quando si apre
  // da lì). Su Android la stessa cosa è gestita dal file manifest.ts.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Libroteca",
  },
};

export const viewport: Viewport = {
  themeColor: "#55295c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <RegistraServiceWorker />
        <BannerOffline />
        <Navbar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
