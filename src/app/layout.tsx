import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Libroteca",
  description: "La tua libreria personale, con consigli di lettura su misura.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
