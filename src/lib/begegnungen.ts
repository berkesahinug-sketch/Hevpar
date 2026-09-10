import type { Profil } from '@/data/demo-profile';
import { supabase } from '@/lib/supabase';

/**
 * Der Kern-Loop gegen Supabase: Entdecken, Silav, Match, Chat, Events,
 * Frage des Tages. Alles hier setzt eine angemeldete Person voraus.
 *
 * Die Sichtbarkeitsregeln stehen in der Datenbank (Row Level Security) —
 * dieser Code fragt nur ab und bekommt automatisch nur, was die angemeldete
 * Person sehen darf.
 */

function client() {
  if (!supabase) throw new Error('Supabase ist nicht konfiguriert.');
  return supabase;
}

async function meineId(): Promise<string> {
  const nutzer = (await client().auth.getUser()).data.user;
  if (!nutzer) throw new Error('Nicht angemeldet.');
  return nutzer.id;
}

/* ------------------------------- Entdecken -------------------------------- */

/** Lädt die sichtbaren Profile und formt sie in das Format der App um. */
export async function entdeckenLaden(): Promise<Profil[]> {
  const ich = await meineId();
  const { data, error } = await client()
    .from('profile')
    .select('id, name, jahre, stadt, herkunft (dialekte, region, werte), antworten (frage, antwort)')
    .neq('id', ich)
    .order('erstellt_am', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  return (data ?? []).map((p: any) => {
    const h = Array.isArray(p.herkunft) ? p.herkunft[0] : p.herkunft;
    return {
      id: p.id,
      name: p.name,
      alter: p.jahre ?? 0,
      stadt: p.stadt,
      verifiziert: true, // unverifizierte Profile liefert die Datenbank gar nicht erst
      chips: [...(h?.dialekte ?? []), ...(h?.region ? [h.region] : []), p.stadt, ...(h?.werte ?? [])],
      prompts: (p.antworten ?? []).map((a: any) => ({ frage: a.frage, antwort: a.antwort })),
    };
  });
}

/* ----------------------------- Silav und Match ----------------------------- */

/** Schickt ein Silav. Liefert true, wenn dadurch ein Match entstanden ist. */
export async function silavSenden(
  an: string,
  frage: string,
  zitat: string,
  text: string,
): Promise<boolean> {
  const ich = await meineId();
  const { error } = await client().from('silavs').insert({ von: ich, an, frage, zitat, text });
  if (error) {
    if (error.code === '23505') throw new Error('Du hast dieser Person schon ein Silav geschickt.');
    throw new Error(error.message);
  }
  const [a, b] = [ich, an].sort();
  const { data } = await client()
    .from('matches')
    .select('id')
    .eq('profil_a', a)
    .eq('profil_b', b)
    .maybeSingle();
  return !!data;
}

export type EingehendesSilav = {
  von: string;
  name: string;
  stadt: string;
  frage: string;
  zitat: string;
  text: string;
};

/** Silavs an mich, auf die ich noch nicht geantwortet habe (kein Match). */
export async function silavEingangLaden(): Promise<EingehendesSilav[]> {
  const ich = await meineId();
  const [{ data: rein, error }, { data: paare }] = await Promise.all([
    client()
      .from('silavs')
      .select('von, frage, zitat, text, absender:profile!silavs_von_fkey (name, stadt)')
      .eq('an', ich)
      .order('erstellt_am', { ascending: false }),
    client().from('matches').select('profil_a, profil_b'),
  ]);
  if (error) throw new Error(error.message);

  const gematcht = new Set((paare ?? []).flatMap((m: any) => [m.profil_a, m.profil_b]));
  return (rein ?? [])
    .filter((s: any) => !gematcht.has(s.von))
    .map((s: any) => ({
      von: s.von,
      name: s.absender?.name ?? 'Unbekannt',
      stadt: s.absender?.stadt ?? '',
      frage: s.frage,
      zitat: s.zitat,
      text: s.text,
    }));
}

/* ---------------------------------- Chat ----------------------------------- */

export type EchterThread = {
  matchId: number;
  gegenueber: { id: string; name: string; stadt: string };
  kontext: { frage: string; antwort: string };
  nachrichten: { vonMir: boolean; text: string }[];
  ungelesen: boolean;
};

/** Alle Matches mit Verlauf. Die Silav-Texte sind die ersten Nachrichten. */
export async function threadsLaden(): Promise<EchterThread[]> {
  const ich = await meineId();
  const [{ data: matches, error }, { data: silavs }] = await Promise.all([
    client()
      .from('matches')
      .select(
        `id, profil_a, profil_b,
         a:profile!matches_profil_a_fkey (id, name, stadt),
         b:profile!matches_profil_b_fkey (id, name, stadt),
         nachrichten (von, text, erstellt_am, gelesen_am)`,
      )
      .order('erstellt_am', { ascending: false }),
    client().from('silavs').select('von, an, frage, zitat, text, erstellt_am'),
  ]);
  if (error) throw new Error(error.message);

  return (matches ?? []).map((m: any) => {
    const gegenueber = m.profil_a === ich ? m.b : m.a;
    // Die beiden Silavs dieses Paares, aelteste zuerst
    const paarSilavs = (silavs ?? [])
      .filter(
        (s: any) =>
          (s.von === ich && s.an === gegenueber.id) || (s.von === gegenueber.id && s.an === ich),
      )
      .sort((x: any, y: any) => x.erstellt_am.localeCompare(y.erstellt_am));

    const erste = paarSilavs[0];
    const verlauf = [
      ...paarSilavs.map((s: any) => ({ vonMir: s.von === ich, text: s.text })),
      ...(m.nachrichten ?? [])
        .sort((x: any, y: any) => x.erstellt_am.localeCompare(y.erstellt_am))
        .map((n: any) => ({ vonMir: n.von === ich, text: n.text })),
    ];

    return {
      matchId: m.id,
      gegenueber: { id: gegenueber.id, name: gegenueber.name, stadt: gegenueber.stadt },
      kontext: erste
        ? { frage: erste.frage, antwort: erste.zitat }
        : { frage: '', antwort: '' },
      nachrichten: verlauf,
      ungelesen: (m.nachrichten ?? []).some((n: any) => n.von !== ich && !n.gelesen_am),
    };
  });
}

export async function nachrichtSenden(matchId: number, text: string): Promise<void> {
  const ich = await meineId();
  const { error } = await client().from('nachrichten').insert({ match_id: matchId, von: ich, text });
  if (error) throw new Error(error.message);
}

/** Markiert alle fremden Nachrichten eines Matches als gelesen. */
export async function gelesenMarkieren(matchId: number): Promise<void> {
  const ich = await meineId();
  await client()
    .from('nachrichten')
    .update({ gelesen_am: new Date().toISOString() })
    .eq('match_id', matchId)
    .neq('von', ich)
    .is('gelesen_am', null);
}

/**
 * Ein Abo auf alles, was diesen Account live betrifft: neue Nachrichten,
 * neue Silavs, neue Matches. Die Datenbank liefert nur Zeilen, die die
 * angemeldete Person sehen darf. Rückgabe: Funktion zum Abbestellen.
 */
export function liveAbo(beiEreignis: () => void): () => void {
  const kanal = client()
    .channel('hevpar-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nachrichten' }, beiEreignis)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'silavs' }, beiEreignis)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, beiEreignis)
    .subscribe();
  return () => {
    client().removeChannel(kanal);
  };
}

