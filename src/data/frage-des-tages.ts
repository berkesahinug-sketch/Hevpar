/**
 * Die Frage des Tages: klein, spielerisch, kulturell verankert.
 *
 * Jeden Tag eine andere Frage, rotierend über die Liste. Die eigene Antwort
 * ist der Einsatz: Erst wer selbst antwortet, sieht die Antworten der
 * anderen — und kann auf sie ein Silav schicken. Damit zahlt das Spiel auf
 * die Kernmechanik ein, statt daneben zu existieren.
 */

export type TagesFrage = {
  frage: string;
  /** Demo-Antworten: Profil-ID und Text. Kommen später aus Supabase. */
  antworten: { profilId: string; text: string }[];
};

export const TAGES_FRAGEN: TagesFrage[] = [
  {
    frage: 'Çay oder Qehwe — und wie?',
    antworten: [
      { profilId: 'rojin', text: 'Çay. Dünn ist Verrat, zwei Zucker, Glas mit Taille.' },
      { profilId: 'baran', text: 'Qehwe morgens, Çay ab drei. Ich lebe in zwei Zeitzonen.' },
    ],
  },
  {
    frage: 'Welches Lied läuft, wenn du Heimweh hast?',
    antworten: [
      { profilId: 'dilan', text: 'Aynur, Dar Hejîrokê. Einmal laut, dann geht es wieder.' },
      { profilId: 'nazdar', text: 'Şivan Perwer — aber nur die alten Aufnahmen mit Rauschen.' },
    ],
  },
  {
    frage: 'Dolma: streng nach Rezept oder frei Schnauze?',
    antworten: [
      { profilId: 'evin', text: 'Das Rezept ist meine Pîrik am Telefon. Also beides.' },
      { profilId: 'shvan', text: 'Frei. Deshalb schmecken meine auch jedes Mal anders. Feature, kein Bug.' },
    ],
  },
  {
    frage: 'Welches Wort aus deinem Dialekt hat keine gute Übersetzung?',
    antworten: [
      { profilId: 'rojin', text: 'Xerîbî. "Fremde" trifft es nicht mal zur Hälfte.' },
      { profilId: 'dilan', text: 'Miner — dieses eine Wort, mit dem meine Mutter alles beenden kann.' },
    ],
  },
  {
    frage: 'Govend: erste Reihe oder erstmal zugucken?',
    antworten: [
      { profilId: 'baran', text: 'Erste Reihe, kleiner Finger fest. Zugucken kann ich bei der Arbeit.' },
      { profilId: 'nazdar', text: 'Zwei Lieder zugucken, dann gibt es kein Zurück mehr.' },
    ],
  },
  {
    frage: 'Was hat deine Dayê immer gesagt, das du erst jetzt verstehst?',
    antworten: [
      { profilId: 'evin', text: '"Iss erst, streite danach." Funktioniert übrigens auch im Büro.' },
      { profilId: 'shvan', text: '"Das Dorf sieht alles." Sie meinte damit auch Brüssel.' },
    ],
  },
  {
    frage: 'Sommer als Kind: welches Dorf, welche Stadt?',
    antworten: [
      { profilId: 'dilan', text: 'Hewlêr im August. Ich weiß jetzt, was 47 Grad bedeuten.' },
      { profilId: 'rojin', text: 'Das Dorf meiner Dayê bei Wêranşar. Sechs Wochen ohne WLAN, beste Zeit.' },
    ],
  },
];

/** Die Frage für den heutigen Tag – rotiert täglich durch die Liste. */
export function heutigeFrage(): TagesFrage {
  const start = Date.UTC(2026, 0, 1);
  const tage = Math.floor((Date.now() - start) / 86_400_000);
  return TAGES_FRAGEN[((tage % TAGES_FRAGEN.length) + TAGES_FRAGEN.length) % TAGES_FRAGEN.length];
}
