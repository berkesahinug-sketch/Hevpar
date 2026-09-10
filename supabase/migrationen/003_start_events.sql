-- =============================================================================
-- Hevpar - Migration 003: Die ersten Events
--
-- Nach 001 und 002 im SQL-Editor ausfuehren. Termine liegen relativ zum
-- Ausfuehrungstag in der Zukunft. Spaeter pflegst du Events direkt im
-- Table Editor (Tabelle "events") - Nutzer:innen koennen das bewusst nicht.
-- =============================================================================

insert into public.events (titel, untertitel, stadt, ort, datum, typ) values
  ('Şeva Govendê', 'Offener Tanzabend — Anfänger:innen ausdrücklich erwünscht',
   'Brüssel', 'Kurdisches Kulturzentrum, Saint-Josse', now() + interval '2 days', 'Tanz'),
  ('Şeva Dengbêjan', 'Ein Abend mit Dengbêj — Erzählgesang, Tee, keine Eile',
   'Stockholm', 'Folkets Hus, Rinkeby', now() + interval '5 days', 'Musik'),
  ('Kurdisches Filmfestival', 'Eröffnungsabend mit Regiegespräch',
   'Berlin', 'Moviemento, Kreuzberg', now() + interval '8 days', 'Kino'),
  ('Zazakî-Sprachcafé', 'Reden, Fehler machen, weiterreden. Alle Niveaus.',
   'Amsterdam', 'De Meevaart, Oost', now() + interval '12 days', 'Sprache'),
  ('Cejna Payîzê', 'Herbstfest des Kurdischen Gemeindezentrums, mit Küche und Musik',
   'London', 'Kurdish Community Centre, Haringey', now() + interval '16 days', 'Fest');
