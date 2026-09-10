-- =============================================================================
-- Hevpar – Grundmodell und Zugriffsregeln (Migration 001)
--
-- Diese Datei wird im Supabase SQL-Editor einmal komplett ausgeführt.
-- Sie legt alle Tabellen an UND die Regeln, wer was sehen darf (Row Level
-- Security, kurz RLS). Die Regeln gelten in der Datenbank selbst - eine App,
-- ein Skript oder ein Angreifer mit dem öffentlichen Schlüssel kann sie
-- nicht umgehen.
--
-- Die drei wichtigsten Regeln, serverseitig erzwungen:
--   1. Fotos sind erst nach einem beidseitigen Match sichtbar.
--   2. Herkunftsdaten (Art. 9 DSGVO) nur mit aktiver Einwilligung, getrennt
--      löschbar, und nur sichtbar, wenn die Person es erlaubt.
--   3. Event-Zusagen sieht niemand außer der Person selbst - nach außen
--      gibt es nur eine Zahl.
-- =============================================================================

-- Funktionen duerfen auf Tabellen verweisen, die weiter unten in dieser Datei
-- erst angelegt werden - geprueft wird beim ersten Aufruf, nicht beim Anlegen.
set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
--
-- "security definer" heißt: Die Funktion läuft mit Datenbankrechten, nicht
-- mit den Rechten der anfragenden Person. Das braucht es, damit Sichtbarkeits-
-- regeln Dinge prüfen können (z. B. "gibt es ein Match?"), ohne dass sich die
-- Regeln gegenseitig im Kreis aufrufen.
-- ---------------------------------------------------------------------------

create or replace function public.ist_match(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.matches m
    where m.profil_a = least(a, b) and m.profil_b = greatest(a, b)
  );
$$;

create or replace function public.ist_blockiert(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.blockierungen x
    where (x.von = a and x.blockiert = b) or (x.von = b and x.blockiert = a)
  );
$$;

create or replace function public.meine_stadt()
returns text
language sql stable security definer set search_path = ''
as $$
  select p.stadt from public.profile p where p.id = auth.uid();
$$;

create or replace function public.hat_einwilligung(p uuid, welche text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.einwilligungen e
    where e.profil_id = p and e.art = welche and e.widerrufen_am is null
  );
$$;

create or replace function public.hat_tagesantwort(p uuid, tag date)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.tagesantworten t
    where t.profil_id = p and t.datum = tag
  );
$$;

-- ---------------------------------------------------------------------------
-- Profile
-- ---------------------------------------------------------------------------

create table public.profile (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  -- Geburtsdatum statt Alter: Das Mindestalter 18 prüft die Datenbank selbst.
  geburtsdatum date not null
    check (geburtsdatum <= (current_date - interval '18 years')),
  stadt text not null,
  -- Sichtbar wird ein Profil erst nach der Community-Prüfung.
  verifiziert boolean not null default false,
  -- Einstellungen aus dem Profil-Bereich
  herkunft_zeigen boolean not null default true,
  unsichtbar_in_stadt boolean not null default false,
  erstellt_am timestamptz not null default now()
);

alter table public.profile enable row level security;

create policy "eigenes Profil lesen" on public.profile
  for select to authenticated
  using (id = auth.uid());

create policy "sichtbare Profile lesen" on public.profile
  for select to authenticated
  using (
    verifiziert
    and id <> auth.uid()
    and not public.ist_blockiert(id, auth.uid())
    and not (unsichtbar_in_stadt and stadt = public.meine_stadt())
  );

create policy "eigenes Profil anlegen" on public.profile
  for insert to authenticated
  with check (id = auth.uid());

create policy "eigenes Profil aendern" on public.profile
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Niemand setzt sich selbst auf "verifiziert": Aendert eine Person ihr
-- eigenes Profil, bleibt der alte Wert bestehen. Die Moderation (ueber das
-- Dashboard, ohne Nutzerkontext) kann ihn weiterhin setzen.
create or replace function public.verifiziert_schuetzen()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() = old.id then
    new.verifiziert := old.verifiziert;
  end if;
  return new;
