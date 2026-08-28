# Libroteca 📚

La tua libreria personale: traccia i libri letti, in lettura e da leggere (principalmente in
italiano), con consigli di lettura generati dall'AI in base ai tuoi gusti.

Stessa impostazione tecnica di Nightwatch: **Next.js** (App Router) + **Supabase**
(database + autenticazione) + **Vercel** (hosting), più **Google Books API** come catalogo e
**Anthropic (Claude)** per i consigli personalizzati.

## Funzionalità

- Ricerca libri nel catalogo Google Books, con priorità ai risultati in lingua italiana
- Libreria personale organizzata per stato: **Da leggere**, **In lettura**, **Letto**, **Abbandonato**
- Per ogni libro: valutazione personale (1-5 stelle), note, date di inizio/fine lettura
- Consigli di lettura generati da Claude in base ai libri letti (e a quelli abbandonati, per capire
  cosa evitare), arricchiti con copertina e descrizione reale dal catalogo Google Books
- Login a scelta: email + password, oppure link magico via email (nessuna password) — gestiti da Supabase Auth
- Tema scuro, mobile-friendly

## 1. Crea gli account (gratuiti)

Stessi passaggi fatti per Nightwatch:

1. **Supabase** → [supabase.com](https://supabase.com) → crea un nuovo progetto (piano Free).
2. **Vercel** → [vercel.com](https://vercel.com) → per il deploy (piano Free).
3. **Google Cloud Console** → [console.cloud.google.com](https://console.cloud.google.com) →
   abilita "Books API" e crea una API key (facoltativo: la ricerca funziona anche senza chiave, ma
   con limiti di richieste più bassi).
4. **Anthropic Console** → [console.anthropic.com](https://console.anthropic.com) → crea una API
   key per abilitare i consigli AI (account separato da claude.ai; richiede l'aggiunta di un
   metodo di pagamento, ma il costo per uso personale è minimo — pochi centesimi per
   generazione di consigli).

## 2. Configura Supabase

1. Nel progetto Supabase, apri **SQL Editor** → **New query**.
2. Incolla ed esegui il contenuto di [`supabase/schema.sql`](./supabase/schema.sql).
3. Vai su **Authentication → Providers** e assicurati che "Email" sia abilitato (di default lo è):
   copre sia il login con password sia il magic link, non serve configurare altro.
   - Se in **Authentication → Providers → Email** hai "Confirm email" attivo (default), chi si
     registra con password deve prima cliccare il link di conferma ricevuto via email prima di
     poter accedere. Puoi disattivarlo per test rapidi, ma è consigliato tenerlo attivo in
     produzione.
4. Vai su **Authentication → URL Configuration** e imposta:
   - Site URL: l'URL del tuo deploy Vercel (es. `https://libroteca.vercel.app`)
   - Redirect URLs: aggiungi `https://libroteca.vercel.app/auth/callback` (e
     `http://localhost:3000/auth/callback` se vuoi testare in locale)
5. Recupera le chiavi da **Project Settings → API**: `Project URL`, `anon public key`,
   `service_role key` (questa è segreta, non condividerla).

## 3. Configura le variabili d'ambiente

Copia `.env.local.example` in `.env.local` e compila i valori:

```bash
cp .env.local.example .env.local
```

| Variabile | Da dove prenderla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (segreta!) |
| `GOOGLE_BOOKS_API_KEY` | Google Cloud Console (opzionale) |
| `ANTHROPIC_API_KEY` | Anthropic Console |
| `ANTHROPIC_MODEL` | Opzionale, default `claude-sonnet-4-5` — controlla il modello più recente disponibile su [docs.claude.com](https://docs.claude.com) |

## 4. Avvia in locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## 5. Deploy su Vercel

1. Carica il progetto su GitHub (o collega direttamente la cartella con `vercel` CLI).
2. Su Vercel: **New Project** → importa il repository.
3. Aggiungi le stesse variabili d'ambiente di `.env.local` nelle impostazioni del progetto Vercel
   (**Settings → Environment Variables**).
4. Deploy. Poi aggiorna su Supabase l'URL di redirect con il dominio Vercel definitivo (vedi punto
   2.4 sopra).

## Struttura del progetto

```
src/
  app/
    login/            pagina di accesso (magic link)
    auth/callback/     gestisce il redirect del magic link
    libreria/          la libreria personale, divisa per stato di lettura
    cerca/             ricerca nel catalogo Google Books e aggiunta alla libreria
    libro/[id]/        dettaglio di una voce: stato, valutazione, note
    consigli/          consigli di lettura generati dall'AI
    api/
      cerca-libri/     proxy server-side verso Google Books
      libri/           CRUD sulle voci della libreria personale
      consigli/        genera/recupera i consigli AI
  lib/
    supabase/          client Supabase (browser, server, admin)
    google-books.ts    integrazione con Google Books API
    consigli.ts         logica di generazione consigli con Claude
  types/               tipi condivisi
supabase/
  schema.sql           schema del database + Row Level Security
```

## Idee per il futuro

- Statistiche di lettura (libri letti per anno, pagine totali, genere più letto)
- Import massivo da un export Goodreads/Anobii per popolare velocemente la libreria
- Condivisione della libreria con altri utenti (come Nightwatch), se in futuro diventa un progetto
  multi-utente/prodotto
- Notifiche quando esce un nuovo libro di un autore già letto
