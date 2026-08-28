-- Libroteca — schema Supabase
-- Esegui questo script nell'SQL Editor del tuo progetto Supabase (una sola volta).

-- Estensione per generare UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- Tabella "libri": cache locale dei dati recuperati da Google Books
-- Condivisa tra tutti gli utenti, non contiene dati personali.
-- ============================================================
create table if not exists public.libri (
  id text primary key,                 -- Google Books volume id
  titolo text not null,
  sottotitolo text,
  autori text[] default '{}',
  descrizione text,
  immagine_url text,
  isbn_13 text,
  isbn_10 text,
  editore text,
  data_pubblicazione text,
  categorie text[] default '{}',
  lingua text,
  pagine int,
  link_google_books text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Tabella "voci_libreria": la libreria personale di ogni utente
-- ============================================================
create table if not exists public.voci_libreria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  libro_id text not null references public.libri(id) on delete cascade,
  stato text not null check (stato in ('da_leggere', 'in_lettura', 'letto', 'abbandonato')),
  valutazione smallint check (valutazione between 1 and 5),
  note text,
  data_inizio date,
  data_fine date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, libro_id)
);

create index if not exists voci_libreria_user_id_idx on public.voci_libreria(user_id);
create index if not exists voci_libreria_stato_idx on public.voci_libreria(stato);

-- Aggiorna automaticamente updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_voci_libreria_updated_at on public.voci_libreria;
create trigger trg_voci_libreria_updated_at
  before update on public.voci_libreria
  for each row execute function public.set_updated_at();

-- ============================================================
-- Tabella "consigli_cache": ultimi consigli AI generati per utente
-- (evita di richiamare l'API di Claude a ogni apertura della pagina)
-- ============================================================
create table if not exists public.consigli_cache (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consigli jsonb not null,
  generated_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.libri enable row level security;
alter table public.voci_libreria enable row level security;
alter table public.consigli_cache enable row level security;

-- "libri" è un catalogo condiviso in sola lettura per gli utenti autenticati.
-- Le scritture (cache da Google Books) avvengono lato server con la service role key.
drop policy if exists "libri: lettura per autenticati" on public.libri;
create policy "libri: lettura per autenticati"
  on public.libri for select
  to authenticated
  using (true);

-- "voci_libreria": ogni utente vede e modifica solo le proprie righe.
drop policy if exists "voci_libreria: solo proprie righe" on public.voci_libreria;
create policy "voci_libreria: solo proprie righe"
  on public.voci_libreria for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- "consigli_cache": ogni utente vede e modifica solo la propria riga.
drop policy if exists "consigli_cache: solo propria riga" on public.consigli_cache;
create policy "consigli_cache: solo propria riga"
  on public.consigli_cache for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
