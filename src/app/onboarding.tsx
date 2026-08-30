import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Kilim } from '@/components/kilim';
import { Button, Chip, Eyebrow, Schalter } from '@/components/ui';
import { DIALEKTE, MAX_WERTE, MINDESTALTER, REGIONEN, WERTE } from '@/data/kultur';
import { useApp } from '@/state/app-state';
import { C, F, S } from '@/theme/tokens';

/**
 * Onboarding in vier Schritten.
 *
 * Schritt 1 ist die Einwilligung. Dialekt, Herkunftsregion und Werte sind nach
 * DSGVO Art. 9 besondere Kategorien personenbezogener Daten; sie dürfen erst
 * nach ausdrücklicher, getrennter Zustimmung erhoben werden. Wer ablehnt, kommt
 * trotzdem in die App – nur ohne diese Angaben. Eine Einwilligung, ohne die
 * nichts geht, ist rechtlich keine freiwillige Einwilligung.
 */
const SCHRITTE = 4;

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [schritt, setSchritt] = useState(0);
  const { einwilligung, setEinwilligung, profil, toggleAuswahl, setRegion } = useApp();

  const weiter = () => {
    // Ohne Einwilligung in die Herkunftsdaten überspringen wir die Abfragen
    // dazu vollständig und gehen direkt in die App.
    if (schritt === 0 && !einwilligung.herkunftsdaten) {
      router.replace('/entdecken');
      return;
    }
    if (schritt < SCHRITTE - 1) setSchritt(schritt + 1);
    else router.replace('/entdecken');
  };

  const zurueck = () => {
    if (schritt > 0) setSchritt(schritt - 1);
    else router.back();
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
        <EinwilligungsSchritt
          einwilligung={einwilligung}
          setEinwilligung={setEinwilligung}
          insets={insets.bottom}
          onWeiter={weiter}
          onZurueck={zurueck}
        />
      ) : (
        <AuswahlSchritt
          schritt={schritt}
          profil={profil}
          toggleAuswahl={toggleAuswahl}
          setRegion={setRegion}
          insets={insets.bottom}
          onWeiter={weiter}
          onZurueck={zurueck}
        />
      )}
    </View>
  );
}

/* ---------------------------- Schritt 1: Zustimmung ---------------------------- */

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
        <Eyebrow>Schritt 1 von {SCHRITTE}</Eyebrow>
        <Text style={styles.titel}>Bevor wir anfangen</Text>
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
  const block = BLOECKE[schritt - 1];
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
});