end;
$$;

create trigger vor_profil_update
  before update on public.profile
  for each row execute function public.verifiziert_schuetzen();

-- ---------------------------------------------------------------------------
-- Einwilligungen (DSGVO Art. 7: nachweisbar, mit Zeitpunkt)
-- ---------------------------------------------------------------------------

create table public.einwilligungen (
  id bigint generated always as identity primary key,
  profil_id uuid not null references auth.users (id) on delete cascade,
  art text not null check (art in ('herkunftsdaten')),
  erteilt_am timestamptz not null default now(),
  widerrufen_am timestamptz
);

alter table public.einwilligungen enable row level security;

create policy "eigene Einwilligungen lesen" on public.einwilligungen
  for select to authenticated using (profil_id = auth.uid());

create policy "Einwilligung erteilen" on public.einwilligungen
  for insert to authenticated with check (profil_id = auth.uid());

create policy "Einwilligung widerrufen" on public.einwilligungen
  for update to authenticated
  using (profil_id = auth.uid()) with check (profil_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Herkunft (besondere Kategorien nach Art. 9 - eigene Tabelle, damit sie
-- einzeln loeschbar ist, ohne dass das Konto verloren geht)
-- ---------------------------------------------------------------------------

create table public.herkunft (
  profil_id uuid primary key references auth.users (id) on delete cascade,
  dialekte text[] not null default '{}',
  region text,
  werte text[] not null default '{}'
);

alter table public.herkunft enable row level security;

create policy "eigene Herkunft lesen" on public.herkunft
  for select to authenticated using (profil_id = auth.uid());

-- Andere sehen die Herkunft nur, wenn das Profil sichtbar ist UND die Person
-- "Herkunft im Profil zeigen" eingeschaltet hat.
create policy "Herkunft sichtbarer Profile lesen" on public.herkunft
  for select to authenticated
  using (
    exists (
      select 1 from public.profile p
      where p.id = herkunft.profil_id and p.herkunft_zeigen
    )
  );

-- Speichern geht nur mit aktiver Einwilligung - die App KANN diese Daten
-- ohne Zustimmung gar nicht ablegen.
create policy "Herkunft speichern nur mit Einwilligung" on public.herkunft
  for insert to authenticated
  with check (profil_id = auth.uid() and public.hat_einwilligung(auth.uid(), 'herkunftsdaten'));

create policy "Herkunft aendern nur mit Einwilligung" on public.herkunft
  for update to authenticated
  using (profil_id = auth.uid())
  with check (profil_id = auth.uid() and public.hat_einwilligung(auth.uid(), 'herkunftsdaten'));

create policy "Herkunft loeschen" on public.herkunft
  for delete to authenticated using (profil_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Prompt-Antworten
-- ---------------------------------------------------------------------------

create table public.antworten (
  id bigint generated always as identity primary key,
  profil_id uuid not null references auth.users (id) on delete cascade,
  frage text not null,
  antwort text not null check (char_length(antwort) between 1 and 600),
  erstellt_am timestamptz not null default now(),
  unique (profil_id, frage)
);

alter table public.antworten enable row level security;

create policy "Antworten sichtbarer Profile lesen" on public.antworten
  for select to authenticated
  using (
    profil_id = auth.uid()
    or exists (select 1 from public.profile p where p.id = antworten.profil_id)
  );
  -- Der exists-Teil nutzt die Profil-Regeln: Wen ich nicht sehen darf,
  -- dessen Antworten sehe ich auch nicht.

create policy "eigene Antworten verwalten" on public.antworten
  for all to authenticated
  using (profil_id = auth.uid()) with check (profil_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Silavs und Matches
-- ---------------------------------------------------------------------------

create table public.silavs (
  id bigint generated always as identity primary key,
  von uuid not null references auth.users (id) on delete cascade,
  an uuid not null references auth.users (id) on delete cascade,
  frage text not null,
  zitat text not null,
  text text not null check (char_length(text) between 1 and 600),
  erstellt_am timestamptz not null default now(),
  check (von <> an),
  unique (von, an)
);

alter table public.silavs enable row level security;

create policy "beteiligte Silavs lesen" on public.silavs
  for select to authenticated using (von = auth.uid() or an = auth.uid());

create policy "Silav senden" on public.silavs
  for insert to authenticated
  with check (
    von = auth.uid()
    and not public.ist_blockiert(von, an)
    and exists (select 1 from public.profile p where p.id = an)
  );

create table public.matches (
  id bigint generated always as identity primary key,
  profil_a uuid not null references auth.users (id) on delete cascade,
  profil_b uuid not null references auth.users (id) on delete cascade,
  erstellt_am timestamptz not null default now(),
  check (profil_a < profil_b),
  unique (profil_a, profil_b)
);

alter table public.matches enable row level security;

create policy "eigene Matches lesen" on public.matches
  for select to authenticated using (profil_a = auth.uid() or profil_b = auth.uid());

-- Matches entstehen nur durch die Datenbank selbst (Trigger unten),
-- deshalb gibt es absichtlich KEINE Insert-Regel fuer Nutzer:innen.

create or replace function public.silav_verarbeiten()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- Gibt es die Gegenrichtung, entsteht ein Match.
  if exists (select 1 from public.silavs s where s.von = new.an and s.an = new.von) then
    insert into public.matches (profil_a, profil_b)
    values (least(new.von, new.an), greatest(new.von, new.an))
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger nach_silav
  after insert on public.silavs
  for each row execute function public.silav_verarbeiten();

-- ---------------------------------------------------------------------------
-- Nachrichten (nur innerhalb eines Matches)
-- ---------------------------------------------------------------------------

create table public.nachrichten (
  id bigint generated always as identity primary key,
  match_id bigint not null references public.matches (id) on delete cascade,
  von uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  erstellt_am timestamptz not null default now(),
  gelesen_am timestamptz
);

create index nachrichten_match on public.nachrichten (match_id, erstellt_am);

alter table public.nachrichten enable row level security;

create policy "Nachrichten des eigenen Matches lesen" on public.nachrichten
  for select to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = nachrichten.match_id
        and (m.profil_a = auth.uid() or m.profil_b = auth.uid())
    )
  );

create policy "Nachricht in eigenes Match schreiben" on public.nachrichten
  for insert to authenticated
  with check (
    von = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = nachrichten.match_id
        and (m.profil_a = auth.uid() or m.profil_b = auth.uid())
        and not public.ist_blockiert(m.profil_a, m.profil_b)
    )
  );

