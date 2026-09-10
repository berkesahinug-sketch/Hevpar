import { supabase } from '@/lib/supabase';

/**
 * Alles, was Konto und eigenes Profil mit Supabase zu tun haben.
 *
 * Jede Funktion liefert bei Problemen eine deutsche, verständliche
 * Fehlermeldung als Ausnahme - die Screens zeigen sie unverändert an.
 * Ist Supabase nicht konfiguriert (keine .env), wirft alles hier einen
 * Fehler; die App merkt das vorher und bleibt im Demo-Modus.
 */

export type ProfilDaten = {
  name: string;
  geburtsdatum: string; // ISO, z. B. "1995-05-01"
  stadt: string;
  herkunftsEinwilligung: boolean;
  dialekt: string[];
  region: string | null;
  werte: string[];
  antworten: { frage: string; antwort: string }[];
};

function client() {
  if (!supabase) throw new Error('Supabase ist nicht konfiguriert (.env fehlt).');
  return supabase;
}

/** Übersetzt die häufigsten Supabase-Fehler in verständliches Deutsch. */
function verstaendlich(nachricht: string): string {
  const m = nachricht.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'E-Mail oder Passwort stimmen nicht.';
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'Für diese E-Mail gibt es schon ein Konto. Melde dich stattdessen an.';
  }
  if (m.includes('password should be at least')) {
    return 'Das Passwort ist zu kurz — mindestens 6 Zeichen.';
  }
  if (m.includes('email not confirmed')) {
    return 'Bitte bestätige zuerst deine E-Mail. Schau in dein Postfach (auch im Spam).';
  }
  if (m.includes('is invalid') && m.includes('email')) {
    return 'Das sieht nicht wie eine E-Mail-Adresse aus.';
  }
  if (m.includes('geburtsdatum') || m.includes('profile_geburtsdatum_check')) {
    return 'Hevpar ist ausschließlich für Erwachsene — Mindestalter 18.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Keine Verbindung. Prüfe dein Internet und versuch es nochmal.';
  }
  return nachricht;
}

/** Registrieren. Liefert true, wenn erst die E-Mail bestätigt werden muss. */
export async function registrieren(email: string, passwort: string): Promise<{ mailBestaetigen: boolean }> {
  const { data, error } = await client().auth.signUp({ email, password: passwort });
  if (error) throw new Error(verstaendlich(error.message));
  return { mailBestaetigen: !data.session };
}

export async function anmelden(email: string, passwort: string): Promise<void> {
  const { error } = await client().auth.signInWithPassword({ email, password: passwort });
  if (error) throw new Error(verstaendlich(error.message));
}

export async function abmelden(): Promise<void> {
  await client().auth.signOut();
}

/**
 * Speichert das komplette Onboarding-Ergebnis.
 *
 * Reihenfolge ist wichtig: erst die Einwilligung, dann die Herkunft —
 * die Datenbank nimmt Herkunftsdaten ohne aktive Einwilligung nicht an.
 */
export async function profilSpeichern(daten: ProfilDaten): Promise<void> {
  const sb = client();
  const nutzer = (await sb.auth.getUser()).data.user;
  if (!nutzer) throw new Error('Nicht angemeldet.');

  const { error: profilFehler } = await sb.from('profile').upsert({
    id: nutzer.id,
    name: daten.name,
    geburtsdatum: daten.geburtsdatum,
    stadt: daten.stadt,
  });
  if (profilFehler) throw new Error(verstaendlich(profilFehler.message));

  if (daten.herkunftsEinwilligung) {
    // Nur eintragen, wenn es noch keine aktive Einwilligung gibt
    const { data: aktiv } = await sb
      .from('einwilligungen')
      .select('id')
      .is('widerrufen_am', null)
      .eq('art', 'herkunftsdaten')
      .limit(1);
    if (!aktiv?.length) {
      const { error } = await sb
        .from('einwilligungen')
        .insert({ profil_id: nutzer.id, art: 'herkunftsdaten' });
      if (error) throw new Error(verstaendlich(error.message));
    }

    const { error: herkunftFehler } = await sb.from('herkunft').upsert({
      profil_id: nutzer.id,
      dialekte: daten.dialekt,
      region: daten.region,
      werte: daten.werte,
    });
    if (herkunftFehler) throw new Error(verstaendlich(herkunftFehler.message));
  }

  for (const a of daten.antworten) {
    const { error } = await sb
      .from('antworten')
      .upsert({ profil_id: nutzer.id, frage: a.frage, antwort: a.antwort }, { onConflict: 'profil_id,frage' });
    if (error) throw new Error(verstaendlich(error.message));
  }
}

