import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Erscheinen } from '@/components/erscheinen';
import { Kilim } from '@/components/kilim';
import { Button, Chip, Eyebrow, Schalter } from '@/components/ui';
import { DIALEKTE, MAX_WERTE, MINDESTALTER, PROMPTS, REGIONEN, STAEDTE, WERTE } from '@/data/kultur';
import { useApp, type EigenesProfil } from '@/state/app-state';
import { C, F, RADIUS, S } from '@/theme/tokens';

/**
 * Onboarding in sechs Schritten.
 *
 * Schritt 1 ist die Einwilligung. Dialekt, Herkunftsregion und Werte sind nach
 * DSGVO Art. 9 besondere Kategorien personenbezogener Daten; sie dürfen erst
 * nach ausdrücklicher, getrennter Zustimmung erhoben werden. Wer ablehnt, kommt
 * trotzdem in die App – nur ohne diese Angaben. Eine Einwilligung, ohne die
 * nichts geht, ist rechtlich keine freiwillige Einwilligung.
 */
const SCHRITTE = 6;

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [schritt, setSchritt] = useState(0);
  const {
    einwilligung,
    setEinwilligung,
    profil,
    toggleAuswahl,
    setRegion,
    setEigeneAntworten,
    onboardingSpeichern,
    modus,
  } = useApp();

  // Schritt 1: Wer bist du. Bleibt lokal, bis am Ende alles gespeichert wird.
  const [name, setName] = useState(profil.name);
  const [geburtsdatum, setGeburtsdatum] = useState('');
  const [stadt, setStadt] = useState<string | null>(profil.stadt || null);
  const [speichert, setSpeichert] = useState(false);

  const weiter = () => {
    // Ohne Einwilligung in die Herkunftsdaten überspringen wir nur die
    // Abfragen dazu (Schritte 3 bis 5). Die eigenen Antworten kommen trotzdem –
    // ohne sie kann einem niemand ein Silav schicken.
    if (schritt === 1 && !einwilligung.herkunftsdaten) {
      setSchritt(SCHRITTE - 1);
      return;
    }
    if (schritt < SCHRITTE - 1) setSchritt(schritt + 1);
  };

  const zurueck = () => {
    if (schritt === SCHRITTE - 1 && !einwilligung.herkunftsdaten) setSchritt(1);
    else if (schritt > 0) setSchritt(schritt - 1);
    else router.back();
  };

  const abschliessen = async () => {
    setSpeichert(true);
    try {
      await onboardingSpeichern({
        name: name.trim(),
        geburtsdatum: alsIso(geburtsdatum) ?? '',
        stadt: stadt ?? '',
      });
      router.replace('/entdecken');
    } catch (e) {
      Alert.alert(
        'Speichern hat nicht geklappt',
        e instanceof Error ? e.message : 'Unbekannter Fehler. Versuch es nochmal.',
      );
    } finally {
      setSpeichert(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + S.lg }]}>
      {/* Fortschritt: das Kilim trägt hier Information, nicht Dekoration */}
      <View style={styles.fortschritt}>
        {Array.from({ length: SCHRITTE }, (_, i) => (
          <View key={i} style={styles.fortschrittTeil}>
            <Kilim
              height={10}
              dense
              color={i <= schritt ? C.terracotta : C.line}
              opacity={i <= schritt ? 1 : 0.35}
            />
          </View>
        ))}
      </View>

      {schritt === 0 ? (
        <WerBistDuSchritt
          name={name}
          setName={setName}
          geburtsdatum={geburtsdatum}
          setGeburtsdatum={setGeburtsdatum}
          stadt={stadt}
          setStadt={setStadt}
          altersPflicht={modus === 'echt'}
          insets={insets.bottom}
          onWeiter={weiter}
          onZurueck={zurueck}
        />
      ) : schritt === 1 ? (
        <EinwilligungsSchritt
          einwilligung={einwilligung}
          setEinwilligung={setEinwilligung}
          insets={insets.bottom}
          onWeiter={weiter}
          onZurueck={zurueck}
        />
      ) : schritt < SCHRITTE - 1 ? (
        <AuswahlSchritt
          schritt={schritt}
          profil={profil}
          toggleAuswahl={toggleAuswahl}
          setRegion={setRegion}
          insets={insets.bottom}
          onWeiter={weiter}
          onZurueck={zurueck}
        />
      ) : speichert ? (
        <View style={styles.laden}>
          <ActivityIndicator color={C.garnet} />
          <Text style={styles.hinweis}>Dein Profil wird gespeichert …</Text>
        </View>
      ) : (
        <AntwortSchritt
          profil={profil}
          setEigeneAntworten={setEigeneAntworten}
          insets={insets.bottom}
          onFertig={abschliessen}
          onZurueck={zurueck}
        />
      )}
    </View>
  );
}

