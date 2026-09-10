/**
 * Community-Events: Feste, Konzerte, Sprachcafés, Vereinsabende.
 *
 * In der Demo sind die Events kuratiert und die Termine relativ zu heute
 * gesetzt, damit die Vorschau immer lebendig wirkt. Später kommen sie aus
 * Supabase und werden von Vereinen und geprüften Veranstaltern gepflegt.
 *
 * Zwei Entscheidungen, die bleiben sollen, auch wenn echte Daten kommen:
 * 1. Nutzer:innen können Events zunächst NICHT selbst einstellen. Offene
 *    Einreichung ist eine Moderationsfläche (Apple 1.2, DSA) — erst mit
 *    Prüfprozess öffnen.
 * 2. Zusagen sind privat. Sichtbar ist nur eine Gesamtzahl, nie wer kommt.
 *    Die Teilnahme an Community-Veranstaltungen kann Rückschlüsse auf
 *    politische Einstellungen zulassen — das ist wieder Art.-9-Terrain.
 */

export type EventTyp = 'Fest' | 'Musik' | 'Tanz' | 'Kino' | 'Sprache';

export type CommunityEvent = {
  id: string;
  titel: string;
  untertitel: string;
  stadt: string;
  ort: string;
  datum: Date;
  typ: EventTyp;
  /** Zusagen aus der Community, bevor die eigene dazukommt */
  zusagenBasis: number;
};

function inTagen(anzahl: number, stunde = 19): Date {
  const d = new Date();
  d.setDate(d.getDate() + anzahl);
  d.setHours(stunde, 0, 0, 0);
  return d;
}

export const EVENTS: CommunityEvent[] = [
  {
    id: 'govend-bruessel',
    titel: 'Şeva Govendê',
    untertitel: 'Offener Tanzabend — Anfänger:innen ausdrücklich erwünscht',
    stadt: 'Brüssel',
    ort: 'Kurdisches Kulturzentrum, Saint-Josse',
    datum: inTagen(0, 20),
    typ: 'Tanz',
    zusagenBasis: 34,
  },
  {
    id: 'dengbej-stockholm',
    titel: 'Şeva Dengbêjan',
    untertitel: 'Ein Abend mit Dengbêj — Erzählgesang, Tee, keine Eile',
    stadt: 'Stockholm',
    ort: 'Folkets Hus, Rinkeby',
    datum: inTagen(3),
    typ: 'Musik',
    zusagenBasis: 21,
  },
  {
    id: 'film-berlin',
    titel: 'Kurdisches Filmfestival',
    untertitel: 'Eröffnungsabend mit Regiegespräch',
    stadt: 'Berlin',
    ort: 'Moviemento, Kreuzberg',
    datum: inTagen(6),
    typ: 'Kino',
    zusagenBasis: 87,
  },
  {
    id: 'zazaki-amsterdam',
    titel: 'Zazakî-Sprachcafé',
    untertitel: 'Reden, Fehler machen, weiterreden. Alle Niveaus.',
    stadt: 'Amsterdam',
    ort: 'De Meevaart, Oost',
    datum: inTagen(10, 18),
    typ: 'Sprache',
    zusagenBasis: 12,
  },
  {
    id: 'payiz-london',
    titel: 'Cejna Payîzê',
    untertitel: 'Herbstfest des Kurdischen Gemeindezentrums, mit Küche und Musik',
    stadt: 'London',
    ort: 'Kurdish Community Centre, Haringey',
    datum: inTagen(16, 15),
    typ: 'Fest',
    zusagenBasis: 58,
  },
];

/** Formatiert ein Datum kurz und deutsch, z. B. "Fr., 12. Sep., 19 Uhr". */
export function datumKurz(d: Date): string {
  try {
    const tag = new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d);
    return `${tag}, ${d.getHours()} Uhr`;
  } catch {
    return `${d.getDate()}.${d.getMonth() + 1}., ${d.getHours()} Uhr`;
  }
}

/** Liegt das Event am heutigen Tag? */
export function istHeute(d: Date): boolean {
  const jetzt = new Date();
  return (
    d.getDate() === jetzt.getDate() &&
    d.getMonth() === jetzt.getMonth() &&
    d.getFullYear() === jetzt.getFullYear()
  );
}