export type GeladenesProfil = {
  name: string;
  stadt: string;
  verifiziert: boolean;
  herkunftZeigen: boolean;
  unsichtbarInStadt: boolean;
  dialekt: string[];
  region: string | null;
  werte: string[];
  antworten: { frage: string; antwort: string }[];
  herkunftsEinwilligung: boolean;
};

/** Lädt das eigene Profil. null, wenn noch keins angelegt wurde. */
export async function profilLaden(): Promise<GeladenesProfil | null> {
  const sb = client();
  const nutzer = (await sb.auth.getUser()).data.user;
  if (!nutzer) return null;

  const { data: p, error } = await sb.from('profile').select('*').eq('id', nutzer.id).maybeSingle();
  if (error) throw new Error(verstaendlich(error.message));
  if (!p) return null;

  const { data: h } = await sb.from('herkunft').select('*').eq('profil_id', nutzer.id).maybeSingle();
  const { data: a } = await sb.from('antworten').select('frage, antwort').eq('profil_id', nutzer.id);
  const { data: e } = await sb
    .from('einwilligungen')
    .select('id')
    .eq('art', 'herkunftsdaten')
    .is('widerrufen_am', null)
    .limit(1);

  return {
    name: p.name,
    stadt: p.stadt,
    verifiziert: p.verifiziert,
    herkunftZeigen: p.herkunft_zeigen,
    unsichtbarInStadt: p.unsichtbar_in_stadt,
    dialekt: h?.dialekte ?? [],
    region: h?.region ?? null,
    werte: h?.werte ?? [],
    antworten: a ?? [],
    herkunftsEinwilligung: !!e?.length,
  };
}

export async function sichtbarkeitSpeichern(teil: {
  herkunftZeigen?: boolean;
  unsichtbarInStadt?: boolean;
}): Promise<void> {
  const sb = client();
  const nutzer = (await sb.auth.getUser()).data.user;
  if (!nutzer) return;
  const { error } = await sb
    .from('profile')
    .update({
      ...(teil.herkunftZeigen !== undefined ? { herkunft_zeigen: teil.herkunftZeigen } : {}),
      ...(teil.unsichtbarInStadt !== undefined ? { unsichtbar_in_stadt: teil.unsichtbarInStadt } : {}),
    })
    .eq('id', nutzer.id);
  if (error) throw new Error(verstaendlich(error.message));
}

/** Löscht die Art.-9-Daten und widerruft die Einwilligung. Konto bleibt. */
export async function herkunftLoeschen(): Promise<void> {
  const sb = client();
  const nutzer = (await sb.auth.getUser()).data.user;
  if (!nutzer) return;
  const { error } = await sb.from('herkunft').delete().eq('profil_id', nutzer.id);
  if (error) throw new Error(verstaendlich(error.message));
  const { error: e2 } = await sb
    .from('einwilligungen')
    .update({ widerrufen_am: new Date().toISOString() })
    .eq('profil_id', nutzer.id)
    .eq('art', 'herkunftsdaten')
    .is('widerrufen_am', null);
  if (e2) throw new Error(verstaendlich(e2.message));
}

/** Löscht das Konto endgültig, samt allem, was daran hängt. */
export async function kontoLoeschen(): Promise<void> {
  const sb = client();
  const { error } = await sb.rpc('konto_loeschen');
  if (error) throw new Error(verstaendlich(error.message));
  await sb.auth.signOut();
}