/* ---------------------------- Schritt 1: Wer bist du --------------------------- */

/** "TT.MM.JJJJ" -> "JJJJ-MM-TT", oder null wenn es kein echtes Datum ist. */
function alsIso(eingabe: string): string | null {
  const m = eingabe.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const [_, t, mo, j] = m;
  const d = new Date(Number(j), Number(mo) - 1, Number(t));
  if (d.getFullYear() !== Number(j) || d.getMonth() !== Number(mo) - 1 || d.getDate() !== Number(t)) {
    return null;
  }
  return `${j}-${mo.padStart(2, '0')}-${t.padStart(2, '0')}`;
}

/** Ist die Person nach diesem Datum mindestens 18? */
function mindestens18(iso: string): boolean {
  const grenze = new Date();
  grenze.setFullYear(grenze.getFullYear() - MINDESTALTER);
  return new Date(iso) <= grenze;
}

function WerBistDuSchritt({
  name,
  setName,
  geburtsdatum,
  setGeburtsdatum,
  stadt,
  setStadt,
  altersPflicht,
  insets,
  onWeiter,
  onZurueck,
}: {
  name: string;
  setName: (v: string) => void;
  geburtsdatum: string;
  setGeburtsdatum: (v: string) => void;
  stadt: string | null;
  setStadt: (v: string | null) => void;
  /** Im echten Modus ist das Geburtsdatum Pflicht (18+-Pruefung der Datenbank) */
  altersPflicht: boolean;
  insets: number;
  onWeiter: () => void;
  onZurueck: () => void;
}) {
  const iso = alsIso(geburtsdatum);
  const datumOk = !altersPflicht && !geburtsdatum.trim() ? true : !!iso && mindestens18(iso);
  const zuJung = !!iso && !mindestens18(iso);
  const bereit = name.trim().length > 0 && !!stadt && datumOk;

  return (
    <>
      <ScrollView contentContainerStyle={styles.inhalt} showsVerticalScrollIndicator={false}>
        <Eyebrow>Schritt 1 von {SCHRITTE}</Eyebrow>
        <Text style={styles.titel}>Wer bist du?</Text>
        <Text style={styles.hinweis}>
          Dein Vorname reicht. Das Geburtsdatum bleibt privat — es prüft nur das Mindestalter.
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Vorname"
          placeholderTextColor={C.muted}
          style={styles.feld}
          accessibilityLabel="Vorname"
        />
        <TextInput
          value={geburtsdatum}
          onChangeText={setGeburtsdatum}
          placeholder="Geburtsdatum, z. B. 01.05.1995"
          placeholderTextColor={C.muted}
          keyboardType="numbers-and-punctuation"
          style={styles.feld}
          accessibilityLabel="Geburtsdatum"
        />
        {zuJung ? (
          <Text style={styles.warnung}>Hevpar ist ausschließlich für Erwachsene — Mindestalter {MINDESTALTER}.</Text>
        ) : null}

        <Text style={[styles.hinweis, { marginTop: S.lg }]}>In welcher Stadt lebst du?</Text>
        <View style={styles.chips}>
          {STAEDTE.map((s) => (
            <Chip key={s} label={s} active={stadt === s} onPress={() => setStadt(stadt === s ? null : s)} />
          ))}
        </View>
      </ScrollView>

      <Navigation insets={insets} onZurueck={onZurueck} onWeiter={onWeiter} bereit={bereit} label="Weiter" />
    </>
  );
}

/* ---------------------------- Schritt 2: Zustimmung ---------------------------- */

