/**
 * Schlüsselwörter der App in den fünf Dialekten.
 *
 * Hevpar spricht die Konzepte der App in der Sprache der Person, die sie
 * benutzt: Wer Soranî gewählt hat, schickt ein "Silaw", wer Kurmancî
 * gewählt hat, ein "Silav". Maßgeblich ist der erste im Onboarding gewählte
 * Dialekt; ohne Auswahl gilt Kurmancî.
 *
 * WICHTIG — VON MUTTERSPRACHLER:INNEN PRÜFEN LASSEN:
 * Diese Einträge sind ein Startpunkt und keine verlässliche Übersetzung.
 * Jede mit "prüfen!" markierte Form ist unsicher. Bitte vor dem ersten
 * öffentlichen Test mit Sprecher:innen des jeweiligen Dialekts durchgehen
 * und korrigieren — hier in dieser Datei, sonst nirgends.
 */

import type { Dialekt } from '@/data/kultur';

type Woerter = {
  /** Der Gruß, mit dem alles anfängt */
  silav: string;
  /** Titel des Event-Bereichs (Fest/Feier) */
  cejn: string;
  /** Titel der Frage des Tages */
  pirsaRoje: string;
  /** Kurze Zusage zu einem Event ("Ich komme") */
  ezTem: string;
};

const WOERTER: Record<Dialekt, Woerter> = {
  'Kurmancî': {
    silav: 'Silav',
    cejn: 'Cejn',
    pirsaRoje: 'Pirsa rojê',
    ezTem: 'Ez têm',
  },
  'Soranî': {
    silav: 'Silaw',
    cejn: 'Cejn',
    pirsaRoje: 'Pirsyarî rojane', // prüfen!
    ezTem: 'Dêm', // prüfen!
  },
  'Zazakî': {
    silav: 'Silam', // prüfen!
    cejn: 'Roşan', // prüfen!
    pirsaRoje: 'Persa roce', // prüfen!
    ezTem: 'Ez yena', // prüfen!
  },
  'Kelhurî': {
    silav: 'Silam', // prüfen!
    cejn: 'Cejn', // prüfen!
    pirsaRoje: 'Pirsa rojê', // prüfen! (noch Kurmancî-Form)
    ezTem: 'Ez têm', // prüfen! (noch Kurmancî-Form)
  },
  'Hewramî': {
    silav: 'Silaw', // prüfen!
    cejn: 'Cejn', // prüfen!
    pirsaRoje: 'Pirsa rojê', // prüfen! (noch Kurmancî-Form)
    ezTem: 'Ez têm', // prüfen! (noch Kurmancî-Form)
  },
};

/** Liefert die Schlüsselwörter für den zuerst gewählten Dialekt. */
export function woerterFuer(dialekte: string[]): Woerter {
  const erster = dialekte[0] as Dialekt | undefined;
  return (erster && WOERTER[erster]) || WOERTER['Kurmancî'];
}
