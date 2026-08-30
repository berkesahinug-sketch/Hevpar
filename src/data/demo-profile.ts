/**
 * Demo-Profile für die Entwicklung.
 *
 * Keine echten Menschen, keine echten Daten. Diese Liste wird ersetzt, sobald
 * die Profile aus Supabase kommen (Schritt 3 und 4 des Plans).
 */

export type Prompt = {
  /** Die Frage, z. B. "Devoka min" */
  frage: string;
  /** Die Antwort des Profils */
  antwort: string;
};

export type Profil = {
  id: string;
  name: string;
  alter: number;
  stadt: string;
  /** Dialekt, Herkunftsort, Stadt und Werte – in dieser Reihenfolge angezeigt */
  chips: string[];
  prompts: Prompt[];
  /** Verifiziert die Community-Prüfung bestanden? */
  verifiziert: boolean;
};

export const DEMO_PROFILE: Profil[] = [
  {
    id: 'rojin',
    name: 'Rojîn',
    alter: 27,
    stadt: 'Berlin',
    verifiziert: true,
    chips: ['Kurmancî', 'Serhed', 'Berlin', 'Sprache weitergeben'],
    prompts: [
      {
        frage: 'Devoka min',
        antwort:
          'Kurmancî im Berliner Tempo. Ich verschlucke die Endungen, meine Dayê korrigiert mich jedes Mal.',
      },
      {
        frage: 'Newroz heißt für mich',
        antwort: 'Um sechs Uhr früh Tee aufsetzen, damit abends am Feuer niemand friert.',
      },
      {
        frage: 'Was ich weitergeben will',
        antwort: 'Dass Kinder die Lieder verstehen und nicht nur mitsummen.',
      },
    ],
  },
  {
    id: 'dilan',
    name: 'Dîlan',
    alter: 31,
    stadt: 'Stockholm',
    verifiziert: true,
    chips: ['Soranî', 'Hewlêr', 'Stockholm', 'Familie nah, Entscheidungen eigen'],
    prompts: [
      { frage: 'Devoka min', antwort: 'Soranî zuhause, Schwedisch im Büro, Englisch wenn ich streite.' },
      { frage: 'Mein Sonntag', antwort: 'Markt in Rinkeby, danach Dolma für deutlich zu viele Leute.' },
      {
        frage: 'Familie und ich',
        antwort: 'Eng, aber nicht unverhandelbar. Ich stelle nur vor, wenn es ernst ist.',
      },
    ],
  },
  {
    id: 'baran',
    name: 'Baran',
    alter: 29,
    stadt: 'London',
    verifiziert: true,
    chips: ['Kurmancî', 'Amed', 'London', 'Glaube ist privat'],
    prompts: [
      { frage: 'Devoka min', antwort: 'Kurmancî aus Amed, mit Akzent aus Hackney.' },
      {
        frage: 'Ein Ort, den ich dir zeigen würde',
        antwort: 'Die Stadtmauer in Sûr, kurz bevor die Schwalben kommen.',
      },
      { frage: 'Ehrlich gesagt', antwort: 'Ich koche schlecht und lerne es gerade. Zeugen unerwünscht.' },
    ],
  },
  {
    id: 'evin',
    name: 'Evîn',
    alter: 26,
    stadt: 'Brüssel',
    verifiziert: true,
    chips: ['Zazakî', 'Dêrsim', 'Brüssel', 'Jineolojî'],
    prompts: [
      {
        frage: 'Devoka min',
        antwort: 'Zazakî von meiner Pîrik gelernt. Samstags unterrichte ich es jetzt selbst.',
      },
      { frage: 'Newroz heißt für mich', antwort: 'In Brüssel klein, in Dêrsim laut. Beides zählt.' },
      { frage: 'Bei mir geht gar nicht', antwort: 'Wenn du sagst, das sei doch alles dasselbe.' },
    ],
  },
];

/** Filter-Chips über der Entdecken-Liste. */
export const FILTER = ['Kurmancî', 'Soranî', 'Zazakî', 'Berlin', 'Stockholm', 'London', 'Brüssel'];
