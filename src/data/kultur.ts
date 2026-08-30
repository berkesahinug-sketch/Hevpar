/**
 * Die kulturellen Kategorien von Hevpar.
 *
 * Diese Listen sind bewusst geschlossen und kein Freitext: Dialekt, Region,
 * Stadt und Werte sind erste Klasse im Datenmodell. Genau das unterscheidet
 * Hevpar von einer generischen Dating-App mit einem Feld "Über mich".
 *
 * Wichtig: Dialekt, Herkunftsregion und Glaubensangaben sind nach DSGVO Art. 9
 * besondere Kategorien personenbezogener Daten. Sie dürfen nur nach getrennter,
 * ausdrücklicher Einwilligung erhoben werden (siehe src/state/app-state.tsx).
 */

export const DIALEKTE = ['Kurmancî', 'Soranî', 'Zazakî', 'Kelhurî', 'Hewramî'] as const;

export const REGIONEN = [
  'Bakur',
  'Başûr',
  'Rojava',
  'Rojhilat',
  'In der Diaspora geboren',
] as const;

export const STAEDTE = ['Berlin', 'Stockholm', 'London', 'Brüssel', 'Paris', 'Amsterdam'] as const;

export const WERTE = [
  'Familie nah, Entscheidungen eigen',
  'Glaube ist privat',
  'Jineolojî',
  'Politisch aktiv',
  'Sprache weitergeben',
  'Zwischen zwei Welten zuhause',
] as const;

/** Maximale Anzahl Werte, die ein Profil auswählen darf. */
export const MAX_WERTE = 3;

/** Mindestalter für die Nutzung. Nicht verhandelbar (App-Store-Vorgabe). */
export const MINDESTALTER = 18;

/**
 * Die Prompts, auf die Profile antworten. Kulturell verankert, keine
 * übersetzten Standardfragen aus anderen Apps.
 */
export const PROMPTS = [
  'Devoka min',
  'Newroz heißt für mich',
  'Was ich weitergeben will',
  'Mein Sonntag',
  'Familie und ich',
  'Ein Ort, den ich dir zeigen würde',
  'Bei mir geht gar nicht',
  'Ehrlich gesagt',
] as const;

export type Dialekt = (typeof DIALEKTE)[number];
export type Region = (typeof REGIONEN)[number];
export type Stadt = (typeof STAEDTE)[number];
export type Wert = (typeof WERTE)[number];
