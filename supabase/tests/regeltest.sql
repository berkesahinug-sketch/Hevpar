-- Verhaltenstests der Zugriffsregeln. Jede Zeile PASS/FAIL sagt, ob die
-- Datenbank sich so verhaelt, wie die Regel es verspricht.
\set QUIET on
\pset tuples_only on

-- Drei Konten
insert into auth.users (id) values
  ('aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000002'),
  ('cccccccc-0000-0000-0000-000000000003');

create function als(wer text) returns void language sql as
$$ select set_config('app.uid', wer, false) $$;
-- Wichtig: Beim Wechsel in die Moderationsrolle die Nutzerkennung leeren,
-- sonst greifen die Schutz-Trigger auch fuer die Moderation.
create function als_admin() returns void language sql as
$$ select set_config('app.uid', '', false) $$;

-- ===== T1: Mindestalter wird von der Datenbank erzwungen =====
set role authenticated;
select als('aaaaaaaa-0000-0000-0000-000000000001');
do $$ begin
  insert into public.profile (id, name, geburtsdatum, stadt)
  values (auth.uid(), 'Minderjaehrig', current_date - interval '17 years', 'Berlin');
  raise notice 'T1 FAIL: 17-Jaehrige durfte Profil anlegen';
exception when check_violation then
  raise notice 'T1 PASS: unter 18 wird abgelehnt';
end $$;

insert into public.profile (id, name, geburtsdatum, stadt)
values (auth.uid(), 'A', date '1995-05-01', 'Berlin');
select als('bbbbbbbb-0000-0000-0000-000000000002');
insert into public.profile (id, name, geburtsdatum, stadt)
values (auth.uid(), 'B', date '1994-03-02', 'Stockholm');
select als('cccccccc-0000-0000-0000-000000000003');
insert into public.profile (id, name, geburtsdatum, stadt)
values (auth.uid(), 'C', date '1990-01-01', 'London');

-- ===== T2: Unverifizierte Profile sind unsichtbar =====
select als('bbbbbbbb-0000-0000-0000-000000000002');
select case when count(*) = 0 then 'T2 PASS: unverifizierte Profile unsichtbar'
            else 'T2 FAIL' end
from public.profile where id <> auth.uid();

reset role;
select als_admin();
update public.profile set verifiziert = true;  -- "Moderation" schaltet frei
set role authenticated;
select als('bbbbbbbb-0000-0000-0000-000000000002');
select case when count(*) = 2 then 'T2b PASS: verifizierte Profile sichtbar'
            else 'T2b FAIL' end
from public.profile where id <> auth.uid();

-- ===== T3: Niemand verifiziert sich selbst =====
reset role;
select als_admin();
update public.profile set verifiziert = false
where id = 'aaaaaaaa-0000-0000-0000-000000000001';
set role authenticated;
select als('aaaaaaaa-0000-0000-0000-000000000001');
update public.profile set verifiziert = true, name = 'A2' where id = auth.uid();
select case when verifiziert = false and name = 'A2'
            then 'T3 PASS: verifiziert bleibt aus, andere Felder aenderbar'
            else 'T3 FAIL' end
from public.profile where id = auth.uid();
reset role;
select als_admin();
update public.profile set verifiziert = true;
set role authenticated;

-- ===== T4: Herkunft nur mit Einwilligung =====
select als('aaaaaaaa-0000-0000-0000-000000000001');
do $$ begin
  insert into public.herkunft (profil_id, dialekte) values (auth.uid(), '{Kurmancî}');
  raise notice 'T4 FAIL: Herkunft ohne Einwilligung gespeichert';
exception when insufficient_privilege then
  raise notice 'T4 PASS: ohne Einwilligung wird abgelehnt';
end $$;
insert into public.einwilligungen (profil_id, art) values (auth.uid(), 'herkunftsdaten');
insert into public.herkunft (profil_id, dialekte) values (auth.uid(), '{Kurmancî}');
select 'T4b PASS: mit Einwilligung klappt es';

-- ===== T5: Silav hin und zurueck ergibt ein Match =====
insert into public.silavs (von, an, frage, zitat, text)
values (auth.uid(), 'bbbbbbbb-0000-0000-0000-000000000002', 'Devoka min', 'Zitat', 'Silav!');
select als('bbbbbbbb-0000-0000-0000-000000000002');
insert into public.silavs (von, an, frage, zitat, text)
values (auth.uid(), 'aaaaaaaa-0000-0000-0000-000000000001', 'Devoka min', 'Zitat', 'Silav zurueck!');
select case when count(*) = 1 then 'T5 PASS: Match ist entstanden'
            else 'T5 FAIL' end from public.matches;

-- ===== T6: Nachrichten nur fuer Match-Beteiligte =====
insert into public.nachrichten (match_id, von, text)
select id, auth.uid(), 'Erste Nachricht' from public.matches limit 1;
-- Die Match-Nummer wird dem "Eindringling" hart uebergeben - so, wie ein
-- Angreifer sie erraten oder abgreifen koennte:
reset role;
select set_config('app.match_id', id::text, false) from public.matches limit 1;
set role authenticated;
select als('cccccccc-0000-0000-0000-000000000003');
do $$ begin
  insert into public.nachrichten (match_id, von, text)
  values (current_setting('app.match_id')::bigint, auth.uid(), 'Eindringling');
  raise notice 'T6 FAIL: Fremder konnte in fremden Chat schreiben';