create policy "gelesen markieren" on public.nachrichten
  for update to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = nachrichten.match_id
        and (m.profil_a = auth.uid() or m.profil_b = auth.uid())
    )
  );

-- Nur die Spalte gelesen_am ist aenderbar - den Text einer gesendeten
-- Nachricht kann niemand nachtraeglich umschreiben.
revoke update on public.nachrichten from authenticated;
grant update (gelesen_am) on public.nachrichten to authenticated;

-- Chat live uebertragen (Supabase Realtime)
alter publication supabase_realtime add table public.nachrichten;

-- ---------------------------------------------------------------------------
-- Fotos: DIE Kernregel. Der Bucket ist privat; die Datei liegt unter
-- "<profil_id>/dateiname". Sehen darf sie nur, wer ein Match mit der
-- Eigentuemerin hat - oder die Eigentuemerin selbst.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

create policy "eigene Fotos verwalten" on storage.objects
  for all to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Der Ordnername wird als Text verglichen, nie umgewandelt: So kann ein
-- Dateipfad, der keine Profil-ID ist, keinen Fehler ausloesen.
create or replace function public.foto_sichtbar(ordner text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.matches m
    where (m.profil_a = auth.uid() and m.profil_b::text = ordner)
       or (m.profil_b = auth.uid() and m.profil_a::text = ordner)
  );
$$;

create policy "Fotos erst nach dem Match" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos'
    and public.foto_sichtbar((storage.foldername(name))[1])
  );

-- ---------------------------------------------------------------------------
-- Events (kuratiert) und stille Zusagen
-- ---------------------------------------------------------------------------