function EinwilligungsSchritt({
  einwilligung,
  setEinwilligung,
  insets,
  onWeiter,
  onZurueck,
}: {
  einwilligung: ReturnType<typeof useApp>['einwilligung'];
  setEinwilligung: ReturnType<typeof useApp>['setEinwilligung'];
  insets: number;
  onWeiter: () => void;
  onZurueck: () => void;
}) {
  return (
    <>
      <ScrollView contentContainerStyle={styles.inhalt} showsVerticalScrollIndicator={false}>
        <Eyebrow>Schritt 2 von {SCHRITTE}</Eyebrow>
        <Text style={styles.titel}>Bevor wir weitermachen</Text>
        <Text style={styles.hinweis}>
          Zwei Angaben brauchen deine ausdrückliche Zustimmung. Du kannst sie später jederzeit
          zurücknehmen, ohne dein Konto zu verlieren.
        </Text>

        <View style={styles.schalterGruppe}>
          <Schalter
            label={`Ich bin mindestens ${MINDESTALTER} Jahre alt`}
            hinweis="Hevpar ist ausschließlich für Erwachsene."
            an={einwilligung.alterBestaetigt}
            onChange={(an) => setEinwilligung({ alterBestaetigt: an })}
          />
          <Schalter
            label="Angaben zu Dialekt und Herkunft dürfen gespeichert werden"
            hinweis="Diese Angaben sind besonders geschützt. Sie steuern deine Vorschläge und werden nicht an Dritte weitergegeben. Ohne Zustimmung kannst du Hevpar trotzdem nutzen — dann ohne diese Angaben."
            an={einwilligung.herkunftsdaten}
            onChange={(an) => setEinwilligung({ herkunftsdaten: an })}
          />
        </View>
      </ScrollView>

      <Navigation
        insets={insets}
        onZurueck={onZurueck}
        onWeiter={onWeiter}
        // Ohne Altersbestätigung geht es nicht weiter, ohne Herkunftsdaten schon.
        bereit={einwilligung.alterBestaetigt}
        label={einwilligung.herkunftsdaten ? 'Weiter' : 'Weiter ohne Angaben'}
      />
    </>
  );
}

/* ------------------------ Schritt 2 bis 4: Kultur-Chips ------------------------ */

const BLOECKE = [
  {
    titel: 'Welche Sprache sprichst du zuhause?',
    hinweis: 'Mehrfachauswahl möglich. Du siehst zuerst Menschen, die dich verstehen.',
    feld: 'dialekt',
    optionen: DIALEKTE,
  },
  {
    titel: 'Woher kommt deine Familie?',
    hinweis: 'Nur du entscheidest, ob das im Profil steht.',
    feld: 'region',
    optionen: REGIONEN,
  },
  {
    titel: 'Was ist dir wichtig?',
    hinweis: `Wähle bis zu ${MAX_WERTE}. Diese Angaben steuern deine Vorschläge, nicht dein Ranking.`,
    feld: 'werte',
    optionen: WERTE,
  },
] as const;

function AuswahlSchritt({
  schritt,
  profil,
  toggleAuswahl,
  setRegion,
  insets,
  onWeiter,
  onZurueck,
}: {
  schritt: number;
  profil: ReturnType<typeof useApp>['profil'];
  toggleAuswahl: ReturnType<typeof useApp>['toggleAuswahl'];
  setRegion: ReturnType<typeof useApp>['setRegion'];
  insets: number;
  onWeiter: () => void;
  onZurueck: () => void;
}) {
  const block = BLOECKE[schritt - 2];
  const mehrfach = block.feld !== 'region';
  const gewaehlt: string[] = mehrfach
    ? profil[block.feld as 'dialekt' | 'werte']
    : profil.region
      ? [profil.region]
      : [];

  const istVoll = block.feld === 'werte' && gewaehlt.length >= MAX_WERTE;

  return (
    <>
      <ScrollView contentContainerStyle={styles.inhalt} showsVerticalScrollIndicator={false}>
        <Eyebrow>
          Schritt {schritt + 1} von {SCHRITTE}
        </Eyebrow>
        <Text style={styles.titel}>{block.titel}</Text>
        <Text style={styles.hinweis}>{block.hinweis}</Text>

        <View style={styles.chips}>
          {block.optionen.map((option) => {
            const aktiv = gewaehlt.includes(option);
            return (
              <Chip
                key={option}
                label={option}
                active={aktiv}
                // Wenn das Kontingent voll ist, bleiben nur die gewählten Chips klickbar
                disabled={istVoll && !aktiv}
                onPress={() =>
                  mehrfach
                    ? toggleAuswahl(block.feld as 'dialekt' | 'werte', option, MAX_WERTE)
                    : setRegion(option)
                }
              />
            );
          })}
        </View>
      </ScrollView>

      <Navigation
        insets={insets}
        onZurueck={onZurueck}
        onWeiter={onWeiter}
        bereit={gewaehlt.length > 0}
        label="Weiter"
      />
    </>
  );
}

/* ------------------------- Schritt 5: Deine Antworten ------------------------- */

