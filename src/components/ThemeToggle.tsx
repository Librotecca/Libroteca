"use client";

import { useEffect, useState } from "react";

type Tema = "light" | "dark";

function temaAttuale(): Tema {
  if (typeof document === "undefined") return "light";
  const dataTheme = document.documentElement.getAttribute("data-theme");
  if (dataTheme === "dark" || dataTheme === "light") return dataTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    // Lettura del tema già applicato dallo ThemeScript inline al primo render lato client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTema(temaAttuale());
  }, []);

  function cambiaTema() {
    const nuovo: Tema = temaAttuale() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nuovo);
    try {
      localStorage.setItem("tema", nuovo);
    } catch {
      // localStorage non disponibile: il tema resta comunque applicato per questa sessione.
    }
    setTema(nuovo);
  }

  return (
    <button
      onClick={cambiaTema}
      aria-label="Cambia tema chiaro/scuro"
      className="px-2 py-1 rounded hover:bg-surface-2 transition-colors text-base leading-none"
    >
      {tema === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
