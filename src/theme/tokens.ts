/**
 * Design-Tokens für Hevpar.
 *
 * Diese Datei ist die einzige Quelle für Farben, Schriften und Abstände.
 * Farbwerte gehören nirgendwo sonst in den Code. Flaggenfarben sind bewusst
 * ausgeschlossen (siehe CLAUDE.md, Abschnitt "Design").
 */

export const C = {
  /** Hintergrund der App */
  paper: '#F6F0E4',
  /** Karten, Sheets, Navigationsleiste */
  card: '#FFFBF3',
  /** Fließtext und Überschriften */
  ink: '#191B17',
  /** Nebentext, Hinweise */
  muted: '#6C6A5F',
  /** Trennlinien, Rahmen */
  line: '#E2D9C6',
  /** Primäraktion */
  garnet: '#7C2434',
  /** Akzent, aktive Kilim-Markierung */
  terracotta: '#A9483C',
  /** Hervorhebung */
  gold: '#C4972F',
  /** Zustände, Match-Screen */
  forest: '#1E3A31',

  /** Sandton für ruhige Chips und zitierte Prompt-Antworten */
  sand: '#F0E8D8',
  /** Textfarbe auf granat-/waldgrünen Flächen */
  onDark: '#FFF8EC',
  /** Gedämpfter Text auf waldgrünem Grund */
  onDarkMuted: '#D9CFB8',
  /** Textfarbe auf goldener Fläche */
  onGold: '#241B05',
} as const;

/**
 * Schriftfamilien. Die Namen entsprechen den Schlüsseln, unter denen die
 * Schriften in src/app/_layout.tsx geladen werden.
 */
export const F = {
  /** Fraunces – Display, Namen, Prompt-Antworten */
  serif: 'Fraunces_400Regular',
  serifMedium: 'Fraunces_500Medium',
  serifSemi: 'Fraunces_600SemiBold',
  /** Inter – alle UI-Texte */
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
} as const;

export const S = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 26,
  xxl: 34,
} as const;

export const RADIUS = {
  chip: 999,
  button: 10,
  card: 16,
  sheet: 18,
  avatar: 14,
} as const;