function AntwortSchritt({
  profil,
  setEigeneAntworten,
  insets,
  onFertig,
  onZurueck,
}: {
  profil: EigenesProfil;
  setEigeneAntworten: (antworten: { frage: string; antwort: string }[]) => void;
  insets: number;
  onFertig: () => void;
  onZurueck: () => void;
}) {
  const [gespeichert, setGespeichert] = useState(profil.antworten);
  const beantwortet = gespeichert.map((a) => a.frage);
  const offene = PROMPTS.filter((f) => !beantwortet.includes(f));
  const [frage, setFrage] = useState<string>(offene[0] ?? PROMPTS[0]);
  const [text, setText] = useState('');

  // Die aktuelle Eingabe zaehlt mit: Wer eine Antwort getippt hat, muss sie
  // nicht erst extra speichern, um weiterzukommen.
  const aktuelleAntwort = text.trim();
  const alle = aktuelleAntwort ? [...gespeichert, { frage, antwort: aktuelleAntwort }] : gespeichert;

  const ablegen = () => {
    if (!aktuelleAntwort) return;
    const neu = [...gespeichert, { frage, antwort: aktuelleAntwort }];
    setGespeichert(neu);
    setText('');
    const naechste = PROMPTS.filter((f) => !neu.some((a) => a.frage === f));
    if (naechste.length) setFrage(naechste[0]);
  };

  const fertig = () => {
    setEigeneAntworten(alle.slice(0, 3));
    onFertig();
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.inhalt} showsVerticalScrollIndicator={false}>
        <Eyebrow>Schritt {SCHRITTE} von {SCHRITTE}</Eyebrow>
        <Text style={styles.titel}>Und jetzt du</Text>
        <Text style={styles.hinweis}>
          Wähle eine Frage und antworte so, wie nur du antworten würdest. Auf diese Antworten
          kommen später die Silavs — nicht auf dein Foto.
        </Text>

        {gespeichert.map((a) => (
          <Erscheinen key={a.frage} style={styles.abgelegt}>
            <Eyebrow>{a.frage}</Eyebrow>
            <Text style={styles.abgelegtText}>{a.antwort}</Text>
          </Erscheinen>
        ))}

        {gespeichert.length < 3 ? (
          <>
            <View style={styles.chips}>
              {offene.map((f) => (
                <Chip key={f} label={f} active={frage === f} onPress={() => setFrage(f)} small />
              ))}
            </View>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Deine Antwort — zwei ehrliche Sätze reichen."
              placeholderTextColor={C.muted}
              multiline
              style={styles.eingabe}
              accessibilityLabel={`Antwort auf ${frage}`}
            />

            {aktuelleAntwort && gespeichert.length < 2 ? (
              <View style={styles.nochEine}>
                <Button variant="ghost" label="Ablegen und noch eine beantworten" onPress={ablegen} />
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.hinweis}>
            Drei Antworten sind das Maximum — mehr Fläche bekommt hier niemand.
          </Text>
        )}
      </ScrollView>

      <Navigation
        insets={insets}
        onZurueck={onZurueck}
        onWeiter={fertig}
        bereit={alle.length > 0}
        label="Fertig"
      />
    </>
  );
}

/* -------------------------------- Fußleiste -------------------------------- */

function Navigation({
  insets,
  onZurueck,
  onWeiter,
  bereit,
  label,
}: {
  insets: number;
  onZurueck: () => void;
  onWeiter: () => void;
  bereit: boolean;
  label: string;
}) {
  return (
    <View style={[styles.fussleiste, { paddingBottom: insets + S.lg }]}>
      <Button variant="ghost" label="Zurück" onPress={onZurueck} />
      <Button style={styles.weiter} label={label} disabled={!bereit} onPress={onWeiter} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper, paddingHorizontal: S.xl },

  fortschritt: { flexDirection: 'row', gap: 5, marginBottom: S.xl },
  fortschrittTeil: { flex: 1 },

  inhalt: { paddingBottom: S.xl },
  titel: { fontFamily: F.serifMedium, fontSize: 29, lineHeight: 33, color: C.ink },
  hinweis: { fontFamily: F.sans, fontSize: 13.5, lineHeight: 21, color: C.muted, marginTop: 10 },

  schalterGruppe: { marginTop: S.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: S.xl },


  fussleiste: { flexDirection: 'row', gap: 10, paddingTop: S.md },
  weiter: { flex: 1 },

  feld: {
    marginTop: S.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    fontFamily: F.sans,
    fontSize: 15,
    color: C.ink,
  },
  warnung: { fontFamily: F.sans, fontSize: 12.5, lineHeight: 19, color: C.garnet, marginTop: 8 },
  laden: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  abgelegt: {
    backgroundColor: C.sand,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: S.md,
    marginTop: S.lg,
  },
  abgelegtText: { fontFamily: F.serif, fontSize: 15.5, lineHeight: 22, color: C.ink },

  eingabe: {
    marginTop: S.md,
    padding: 12,
    minHeight: 96,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    fontFamily: F.serif,
    fontSize: 16,
    lineHeight: 23,
    color: C.ink,
    textAlignVertical: 'top',
  },
  nochEine: { marginTop: 10, alignSelf: 'flex-start' },
});
