-- =============================================================================
-- Hevpar - Migration 002: Geburtsdatum privat, Alter oeffentlich,
-- Tabellen untereinander verknuepft
--
-- Nach Migration 001 im Supabase SQL-Editor einmal komplett ausfuehren.
--
-- Zwei Dinge passieren hier:
-- 1. Das Geburtsdatum wird fuer ALLE unlesbar (auch fuer einen selbst).
--    Es dient nur der 18+-Pruefung. Sichtbar ist nur noch "jahre" - das
--    Alter, das die Datenbank selbst aus dem Geburtsdatum errechnet.
-- 2. Die Tabellen verweisen jetzt aufeinander statt nur auf die Konten.
--    Das braucht die App, um z. B. zu einem Silav direkt den Profilnamen
--    mitzuladen.
-- =============================================================================

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- 1. Alter statt Geburtsdatum
-- ---------------------------------------------------------------------------

alter table public.profile add column if not exists jahre int;

-- Die Datenbank errechnet das Alter selbst - der Client kann hier nichts
-- Falsches (oder Geschmeicheltes) eintragen.
create or replace function public.jahre_setzen()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.jahre := date_part('year', age(new.geburtsdatum))::int;
  return new;
end;
$$;

create trigger vor_profil_jahre
  before insert or update of geburtsdatum on public.profile
  for each row execute function public.jahre_setzen();

-- Bestehende Zeilen einmalig nachrechnen
update public.profile set jahre = date_part('year', age(geburtsdatum))::int
where jahre is null;

-- Ab jetzt: Geburtsdatum ist fuer App-Nutzer:innen keine lesbare Spalte mehr.
revoke select on public.profile from authenticated;
grant select (id, name, jahre, stadt, verifiziert, herkunft_zeigen, unsichtbar_in_stadt, erstellt_am)
  on public.profile to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Verknuepfungen auf public.profile umstellen
--    (Loeschkette bleibt: Konto weg -> Profil weg -> alles Weitere weg)
-- ---------------------------------------------------------------------------

alter table public.herkunft
  drop constraint herkunft_profil_id_fkey,
  add constraint herkunft_profil_id_fkey
    foreign key (profil_id) references public.profile (id) on delete cascade;

alter table public.antworten
  drop constraint antworten_profil_id_fkey,
  add constraint antworten_profil_id_fkey
    foreign key (profil_id) references public.profile (id) on delete cascade;

alter table public.silavs
  drop constraint silavs_von_fkey,
  add constraint silavs_von_fkey
    foreign key (von) references public.profile (id) on delete cascade,
  drop constraint silavs_an_fkey,
  add constraint silavs_an_fkey
    foreign key (an) references public.profile (id) on delete cascade;

alter table public.matches
  drop constraint matches_profil_a_fkey,
  add constraint matches_profil_a_fkey
    foreign key (profil_a) references public.profile (id) on delete cascade,
  drop constraint matches_profil_b_fkey,
  add constraint matches_profil_b_fkey
    foreign key (profil_b) references public.profile (id) on delete cascade;

alter table public.nachrichten
  drop constraint nachrichten_von_fkey,
  add constraint nachrichten_von_fkey
    foreign key (von) references public.profile (id) on delete cascade;

alter table public.zusagen
  drop constraint zusagen_profil_id_fkey,
  add constraint zusagen_profil_id_fkey
    foreign key (profil_id) references public.profile (id) on delete cascade;

alter table public.tagesantworten
  drop constraint tagesantworten_profil_id_fkey,
  add constraint tagesantworten_profil_id_fkey
    foreign key (profil_id) references public.profile (id) on delete cascade;

alter table public.blockierungen
  drop constraint blockierungen_von_fkey,
  add constraint blockierungen_von_fkey
    foreign key (von) references public.profile (id) on delete cascade,
  drop constraint blockierungen_blockiert_fkey,
  add constraint blockierungen_blockiert_fkey
    foreign key (blockiert) references public.profile (id) on delete cascade;

alter table public.meldungen
  drop constraint meldungen_von_fkey,
  add constraint meldungen_von_fkey
    foreign key (von) references public.profile (id) on delete cascade,
  drop constraint meldungen_gemeldet_fkey,
  add constraint meldungen_gemeldet_fkey
    foreign key (gemeldet) references public.profile (id) on delete cascade;

alter table public.einwilligungen
  drop constraint einwilligungen_profil_id_fkey,
  add constraint einwilligungen_profil_id_fkey
    foreign key (profil_id) references public.profile (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 3. Live-Uebertragung auch fuer Silavs und Matches: So erfaehrt die App
--    sofort, wenn ein Silav ankommt oder ein Match entsteht.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.silavs;
alter publication supabase_realtime add table public.matches;
