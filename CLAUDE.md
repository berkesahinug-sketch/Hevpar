# Hevpar

Dating- und Kennenlern-App für die kurdische Diaspora in Europa. "Hevpar" heißt
Partner/Gefährte auf Kurdisch. Gründer: Berke, Basis Brüssel. Nicht-technisch,
lernt beim Bauen mit — Erklärungen bitte in Klartext, keine ungefragten Abkürzungen.
Kommunikationssprache: Deutsch.

## Warum es diese App gibt

Der Unterschied zu bestehenden Apps ist kulturelle Tiefe, nicht Ethnie als Filter.
Dialekt (Kurmancî, Soranî, Zazakî, Kelhurî, Hewramî), Herkunftsregion, Diasporastadt
und Werte sind erste Klasse im Datenmodell, nicht Freitext im Profil.

Zwei Sätze, die jede Produktentscheidung prüfen:
- Wenn ein Feature auch in einer generischen Dating-App stehen könnte, ist es hier
  wahrscheinlich falsch.
- Ästhetik signalisiert Ernsthaftigkeit. Nichts Folkloristisches, keine Flaggen,
  keine Klischeebilder.

## Design (festgelegt, nicht zur Diskussion ohne Rücksprache)

Farben:
- Papier/Hintergrund `#F6F0E4`, Karten `#FFFBF3`
- Tinte `#191B17`, gedämpfter Text `#6C6A5F`, Linien `#E2D9C6`
- Granat `#7C2434` (Primäraktion), Terrakotta `#A9483C` (Akzent)
- Gold `#C4972F` (Hervorhebung), Waldgrün `#1E3A31` (Zustände, Match-Screen)
- Flaggenfarben sind bewusst ausgeschlossen.

Schrift: Fraunces für Display und Prompt-Antworten, Inter für UI-Text.

Einziges traditionelles Element: ein Kilim-Zickzack. Er trägt Struktur, keine Deko —
Fortschrittsbalken im Onboarding, Trenner in Profilkarten, Marker in der Navigation.
Sonst nichts Ornamentales.

Avatare vor dem Match sind generierte Kilim-Muster, keine unscharfen Fotos.

## Kernmechanik

- **Kultur-Chips** statt generischer Filter.
- **Silav**: Man liked kein Profil, sondern antwortet auf *eine konkrete* Prompt-Antwort.
  Die zitierte Stelle bleibt oben im Chat stehen. Bewusst reibungsvoll: weniger
  Kontakte, höhere Qualität.
- **Fotos erst nach dem Match.** Das ist Vertrauensinfrastruktur für eine Community,
  in der man sich kennt — kein Nice-to-have.
- Prompts sind kulturell verankert ("Devoka min", Newroz, Familie), nicht übersetzte
  Standardfragen.

## Stack (entschieden)

- **Expo / React Native** — kein Mac nötig, Cloud-Builds über EAS
- **Supabase** — Auth, Postgres, Realtime-Chat, Storage; **Region Frankfurt (EU)**
- Web-Prototyp liegt als `hevpar-prototype.jsx` bei. Reine Design-Referenz, kein
  Produktionscode, keine echten Daten. Bitte als Vorlage lesen, nicht portieren.

## Harte Randbedingungen

1. **DSGVO Art. 9.** Dialekt, Herkunftsregion und Glaubensangaben sind besondere
   Kategorien personenbezogener Daten. Getrennte ausdrückliche Einwilligung beim
   Onboarding, einzeln löschbar ohne Kontoverlust. Keine Übertragung an Dritte
   ohne Prüfung. Anwaltliche Prüfung steht noch aus.
2. **"Fotos nach Match" muss serverseitig erzwungen werden**, per Row Level Security.
   Eine Regel nur in der Oberfläche ist ein Datenleck.
3. **Apple Guideline 1.2** — Melden, Blockieren, Filtern, echte Moderationsantwort,
   öffentliche Kontaktadresse. Ohne diese Dinge keine Freigabe.
4. **Apple Guideline 4.3** — Dating ist ausdrücklich als gesättigte Kategorie
   genannt. Der Alleinstellungspunkt muss in den Review-Notes schriftlich erklärt
   werden.
5. **DSA-Händlerstatus** in App Store Connect ist Pflicht, auch für kostenlose Apps.
6. Mindestalter 18. Konto muss in der App löschbar sein.

## Wo wir stehen

Erledigt: Designrichtung, interaktiver Web-Prototyp, Achtschritteplan bis TestFlight.

Als Nächstes:
1. Apple-Konto und Rechtsform klären (längste Vorlaufzeit, blockiert alles)
2. Expo-Projekt aufsetzen, Design übertragen
3. Datenmodell und Zugriffsregeln in Supabase
4. Login, Profile, Fotos
5. Silav, Match, Chat, Push
6. Sicherheits- und Moderationsfunktionen
7. Erster Build, interner TestFlight-Test
8. Externe Tester über Diaspora-Vereine und Studierendengruppen

Offene Entscheidungen: Launch-Stadt (Berlin, London oder Stockholm), Rechtsform
(Einzelperson vs. BV), Zeitpunkt der Rechtsberatung.

## Beschlossene Ausbaurichtung (Stand September 2026)

Von Berke entschieden, in dieser Reihenfolge gebaut:

1. **Cejn (Events).** Feste, Konzerte, Sprachcafés, Vereinsabende — sichtbar
   nach Stadt, mit stiller Zusage (nur Zähler, nie Namen: Teilnahme kann
   politisch gelesen werden, Art.-9-Nähe) und Einladen aus den eigenen
   Matches heraus. Events sind kuratiert; offene Einreichung erst mit
   Prüfprozess (Moderationsfläche).
2. **Dialekt-Schlüsselwörter.** Die Konzeptwörter der App (Silav, Cejn,
   Frage des Tages, Zusage) erscheinen im zuerst gewählten Dialekt.
   Wörterbuch: `src/data/sprache.ts`. OFFEN: Formen von
   Muttersprachler:innen prüfen lassen, besonders Zazakî, Kelhurî, Hewramî.
3. **Pirsa rojê (Frage des Tages).** Täglich rotierende, kulturell
   verankerte Frage. Einsatz ist die eigene Antwort: erst antworten, dann
   die anderen sehen — und auf sie Silav schicken können.

Gemerkte Ideen, noch nicht beschlossen: Stimme vor Foto (Sprachnotiz auf
Prompts, Dengbêj-Gedanke), Schrift-Brücke im Chat (arabisch ↔ lateinisch),
Verstehen/Sprechen als zwei Stufen pro Dialekt, Einladung statt offener
Anmeldung zum Launch, Leben in mehreren Städten.

Bewusst abgelehnt: Endlos-Feed und Dark Patterns. Wiederkommen entsteht
durch Rhythmus (verzögerte Antworten, Tagesfrage, Events), nicht durch
Festhalten.

## Arbeitsweise

- Ein Schritt nach dem anderen, jeweils mit kurzer Erklärung, warum.
- Terminal-Befehle vollständig hinschreiben, nicht andeuten.
- Bei Kosten oder rechtlichen Fragen früh warnen, nicht erst beim Fehler.
- Monetarisierung ist bewusst vertagt, bis Wachstum und Matchqualität stehen.
