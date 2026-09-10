import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEMO_PROFILE, type Profil, type Prompt } from '@/data/demo-profile';
import * as begegnungen from '@/lib/begegnungen';
import * as konto from '@/lib/konto';
import { supabase } from '@/lib/supabase';

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
  stadt: string;
  dialekt: string[];
  region: string | null;
  werte: string[];
  /** Eigene Prompt-Antworten – ohne sie kann einem niemand ein Silav schicken */
  antworten: Prompt[];
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
  /** Es gibt eine Nachricht, die noch nicht gelesen wurde */
  ungelesen: boolean;
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
  /** "echt" = mit Supabase verbunden, "demo" = Beispieldaten im Speicher */
  modus: 'echt' | 'demo';
  /** true, sobald beim Start geklaert ist, ob jemand angemeldet ist */
  sitzungGeprueft: boolean;
  angemeldet: boolean;
  /** null = noch unbekannt; false = angemeldet, aber Onboarding fehlt noch */
  profilVorhanden: boolean | null;

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
  setEigeneAntworten: (antworten: Prompt[]) => void;
  /** Löscht alle Art.-9-Daten und widerruft die Einwilligung. Konto bleibt. */
  herkunftsdatenLoeschen: () => void;

  /** Die Profile im Entdecken-Tab (Demo-Daten oder echte, je nach Modus) */
  entdeckenListe: Profil[];
  entdeckenLaden: () => Promise<void>;
  /** Liefert 'match' oder 'gesendet' (Silav raus, Gegenseite noch offen) */
  sendeSilav: (profil: Profil, prompt: Prompt, text: string) => Promise<'match' | 'gesendet'>;
  /** Eingegangene Silavs, auf die noch nicht geantwortet wurde (nur echt) */
  silavEingang: begegnungen.EingehendesSilav[];
  beantworteSilav: (eingang: begegnungen.EingehendesSilav, text: string) => Promise<void>;
  /** Antworten der anderen auf die Tagesfrage (nur echt) */
  tagesAndere: begegnungen.EchteTagesantwort[];
  antworte: (threadId: string, text: string) => void;
  alsGelesen: (threadId: string) => void;
  matchSchliessen: () => void;
  /** Anzahl Unterhaltungen mit ungelesenen Nachrichten – für den Tab-Punkt */
  ungeleseneAnzahl: number;

  /** Event-IDs, zu denen zugesagt wurde. Privat – andere sehen nur Zahlen. */
  zusagen: string[];
  toggleZusage: (eventId: string) => void;
  /** Eigene Antwort auf die heutige Frage des Tages */
  tagesAntwort: string | null;
  setTagesAntwort: (text: string) => void;

  /** Speichert das Onboarding-Ergebnis nach Supabase (nur im echten Modus) */
  onboardingSpeichern: (zusatz: { name: string; geburtsdatum: string; stadt: string }) => Promise<void>;
  /** Laedt das eigene Profil neu aus Supabase in den App-Zustand */
  profilNeuLaden: () => Promise<void>;
  abmelden: () => Promise<void>;
  kontoEndgueltigLoeschen: () => Promise<void>;
};

/**
 * So lange lässt sich die Gegenseite in der Demo mit ihrer Antwort Zeit.
 * Absichtlich nicht sofort: Ein Gespräch hat einen Rhythmus, und der goldene
 * Punkt auf dem Nachrichten-Tab ist der Grund, später wiederzukommen.
 */
const ANTWORT_VERZOEGERUNG_MS = 45_000;

/* -------------------------------- Provider -------------------------------- */

const Context = createContext<AppState | null>(null);

