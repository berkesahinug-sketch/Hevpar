# Hevpar

Dating- und Kennenlern-App für die kurdische Diaspora in Europa.

Dieses Repository enthält die Expo-App. Die Produktentscheidungen, das
Designsystem und die rechtlichen Randbedingungen stehen in [CLAUDE.md](CLAUDE.md) —
diese Datei hier erklärt nur, wie man die App startet und wo was liegt.

## App starten

Einmalig, nach dem Klonen:

```bash
npm install
```

Danach jedes Mal:

```bash
npx expo start
```

Im Terminal erscheint ein QR-Code. Den mit der Kamera scannen, dann öffnet sich
die App in **Expo Go** auf dem Handy (App Store / Play Store, kostenlos). Ein Mac
ist dafür nicht nötig.

Alternativ im Browser ansehen — praktisch zum schnellen Draufschauen, aber
Systemdialoge wie „Konto löschen?" funktionieren dort nicht:

```bash
npx expo start --web
```

## Prüfen, ob noch alles zusammenpasst

```bash
npx tsc --noEmit
```

Meldet Fehler, wenn irgendwo etwas nicht mehr zusammenpasst — zum Beispiel ein
Tippfehler in einem Feldnamen. Gibt es keine Ausgabe, ist alles in Ordnung.

## Wo liegt was

```
src/
  theme/tokens.ts      Farben, Schriften, Abstände. Die einzige Stelle für Farbwerte.
  data/kultur.ts       Dialekte, Regionen, Städte, Werte, Prompts.
  data/demo-profile.ts Beispielprofile. Werden durch echte Daten ersetzt.
  state/app-state.tsx  Der Zustand der App: Einwilligungen, Profil, Unterhaltungen.
  components/          Wiederverwendbare Bausteine (Kilim, Avatar, Chips, Karten).
  app/                 Die Bildschirme. Der Dateiname ist die Adresse in der App.
    index.tsx            Willkommen
    onboarding.tsx       Einwilligung und die drei Auswahlschritte
    (tabs)/entdecken.tsx Profile durchsehen und Silav senden
    (tabs)/nachrichten.tsx
    (tabs)/profil.tsx    Eigenes Profil, Sichtbarkeit, Datenschutz
    chat/[id].tsx        Eine Unterhaltung
```

Text ändern? Der steht direkt im jeweiligen Bildschirm.
Neuer Dialekt oder Wert? `src/data/kultur.ts`.
Farbe anpassen? `src/theme/tokens.ts` — nirgends sonst.

## Was schon umgesetzt ist

- Das Designsystem: Papierfarben, Fraunces und Inter, Granat und Waldgrün.
- Das Kilim-Zickzack an genau drei Stellen: Fortschritt im Onboarding, Trenner
  in den Karten, Marker in der Navigation. Sonst nirgends.
- Gewebte Avatare statt unscharfer Fotos, aus der Profil-ID errechnet.
- Onboarding mit **getrennter Einwilligung** für Dialekt und Herkunft. Wer
  ablehnt, kann die App trotzdem nutzen.
- Silav auf eine einzelne Prompt-Antwort, Match-Screen, Chat mit dauerhaft
  sichtbarem Zitat.
- Melden und Blockieren aus jeder Unterhaltung, Kontaktadresse im Profil.
- Löschen der Herkunftsangaben ohne Kontoverlust.

## Was noch fehlt

Alles, was einen Server braucht. Die App läuft im Moment mit Beispieldaten im
Arbeitsspeicher — beim Schließen ist alles weg. Als Nächstes:

1. Supabase-Projekt in der Region Frankfurt anlegen
2. Datenmodell und Zugriffsregeln — **„Fotos erst nach dem Match" muss dort per
   Row Level Security erzwungen werden.** Die Regel steht bisher nur in der
   Oberfläche, und das allein wäre ein Datenleck.
3. Anmeldung, echte Profile, Fotos
4. Echte Nachrichten und Push
5. Moderation: Meldungen müssen bei einem Menschen ankommen und beantwortet werden
6. Erster TestFlight-Build

Die Platzhalter im Code sind mit Kommentaren markiert.

## Die App als echte App bauen (EAS)

Expo Go zeigt die App, ist aber nicht die App — es ist eine Hülle, die deinen
Code lädt. Für TestFlight und den App Store brauchst du einen echten Build.
Den baut Expo in der Cloud (EAS), ein Mac ist auch dafür nicht nötig.

Einmalig einrichten:

```bash
npm install --global eas-cli
eas login
eas init
```

`eas init` verknüpft den Ordner mit einem Projekt in deinem Expo-Konto und
trägt eine Projekt-ID in `app.json` ein. Diese Änderung gehört committet.

### Android zum Ausprobieren — kostet nichts

```bash
eas build --platform android --profile preview
```

Ergebnis ist eine `.apk`-Datei zum Download. Die lässt sich direkt auf einem
Android-Handy installieren. Kein Entwicklerkonto, keine Gebühr. Der günstigste
Weg, die App als echte App in der Hand zu halten.

### iOS für TestFlight — braucht ein Apple-Entwicklerkonto

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

Voraussetzung ist die Mitgliedschaft im Apple Developer Program (99 USD pro
Jahr). Ohne sie lässt sich kein iOS-Build signieren und nichts an TestFlight
übergeben.

### Wenn du Code geändert hast

Nach jeder Änderung an `app.json`, an den Abhängigkeiten oder an nativen
Einstellungen ist ein neuer Build nötig. Reine Änderungen an Bildschirmen und
Texten lassen sich auch ohne neuen Build ausliefern:

```bash
eas update --branch preview
```

## Was das kostet

| Posten | Kosten |
|---|---|
| Expo Go zum Entwickeln | kostenlos |
| EAS Build, freier Tarif | kostenlos, 15 iOS- und 15 Android-Builds pro Monat |
| Apple Developer Program | 99 USD pro Jahr, Pflicht für TestFlight und App Store |
| Google Play Console | 25 USD einmalig, nur für den Play Store nötig |

Der freie EAS-Tarif reicht am Anfang. Ist das Kontingent aufgebraucht, geht es
erst im nächsten Kalendermonat weiter. Prüfe die Preise vor dem Buchen selbst
nach — sie ändern sich.

## Wichtig vor der Einreichung im App Store

- Die Kontaktadresse in `src/app/(tabs)/profil.tsx` durch die echte ersetzen.
- Die Bundle-IDs in `app.json` (`app.hevpar.ios`, `app.hevpar.android`) prüfen.
- Der Alleinstellungspunkt muss in den Review-Notes schriftlich erklärt werden
  (Apple Guideline 4.3 nennt Dating ausdrücklich als gesättigte Kategorie).
- DSA-Händlerstatus in App Store Connect ausfüllen, auch für kostenlose Apps.
