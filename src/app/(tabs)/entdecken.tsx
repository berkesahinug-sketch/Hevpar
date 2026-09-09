import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Erscheinen } from '@/components/erscheinen';
import { MatchOverlay } from '@/components/match-overlay';
import { ProfileCard } from '@/components/profile-card';
import { SilavSheet } from '@/components/silav-sheet';
import { Chip, TextLink } from '@/components/ui';
import { DEMO_PROFILE, FILTER, type Profil, type Prompt } from '@/data/demo-profile';
import { impuls } from '@/lib/haptik';
import { useApp } from '@/state/app-state';
import { C, F, S } from '@/theme/tokens';

export default function Entdecken() {
  const insets = useSafeAreaInsets();
  const { sendeSilav, neuerMatch, matchSchliessen } = useApp();

  const [filterOffen, setFilterOffen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [silavZiel, setSilavZiel] = useState<{ profil: Profil; prompt: Prompt } | null>(null);
  const [profile, setProfile] = useState(DEMO_PROFILE);
  const [ladeNeu, setLadeNeu] = useState(false);

  const liste = filter ? profile.filter((p) => p.chips.includes(filter)) : profile;

  // Ziehen zum Aktualisieren. Mit echten Daten holt das neue Profile aus
  // Supabase; in der Demo mischt es die Reihenfolge.
  const aktualisieren = useCallback(() => {
    setLadeNeu(true);
    setTimeout(() => {
      setProfile((alt) => [...alt].sort(() => Math.random() - 0.5));
      setLadeNeu(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) => {
    if (!silavZiel) return;
    impuls();
    sendeSilav(silavZiel.profil, silavZiel.prompt, text);
    setSilavZiel(null);
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
