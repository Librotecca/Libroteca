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

-- ============================================================
-- FAMIGLIA: gruppi condivisi con invito via codice/link.
-- Ogni utente può far parte di una sola famiglia alla volta.
-- ============================================================

-- "profili": versione pubblica minimale degli utenti (email, nome), per poter
-- mostrare chi fa parte della famiglia senza esporre la tabella auth.users.
create table if not exists public.profili (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nome_visualizzato text,
  created_at timestamptz not null default now()
);

-- "famiglie": un gruppo condiviso.
create table if not exists public.famiglie (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codice_invito text not null unique,
  creato_da uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- "membri_famiglia": a quale famiglia appartiene ogni utente (una sola riga per utente).
create table if not exists public.membri_famiglia (
  user_id uuid primary key references auth.users(id) on delete cascade,
  famiglia_id uuid not null references public.famiglie(id) on delete cascade,
  ruolo text not null default 'membro' check (ruolo in ('creatore', 'membro')),
  created_at timestamptz not null default now()
);

create index if not exists membri_famiglia_famiglia_id_idx on public.membri_famiglia(famiglia_id);

-- Funzione di supporto (security definer per evitare ricorsione nelle policy RLS):
-- restituisce true se l'utente corrente e "altro_user_id" sono nella stessa famiglia.
create or replace function public.stessa_famiglia(altro_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membri_famiglia m1
    join public.membri_famiglia m2 on m1.famiglia_id = m2.famiglia_id
    where m1.user_id = auth.uid() and m2.user_id = altro_user_id
  );
$$;

-- Trigger: crea automaticamente un profilo pubblico alla registrazione di un utente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profili (user_id, email, nome_visualizzato)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Popola i profili per gli utenti già registrati prima di questa migrazione.
insert into public.profili (user_id, email, nome_visualizzato)
select id, email, split_part(email, '@', 1) from auth.users
on conflict (user_id) do nothing;

-- Row Level Security
alter table public.profili enable row level security;
alter table public.famiglie enable row level security;
alter table public.membri_famiglia enable row level security;

-- "profili": visibile a se stessi e ai membri della propria famiglia.
drop policy if exists "profili: proprio o famiglia" on public.profili;
create policy "profili: proprio o famiglia"
  on public.profili for select
  to authenticated
  using (user_id = auth.uid() or public.stessa_famiglia(user_id));

drop policy if exists "profili: aggiorna proprio" on public.profili;
create policy "profili: aggiorna proprio"
  on public.profili for update
  to authenticated
  using (user_id = auth.uid());

-- "famiglie": visibile solo a chi ne fa parte.
drop policy if exists "famiglie: solo membri" on public.famiglie;
create policy "famiglie: solo membri"
  on public.famiglie for select
  to authenticated
  using (exists (
    select 1 from public.membri_famiglia m
    where m.famiglia_id = famiglie.id and m.user_id = auth.uid()
  ));

drop policy if exists "famiglie: crea" on public.famiglie;
create policy "famiglie: crea"
  on public.famiglie for insert
  to authenticated
  with check (creato_da = auth.uid());

-- "membri_famiglia": vede la propria riga e quelle di chi condivide la sua famiglia.
drop policy if exists "membri: vede propria famiglia" on public.membri_famiglia;
create policy "membri: vede propria famiglia"
  on public.membri_famiglia for select
  to authenticated
  using (user_id = auth.uid() or public.stessa_famiglia(user_id));

drop policy if exists "membri: entra da solo" on public.membri_famiglia;
create policy "membri: entra da solo"
  on public.membri_famiglia for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "membri: esce da solo" on public.membri_famiglia;
create policy "membri: esce da solo"
  on public.membri_famiglia for delete
  to authenticated
  using (user_id = auth.uid());

-- Estende "voci_libreria": in aggiunta al pieno controllo sulle proprie righe,
-- permette la sola lettura delle righe di chi condivide la stessa famiglia.
drop policy if exists "voci_libreria: lettura famiglia" on public.voci_libreria;
create policy "voci_libreria: lettura famiglia"
  on public.voci_libreria for select
  to authenticated
  using (public.stessa_famiglia(user_id));

-- ============================================================
-- "consigli_feedback": 👍/👎 dell'utente sui singoli consigli AI ricevuti.
-- Usato per non riproporre più i titoli scartati nelle generazioni future.
-- ============================================================
create table if not exists public.consigli_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titolo text not null,
  autore text,
  voto text not null check (voto in ('mi_piace', 'non_mi_piace')),
  created_at timestamptz not null default now(),
  unique (user_id, titolo)
);

alter table public.consigli_feedback enable row level security;

drop policy if exists "consigli_feedback: solo proprie righe" on public.consigli_feedback;
create policy "consigli_feedback: solo proprie righe"
  on public.consigli_feedback for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