create table public.events (
  id bigint generated always as identity primary key,
  titel text not null,
  untertitel text,
  stadt text not null,
  ort text not null,
  datum timestamptz not null,
  typ text not null check (typ in ('Fest', 'Musik', 'Tanz', 'Kino', 'Sprache')),
  erstellt_am timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Events lesen" on public.events
  for select to authenticated using (true);
-- Absichtlich keine Schreib-Regeln: Events werden kuratiert
-- (ueber das Supabase-Dashboard), nicht von Nutzer:innen eingestellt.

create table public.zusagen (
  event_id bigint not null references public.events (id) on delete cascade,
  profil_id uuid not null references auth.users (id) on delete cascade,
  erstellt_am timestamptz not null default now(),
  primary key (event_id, profil_id)
);

alter table public.zusagen enable row level security;

-- Nur die eigene Zusage ist je sichtbar. Wer sonst kommt, sieht niemand.
create policy "eigene Zusagen verwalten" on public.zusagen
  for all to authenticated
  using (profil_id = auth.uid()) with check (profil_id = auth.uid());

-- Nach aussen gibt es nur die Zahl:
create or replace function public.zusagen_zahl(e bigint)
returns bigint
language sql stable security definer set search_path = ''
as $$
  select count(*) from public.zusagen z where z.event_id = e;
$$;

-- ---------------------------------------------------------------------------
-- Frage des Tages: Erst die eigene Antwort schaltet die anderen frei.
-- Diese Spielregel steht hier, nicht in der App - sie ist nicht umgehbar.
-- ---------------------------------------------------------------------------

create table public.tagesantworten (
  profil_id uuid not null references auth.users (id) on delete cascade,
  datum date not null default current_date,
  text text not null check (char_length(text) between 1 and 400),
  erstellt_am timestamptz not null default now(),
  primary key (profil_id, datum)
);

alter table public.tagesantworten enable row level security;

create policy "eigene Tagesantwort verwalten" on public.tagesantworten
  for all to authenticated
  using (profil_id = auth.uid())
  with check (profil_id = auth.uid() and datum = current_date);

create policy "Tagesantworten nach eigener Antwort lesen" on public.tagesantworten
  for select to authenticated
  using (
    public.hat_tagesantwort(auth.uid(), datum)
    and exists (select 1 from public.profile p where p.id = tagesantworten.profil_id)
  );

-- ---------------------------------------------------------------------------
-- Blockieren und Melden (Apple Guideline 1.2)
-- ---------------------------------------------------------------------------

create table public.blockierungen (
  von uuid not null references auth.users (id) on delete cascade,
  blockiert uuid not null references auth.users (id) on delete cascade,
  erstellt_am timestamptz not null default now(),
  primary key (von, blockiert),
  check (von <> blockiert)
);

alter table public.blockierungen enable row level security;

create policy "eigene Blockierungen verwalten" on public.blockierungen
  for all to authenticated
  using (von = auth.uid()) with check (von = auth.uid());

create table public.meldungen (
  id bigint generated always as identity primary key,
  von uuid not null references auth.users (id) on delete cascade,
  gemeldet uuid not null references auth.users (id) on delete cascade,
  grund text not null check (char_length(grund) between 1 and 2000),
  status text not null default 'offen' check (status in ('offen', 'in_pruefung', 'erledigt')),
  erstellt_am timestamptz not null default now()
);

alter table public.meldungen enable row level security;

create policy "Meldung abgeben" on public.meldungen
  for insert to authenticated with check (von = auth.uid());
-- Absichtlich keine Lese-Regel: Meldungen liest nur die Moderation
-- (ueber das Supabase-Dashboard).

-- ---------------------------------------------------------------------------
-- Konto loeschen - in der App, ohne E-Mail an den Support (App-Store-Pflicht).
-- Alle Tabellen haengen per "on delete cascade" am Konto: Ein Aufruf
-- entfernt alles.
-- ---------------------------------------------------------------------------

create or replace function public.konto_loeschen()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.konto_loeschen() from anon;
