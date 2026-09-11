import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Gestisce il redirect del magic link e del link di reset password
// inviati via email da Supabase Auth. Il parametro "next" permette di
// scegliere dove atterrare dopo lo scambio del codice (es. /auth/reset-password
// per il flusso "password dimenticata", /libreria per il magic link normale).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") || "/libreria";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
