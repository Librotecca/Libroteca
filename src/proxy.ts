import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Mantiene aggiornata la sessione Supabase (refresh token) a ogni richiesta
// e reindirizza al login le pagine protette se l'utente non è autenticato.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicPath = pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Passa l'id utente già verificato qui sopra alle Server Component (Navbar,
  // pagine protette) tramite un header di richiesta: evita che ognuna debba
  // richiamare di nuovo supabase.auth.getUser() (una richiesta di rete verso
  // Supabase) — prima capitava fino a 3 volte per ogni cambio pagina, la causa
  // principale della navigazione percepita come lenta. Le eventuali cookie di
  // refresh sessione impostate sopra vengono preservate.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", user?.id ?? "");
  const cookieEsistenti = response.cookies.getAll();
  response = NextResponse.next({ request: { headers: requestHeaders } });
  cookieEsistenti.forEach((cookie) => response.cookies.set(cookie));

  return response;
}

export const config = {
  matcher: [
    // manifest.webmanifest e sw.js devono restare raggiungibili anche da chi
    // non ha ancora effettuato l'accesso (es. il browser che valuta se può
    // proporre "Aggiungi alla schermata Home" dalla pagina di login).
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