/* ---------------------------------- Events --------------------------------- */

export type EchtesEvent = {
  id: number;
  titel: string;
  untertitel: string;
  stadt: string;
  ort: string;
  datum: Date;
  typ: string;
  zusagen: number;
  zugesagt: boolean;
};

export async function eventsLaden(): Promise<EchtesEvent[]> {
  const ich = await meineId();
  const [{ data: events, error }, { data: meine }] = await Promise.all([
    client().from('events').select('*').gte('datum', new Date().toISOString()).order('datum'),
    client().from('zusagen').select('event_id').eq('profil_id', ich),
  ]);
  if (error) throw new Error(error.message);
  const meineIds = new Set((meine ?? []).map((z: any) => z.event_id));

  const mitZahlen = await Promise.all(
    (events ?? []).map(async (e: any) => {
      const { data: zahl } = await client().rpc('zusagen_zahl', { e: e.id });
      return {
        id: e.id,
        titel: e.titel,
        untertitel: e.untertitel ?? '',
        stadt: e.stadt,
        ort: e.ort,
        datum: new Date(e.datum),
        typ: e.typ,
        zusagen: Number(zahl ?? 0),
        zugesagt: meineIds.has(e.id),
      };
    }),
  );
  return mitZahlen;
}

export async function zusageToggle(eventId: number, zusagen: boolean): Promise<void> {
  const ich = await meineId();
  if (zusagen) {
    const { error } = await client().from('zusagen').insert({ event_id: eventId, profil_id: ich });
    if (error && error.code !== '23505') throw new Error(error.message);
  } else {
    await client().from('zusagen').delete().eq('event_id', eventId).eq('profil_id', ich);
  }
}

/* ----------------------------- Frage des Tages ----------------------------- */

export type EchteTagesantwort = {
  profilId: string;
  name: string;
  stadt: string;
  text: string;
};

export async function tagesantwortSenden(text: string): Promise<void> {
  const ich = await meineId();
  const { error } = await client()
    .from('tagesantworten')
    .upsert({ profil_id: ich, datum: new Date().toISOString().slice(0, 10), text });
  if (error) throw new Error(error.message);
}

/** Antworten der anderen — die Datenbank gibt sie erst nach eigener Antwort her. */
export async function tagesantwortenLaden(): Promise<EchteTagesantwort[]> {
  const ich = await meineId();
  const heute = new Date().toISOString().slice(0, 10);
  const { data, error } = await client()
    .from('tagesantworten')
    .select('profil_id, text, profile (name, stadt)')
    .eq('datum', heute)
    .neq('profil_id', ich);
  if (error) throw new Error(error.message);
  return (data ?? []).map((t: any) => ({
    profilId: t.profil_id,
    name: t.profile?.name ?? 'Unbekannt',
    stadt: t.profile?.stadt ?? '',
    text: t.text,
  }));
}