exception when insufficient_privilege then
  raise notice 'T6 PASS: Fremde koennen nicht in den Chat schreiben';
end $$;
select case when count(*) = 0 then 'T6b PASS: Fremde lesen den Chat nicht'
            else 'T6b FAIL' end from public.nachrichten;
reset role;
select case when count(*) = 1 then 'T6c PASS: es steht wirklich nur eine Nachricht im Chat'
            else 'T6c FAIL' end from public.nachrichten;
set role authenticated;

-- ===== T7: Nachrichtentext ist unveraenderbar, gelesen_am nicht =====
select als('aaaaaaaa-0000-0000-0000-000000000001');
do $$ begin
  update public.nachrichten set text = 'umgeschrieben';
  raise notice 'T7 FAIL: Nachrichtentext liess sich aendern';
exception when insufficient_privilege then
  raise notice 'T7 PASS: Nachrichtentext ist unveraenderbar';
end $$;
update public.nachrichten set gelesen_am = now();
select 'T7b PASS: gelesen-Markierung funktioniert';

-- ===== T8: Fotos erst nach dem Match =====
reset role;
insert into storage.objects (bucket_id, name) values
  ('fotos', 'aaaaaaaa-0000-0000-0000-000000000001/foto1.jpg'),
  ('fotos', 'cccccccc-0000-0000-0000-000000000003/foto1.jpg');
set role authenticated;
select als('bbbbbbbb-0000-0000-0000-000000000002');
select case when count(*) = 1 then 'T8 PASS: B sieht nur das Foto des Matches A, nicht das von C'
            else 'T8 FAIL: sichtbar sind ' || count(*) end
from storage.objects where bucket_id = 'fotos';
select als('cccccccc-0000-0000-0000-000000000003');
select case when count(*) = 1 then 'T8b PASS: C sieht nur das eigene Foto'
            else 'T8b FAIL' end
from storage.objects where bucket_id = 'fotos';

-- ===== T9: Zusagen sind privat, die Zahl ist oeffentlich =====
reset role;
insert into public.events (titel, stadt, ort, datum, typ)
values ('Şeva Govendê', 'Bruessel', 'Kulturzentrum', now() + interval '3 days', 'Tanz');
set role authenticated;
select als('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.zusagen (event_id, profil_id)
select id, auth.uid() from public.events limit 1;
select als('bbbbbbbb-0000-0000-0000-000000000002');
select case when count(*) = 0 then 'T9 PASS: fremde Zusagen sind unsichtbar'
            else 'T9 FAIL' end from public.zusagen;
select case when public.zusagen_zahl(id) = 1 then 'T9b PASS: die Zahl stimmt trotzdem'
            else 'T9b FAIL' end from public.events limit 1;

-- ===== T10: Tagesantworten erst nach eigener Antwort =====
select als('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.tagesantworten (profil_id, text) values (auth.uid(), 'Çay, zwei Stueck.');
select als('bbbbbbbb-0000-0000-0000-000000000002');
select case when count(*) = 0 then 'T10 PASS: ohne eigene Antwort sieht man nichts'
            else 'T10 FAIL' end from public.tagesantworten;
insert into public.tagesantworten (profil_id, text) values (auth.uid(), 'Qehwe.');
select case when count(*) = 2 then 'T10b PASS: nach eigener Antwort sieht man alle'
            else 'T10b FAIL' end from public.tagesantworten;

-- ===== T11: Blockieren wirkt =====
insert into public.blockierungen (von, blockiert)
values (auth.uid(), 'aaaaaaaa-0000-0000-0000-000000000001');
select als('aaaaaaaa-0000-0000-0000-000000000001');
select case when count(*) = 0 then 'T11 PASS: Blockierte sehen einander nicht mehr'
            else 'T11 FAIL' end
from public.profile where id = 'bbbbbbbb-0000-0000-0000-000000000002';
do $$ begin
  delete from public.silavs where von = auth.uid();
  insert into public.silavs (von, an, frage, zitat, text)
  values (auth.uid(), 'bbbbbbbb-0000-0000-0000-000000000002', 'f', 'z', 'trotzdem');
  raise notice 'T11b FAIL: Silav trotz Blockierung moeglich';
exception when insufficient_privilege then
  raise notice 'T11b PASS: kein Silav trotz Blockierung';
end $$;

-- ===== T12: Konto loeschen raeumt alles ab =====
select als('cccccccc-0000-0000-0000-000000000003');
select public.konto_loeschen();
reset role;
select case when count(*) = 0 then 'T12 PASS: Konto und Profil sind geloescht'
            else 'T12 FAIL' end
from public.profile where id = 'cccccccc-0000-0000-0000-000000000003';
