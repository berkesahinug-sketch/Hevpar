import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Profil, Prompt } from '@/data/demo-profile';

/* --------------------------------- Typen ---------------------------------- */

/**
 * Einwilligungen, getrennt erfasst.
 *
 * Dialekt, Herkunftsregion und Glaubensangaben sind besondere Kategorien
 * personenbezogener Daten (DSGVO Art. 9). Sie brauchen eine eigene,
 * ausdrückliche Einwilligung – nicht mitgebündelt in den AGB – und müssen
 * einzeln widerrufbar sein, ohne dass das Konto verloren geht.
 */
export type Einwilligung = {
  /** Nutzer:in ist mindestens 18 – Voraussetzung für die Nutzung überhaupt */
  alterBestaetigt: boolean;
  /** Ausdrückliche Einwilligung in die Verarbeitung von Dialekt und Herkunft */
  herkunftsdaten: boolean;
};

export type EigenesProfil = {
  name: string;
  dialekt: string[];
  region: string | null;
  werte: string[];
};

export type Nachricht = {
  /** true = von mir geschrieben */
  vonMir: boolean;
  text: string;
};

export type Thread = {
  /** Entspricht der Profil-ID der Gegenseite */
  id: string;
  name: string;
  stadt: string;
  verifiziert: boolean;
  /**
   * Die Prompt-Antwort, auf die das Silav ging. Bleibt dauerhaft oben im Chat
   * stehen – das ist der Kern der Mechanik, nicht nur ein Zitat beim Start.
   */
  kontext: Prompt;
  nachrichten: Nachricht[];
  /**
   * Fotos sind erst nach beidseitigem Match sichtbar.
   *
   * ACHTUNG: Dieser Wert ist nur für die Oberfläche. Die eigentliche
   * Durchsetzung muss serverseitig per Row Level Security passieren – eine
   * Regel, die nur im Client steht, ist ein Datenleck (siehe CLAUDE.md,
   * Randbedingung 2).
   */
  fotosFrei: boolean;
};

export type Sichtbarkeit = {
  herkunftImProfil: boolean;
  unsichtbarInMeinerStadt: boolean;
};

type AppState = {
  einwilligung: Einwilligung;
  profil: EigenesProfil;
  sichtbarkeit: Sichtbarkeit;
  threads: Thread[];
  /** Profil, für das gerade der Match-Screen gezeigt wird */
  neuerMatch: Profil | null;

  setEinwilligung: (teil: Partial<Einwilligung>) => void;
  toggleAuswahl: (feld: 'dialekt' | 'werte', wert: string, max?: number) => void;
  setRegion: (wert: string | null) => void;
  setSichtbarkeit: (teil: Partial<Sichtbarkeit>) => void;
  /** Löscht alle Art.-9-Daten und widerruft die Einwilligung. Konto bleibt. */
  herkunftsdatenLoeschen: () => void;

  sendeSilav: (profil: Profil, prompt: Prompt, text: string) => void;
  antworte: (threadId: string, text: string) => void;
  matchSchliessen: () => void;
};

/* -------------------------------- Provider -------------------------------- */

const Context = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [einwilligung, setEinwilligungState] = useState<Einwilligung>({
    alterBestaetigt: false,
    herkunftsdaten: false,
  });
  const [profil, setProfil] = useState<EigenesProfil>({
    name: 'Berke',
    dialekt: [],
    region: null,
    werte: [],
  });
  const [sichtbarkeit, setSichtbarkeitState] = useState<Sichtbarkeit>({
    herkunftImProfil: true,
    unsichtbarInMeinerStadt: false,
  });
  const [threads, setThreads] = useState<Thread[]>([]);
  const [neuerMatch, setNeuerMatch] = useState<Profil | null>(null);

  const setEinwilligung = useCallback((teil: Partial<Einwilligung>) => {
    setEinwilligungState((alt) => ({ ...alt, ...teil }));
  }, []);

  const toggleAuswahl = useCallback((feld: 'dialekt' | 'werte', wert: string, max?: number) => {
    setProfil((alt) => {
      const aktuell = alt[feld];
      if (aktuell.includes(wert)) {
        return { ...alt, [feld]: aktuell.filter((x) => x !== wert) };
      }
      // Obergrenze respektieren, z. B. höchstens drei Werte
      if (max !== undefined && aktuell.length >= max) return alt;
      return { ...alt, [feld]: [...aktuell, wert] };
    });
  }, []);

  const setRegion = useCallback((wert: string | null) => {
    setProfil((alt) => ({ ...alt, region: alt.region === wert ? null : wert }));
  }, []);

  const setSichtbarkeit = useCallback((teil: Partial<Sichtbarkeit>) => {
    setSichtbarkeitState((alt) => ({ ...alt, ...teil }));
  }, []);

  const herkunftsdatenLoeschen = useCallback(() => {
    setProfil((alt) => ({ ...alt, dialekt: [], region: null, werte: [] }));
    setEinwilligungState((alt) => ({ ...alt, herkunftsdaten: false }));
    setSichtbarkeitState((alt) => ({ ...alt, herkunftImProfil: false }));
  }, []);

  const sendeSilav = useCallback((ziel: Profil, prompt: Prompt, text: string) => {
    setThreads((alt) => [
      {
        id: ziel.id,
        name: ziel.name,
        stadt: ziel.stadt,
        verifiziert: ziel.verifiziert,
        kontext: prompt,
        nachrichten: [
          { vonMir: true, text },
          { vonMir: false, text: antwortDemo(ziel.id) },
        ],
        fotosFrei: true,
      },
      // Falls es schon einen Thread mit dieser Person gab, ersetzt der neue ihn
      ...alt.filter((t) => t.id !== ziel.id),
    ]);
    setNeuerMatch(ziel);
  }, []);

  const antworte = useCallback((threadId: string, text: string) => {
    setThreads((alt) =>
      alt.map((t) =>
        t.id === threadId ? { ...t, nachrichten: [...t.nachrichten, { vonMir: true, text }] } : t,
      ),
    );
  }, []);

  const matchSchliessen = useCallback(() => setNeuerMatch(null), []);

  const wert = useMemo<AppState>(
    () => ({
      einwilligung,
      profil,
      sichtbarkeit,
      threads,
      neuerMatch,
      setEinwilligung,
      toggleAuswahl,
      setRegion,
      setSichtbarkeit,
      herkunftsdatenLoeschen,
      sendeSilav,
      antworte,
      matchSchliessen,
    }),
    [
      einwilligung,
      profil,
      sichtbarkeit,
      threads,
      neuerMatch,
      setEinwilligung,
      toggleAuswahl,
      setRegion,
      setSichtbarkeit,
      herkunftsdatenLoeschen,
      sendeSilav,
      antworte,
      matchSchliessen,
    ],
  );

  return <Context.Provider value={wert}>{children}</Context.Provider>;
}

export function useApp() {
  const wert = useContext(Context);
  if (!wert) throw new Error('useApp muss innerhalb von <AppStateProvider> benutzt werden');
  return wert;
}

/**
 * Platzhalter-Antwort der Gegenseite, damit der Chat im Prototyp nicht leer
 * wirkt. Entfällt, sobald echte Nachrichten über Supabase Realtime laufen.
 */
function antwortDemo(profilId: string) {
  if (profilId === 'rojin') return 'Serçavan. Die Tee-Sache stimmt übrigens wirklich.';
  return 'Silav! Freut mich.';
}