function modusVorab(): 'echt' | 'demo' {
  return supabase ? 'echt' : 'demo';
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [einwilligung, setEinwilligungState] = useState<Einwilligung>({
    alterBestaetigt: false,
    herkunftsdaten: false,
  });
  const [profil, setProfil] = useState<EigenesProfil>({
    name: modusVorab() === 'echt' ? '' : 'Berke',
    stadt: '',
    dialekt: [],
    region: null,
    werte: [],
    antworten: [],
  });
  const [sichtbarkeit, setSichtbarkeitState] = useState<Sichtbarkeit>({
    herkunftImProfil: true,
    unsichtbarInMeinerStadt: false,
  });
  const [threads, setThreads] = useState<Thread[]>([]);
  const [neuerMatch, setNeuerMatch] = useState<Profil | null>(null);
  const [zusagen, setZusagen] = useState<string[]>([]);
  const [tagesAntwort, setTagesAntwortState] = useState<string | null>(null);
  const [entdeckenListe, setEntdeckenListe] = useState<Profil[]>(supabase ? [] : DEMO_PROFILE);
  const [silavEingang, setSilavEingang] = useState<begegnungen.EingehendesSilav[]>([]);
  const [tagesAndere, setTagesAndere] = useState<begegnungen.EchteTagesantwort[]>([]);

  const modus: 'echt' | 'demo' = supabase ? 'echt' : 'demo';
  const [sitzungGeprueft, setSitzungGeprueft] = useState(modus === 'demo');
  const [angemeldet, setAngemeldet] = useState(false);
  const [profilVorhanden, setProfilVorhanden] = useState<boolean | null>(modus === 'demo' ? false : null);

  /** Lädt Threads und Silav-Eingang neu — die Live-Ereignisse rufen das auf. */
  const begegnungenNeuLaden = useCallback(async () => {
    if (!supabase) return;
    try {
      const [echteThreads, eingang] = await Promise.all([
        begegnungen.threadsLaden(),
        begegnungen.silavEingangLaden(),
      ]);
      setThreads(
        echteThreads.map((t) => ({
          id: String(t.matchId),
          name: t.gegenueber.name,
          stadt: t.gegenueber.stadt,
          verifiziert: true,
          kontext: t.kontext,
          nachrichten: t.nachrichten,
          ungelesen: t.ungelesen,
          fotosFrei: true,
        })),
      );
      setSilavEingang(eingang);
    } catch {
      // Netzfehler beim Hintergrund-Laden: alter Stand bleibt stehen
    }
  }, []);

  const entdeckenLaden = useCallback(async () => {
    if (!supabase) {
      setEntdeckenListe([...DEMO_PROFILE].sort(() => Math.random() - 0.5));
      return;
    }
    try {
      setEntdeckenListe(await begegnungen.entdeckenLaden());
    } catch {
      // Alter Stand bleibt stehen
    }
  }, []);

  /** Uebernimmt ein geladenes Supabase-Profil in den App-Zustand. */
  const uebernehmen = useCallback((geladen: konto.GeladenesProfil | null) => {
    if (!geladen) {
      setProfilVorhanden(false);
      return;
    }
    setProfil({
      name: geladen.name,
      stadt: geladen.stadt,
      dialekt: geladen.dialekt,
      region: geladen.region,
      werte: geladen.werte,
      antworten: geladen.antworten,
    });
    setSichtbarkeitState({
      herkunftImProfil: geladen.herkunftZeigen,
      unsichtbarInMeinerStadt: geladen.unsichtbarInStadt,
    });
    setEinwilligungState({ alterBestaetigt: true, herkunftsdaten: geladen.herkunftsEinwilligung });
    setProfilVorhanden(true);
  }, []);

  // Sobald ein Profil da ist: Entdecken, Threads und Eingang laden, dann
  // live auf neue Nachrichten, Silavs und Matches lauschen.
  useEffect(() => {
    if (!supabase || !profilVorhanden) return;
    entdeckenLaden();
    begegnungenNeuLaden();
    const abbestellen = begegnungen.liveAbo(() => {
      begegnungenNeuLaden();
    });
    return abbestellen;
  }, [profilVorhanden, entdeckenLaden, begegnungenNeuLaden]);

  // Beim Start pruefen, ob schon jemand angemeldet ist, und auf An-/Abmelden reagieren.
  useEffect(() => {
    if (!supabase) return;
    let aktiv = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!aktiv) return;
      setAngemeldet(!!data.session);
      if (data.session) {
        try {
          uebernehmen(await konto.profilLaden());
        } catch {
          setProfilVorhanden(false);
        }
      }
      setSitzungGeprueft(true);
    });

    const { data: abo } = supabase.auth.onAuthStateChange((_ereignis, sitzung) => {
      if (!aktiv) return;
      setAngemeldet(!!sitzung);
      if (!sitzung) {
        setProfilVorhanden(null);
        setProfil({ name: '', stadt: '', dialekt: [], region: null, werte: [], antworten: [] });
        setEinwilligungState({ alterBestaetigt: false, herkunftsdaten: false });
        setThreads([]);
      }
    });
    return () => {
      aktiv = false;
      abo.subscription.unsubscribe();
    };
  }, [uebernehmen]);

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
    if (supabase) {
      konto
        .sichtbarkeitSpeichern({
          herkunftZeigen: teil.herkunftImProfil,
          unsichtbarInStadt: teil.unsichtbarInMeinerStadt,
        })
        .catch(() => {});
    }
  }, []);

  const setEigeneAntworten = useCallback((antworten: Prompt[]) => {
    setProfil((alt) => ({ ...alt, antworten }));
  }, []);

  const herkunftsdatenLoeschen = useCallback(() => {
    if (supabase) {
      konto.herkunftLoeschen().catch(() => {});
    }
    setProfil((alt) => ({ ...alt, dialekt: [], region: null, werte: [] }));
    setEinwilligungState((alt) => ({ ...alt, herkunftsdaten: false }));
    setSichtbarkeitState((alt) => ({ ...alt, herkunftImProfil: false }));
  }, []);

  const sendeSilav = useCallback(
    async (ziel: Profil, prompt: Prompt, text: string): Promise<'match' | 'gesendet'> => {
      if (supabase) {
        const match = await begegnungen.silavSenden(ziel.id, prompt.frage, prompt.antwort, text);
        await begegnungenNeuLaden();
        if (match) {
          setNeuerMatch(ziel);
          return 'match';
        }
        return 'gesendet';
      }
      sendeSilavDemo(ziel, prompt, text);
      return 'match';
    },
    [begegnungenNeuLaden],
  );

  const sendeSilavDemo = useCallback((ziel: Profil, prompt: Prompt, text: string) => {
    setThreads((alt) => [
      {
        id: ziel.id,
        name: ziel.name,
        stadt: ziel.stadt,
        verifiziert: ziel.verifiziert,
        kontext: prompt,
        nachrichten: [{ vonMir: true, text }],
        ungelesen: false,
        fotosFrei: true,
      },
      // Falls es schon einen Thread mit dieser Person gab, ersetzt der neue ihn
      ...alt.filter((t) => t.id !== ziel.id),
    ]);
    setNeuerMatch(ziel);

    // Die Antwort kommt mit Verzögerung und markiert den Thread als ungelesen.
    setTimeout(() => {
      setThreads((alt) =>
        alt.map((t) =>
          t.id === ziel.id
            ? {
                ...t,
                nachrichten: [...t.nachrichten, { vonMir: false, text: antwortDemo(ziel.id) }],
                ungelesen: true,
              }
            : t,
        ),
      );
    }, ANTWORT_VERZOEGERUNG_MS);
  }, []);

  const beantworteSilav = useCallback(
    async (eingang: begegnungen.EingehendesSilav, text: string) => {
      // Antwort auf ein Silav ist selbst ein Silav - die Gegenrichtung
      // existiert schon, also entsteht dabei sicher das Match.
      await begegnungen.silavSenden(eingang.von, eingang.frage, eingang.zitat, text);
      await begegnungenNeuLaden();
      setNeuerMatch({
        id: eingang.von,
        name: eingang.name,
        alter: 0,
        stadt: eingang.stadt,
        verifiziert: true,
        chips: [],
        prompts: [],
      });
    },
    [begegnungenNeuLaden],
  );

  const antworte = useCallback((threadId: string, text: string) => {
    setThreads((alt) =>
      alt.map((t) =>
        t.id === threadId ? { ...t, nachrichten: [...t.nachrichten, { vonMir: true, text }] } : t,
      ),
    );
    if (supabase) {
      begegnungen.nachrichtSenden(Number(threadId), text).catch(() => {});
    }
  }, []);

  const alsGelesen = useCallback((threadId: string) => {
    setThreads((alt) =>
      alt.map((t) => (t.id === threadId && t.ungelesen ? { ...t, ungelesen: false } : t)),
    );
    if (supabase) {
      begegnungen.gelesenMarkieren(Number(threadId)).catch(() => {});
    }
  }, []);

  const matchSchliessen = useCallback(() => setNeuerMatch(null), []);

  const toggleZusage = useCallback((eventId: string) => {
    setZusagen((alt) =>
      alt.includes(eventId) ? alt.filter((id) => id !== eventId) : [...alt, eventId],
    );
  }, []);

  const setTagesAntwort = useCallback((text: string) => {
    const sauber = text.trim() || null;
    setTagesAntwortState(sauber);
    if (supabase && sauber) {
      begegnungen
        .tagesantwortSenden(sauber)
        .then(() => begegnungen.tagesantwortenLaden())
        .then(setTagesAndere)
        .catch(() => {});
    }
  }, []);

  const onboardingSpeichern = useCallback(
    async (zusatz: { name: string; geburtsdatum: string; stadt: string }) => {
      setProfil((alt) => ({ ...alt, name: zusatz.name, stadt: zusatz.stadt }));
      if (!supabase) return; // Demo-Modus: nichts zu speichern
      await konto.profilSpeichern({
        name: zusatz.name,
        geburtsdatum: zusatz.geburtsdatum,
        stadt: zusatz.stadt,
        herkunftsEinwilligung: einwilligung.herkunftsdaten,
        dialekt: profil.dialekt,
        region: profil.region,
        werte: profil.werte,
        antworten: profil.antworten,
      });
      setProfilVorhanden(true);
    },
    [einwilligung.herkunftsdaten, profil.dialekt, profil.region, profil.werte, profil.antworten],
  );

  const profilNeuLaden = useCallback(async () => {
    if (!supabase) return;
    uebernehmen(await konto.profilLaden());
  }, [uebernehmen]);

  const abmelden = useCallback(async () => {
    if (supabase) await konto.abmelden();
  }, []);

  const kontoEndgueltigLoeschen = useCallback(async () => {
    if (supabase) await konto.kontoLoeschen();
  }, []);

  const ungeleseneAnzahl = threads.filter((t) => t.ungelesen).length;

  const wert = useMemo<AppState>(
    () => ({
      modus,
      sitzungGeprueft,
      angemeldet,
      profilVorhanden,
      einwilligung,
      profil,
      sichtbarkeit,
      threads,
      neuerMatch,
      entdeckenListe,
      entdeckenLaden,
      silavEingang,
      beantworteSilav,
      tagesAndere,
      setEinwilligung,
      toggleAuswahl,
      setRegion,
      setSichtbarkeit,
      setEigeneAntworten,
      herkunftsdatenLoeschen,
      sendeSilav,
      antworte,
      alsGelesen,
      matchSchliessen,
      ungeleseneAnzahl,
      zusagen,
      toggleZusage,
      tagesAntwort,
      setTagesAntwort,
      onboardingSpeichern,
      profilNeuLaden,
      abmelden,
      kontoEndgueltigLoeschen,
    }),
    [
      modus,
      sitzungGeprueft,
      angemeldet,
      profilVorhanden,
      einwilligung,
      profil,
      sichtbarkeit,
      threads,
      neuerMatch,
      entdeckenListe,
      entdeckenLaden,
      silavEingang,
      beantworteSilav,
      tagesAndere,
      setEinwilligung,
      toggleAuswahl,
      setRegion,
      setSichtbarkeit,
      setEigeneAntworten,
      herkunftsdatenLoeschen,
      sendeSilav,
      antworte,
      alsGelesen,
      matchSchliessen,
      ungeleseneAnzahl,
      zusagen,
      toggleZusage,
      tagesAntwort,
      setTagesAntwort,
      onboardingSpeichern,
      profilNeuLaden,
      abmelden,
      kontoEndgueltigLoeschen,
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
