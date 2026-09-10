import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Erscheinen } from '@/components/erscheinen';
import { MatchOverlay } from '@/components/match-overlay';
import { Tageskarte } from '@/components/tageskarte';
import { ProfileCard } from '@/components/profile-card';
import { SilavSheet } from '@/components/silav-sheet';
import { Chip, TextLink } from '@/components/ui';
import { FILTER, type Profil, type Prompt } from '@/data/demo-profile';
import { impuls } from '@/lib/haptik';
import { useApp } from '@/state/app-state';
import { C, F, S } from '@/theme/tokens';

export default function Entdecken() {
  const insets = useSafeAreaInsets();
  const { sendeSilav, neuerMatch, matchSchliessen, entdeckenListe, entdeckenLaden } = useApp();

  const [filterOffen, setFilterOffen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [silavZiel, setSilavZiel] = useState<{ profil: Profil; prompt: Prompt } | null>(null);
  const [ladeNeu, setLadeNeu] = useState(false);

  const liste = filter ? entdeckenListe.filter((p) => p.chips.includes(filter)) : entdeckenListe;

  const aktualisieren = useCallback(async () => {
    setLadeNeu(true);
    await entdeckenLaden();
    setLadeNeu(false);
  }, [entdeckenLaden]);

  const silavSenden = async (text: string) => {
    if (!silavZiel) return;
    const ziel = silavZiel;
    setSilavZiel(null);
    impuls();
    try {
      const ergebnis = await sendeSilav(ziel.profil, ziel.prompt, text);
      if (ergebnis === 'gesendet') {
        Alert.alert(
          'Silav ist raus',
          `Wenn ${ziel.profil.name} auf eine deiner Antworten antwortet, entsteht ein Match — und ihr könnt schreiben.`,
        );
      }
    } catch (e) {
      Alert.alert('Das hat nicht geklappt', e instanceof Error ? e.message : 'Unbekannter Fehler.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.inhalt, { paddingTop: insets.top + S.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={ladeNeu} onRefresh={aktualisieren} tintColor={C.garnet} />
        }>
        <View style={styles.kopf}>
          <Text style={styles.titel}>Entdecken</Text>
          <TextLink
            label={filterOffen ? 'Schließen' : 'Filtern'}
            onPress={() => setFilterOffen((offen) => !offen)}
          />
        </View>

        <Text style={styles.zaehler}>
          {liste.length === 1
            ? '1 Profil in deiner Nähe und in verbundenen Städten.'
            : `${liste.length} Profile in deiner Nähe und in verbundenen Städten.`}
        </Text>

        <Tageskarte onSilav={(p, prompt) => setSilavZiel({ profil: p, prompt })} />

        {filterOffen ? (
          <View style={styles.filter}>
            {FILTER.map((f) => (
              <Chip
                key={f}
                label={f}
                small
                active={filter === f}
                onPress={() => setFilter(filter === f ? null : f)}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.liste}>
          {liste.map((profil, i) => (
            <Erscheinen key={profil.id} index={i}>
              <ProfileCard
                profil={profil}
                onSilav={(p, prompt) => setSilavZiel({ profil: p, prompt })}
              />
            </Erscheinen>
          ))}

          {liste.length === 0 ? (
            <Text style={styles.leer}>
              Hier ist gerade niemand. Nimm einen Filter raus, oder lade jemanden aus deinem Verein
              ein — die ersten Profile einer Stadt kommen meistens über Empfehlungen.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <SilavSheet ziel={silavZiel} onSchliessen={() => setSilavZiel(null)} onSenden={silavSenden} />

      <MatchOverlay
        match={neuerMatch}
        onSchliessen={matchSchliessen}
        onChat={() => {
          const id = neuerMatch?.id;
          matchSchliessen();
          if (id) router.push(`/chat/${id}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  inhalt: { paddingHorizontal: S.lg, paddingBottom: 110 },

  kopf: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  titel: { fontFamily: F.serifMedium, fontSize: 26, color: C.ink },
  zaehler: { fontFamily: F.sans, fontSize: 13, color: C.muted, marginTop: 6 },

  filter: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: S.md },
  liste: { marginTop: S.lg },
  leer: { fontFamily: F.sans, fontSize: 13.5, lineHeight: 22, color: C.muted, paddingVertical: 30 },
});
