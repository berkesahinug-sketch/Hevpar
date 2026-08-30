import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Kilim } from '@/components/kilim';
import { Button } from '@/components/ui';
import { C, F, S } from '@/theme/tokens';

/** Die drei Versprechen, die Hevpar von einer generischen App unterscheiden. */
const VERSPRECHEN = [
  [
    'Dialekt und Herkunft zuerst',
    'Kurmancî, Soranî, Zazakî, Region, Diasporastadt — kein Freitextfeld.',
  ],
  [
    'Fotos erst nach dem Match',
    'Bis dahin sieht dich niemand. Auch keine Screenshots aus der Community.',
  ],
  ['Geprüfte Profile', 'Jedes Profil wird verifiziert, bevor es sichtbar wird.'],
];

export default function Willkommen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.inhalt,
        { paddingTop: insets.top + 30, paddingBottom: insets.bottom + S.xl },
      ]}>
      <View style={styles.oben}>
        <Kilim height={14} color={C.terracotta} />

        <Text style={styles.wortmarke}>Hevpar</Text>
        <Text style={styles.claim}>
          Kennenlernen unter Kurd:innen in Europa — mit dem Kontext, den du sonst jedes Mal erklären
          musst.
        </Text>

        <View style={styles.liste}>
          {VERSPRECHEN.map(([titel, text]) => (
            <View key={titel} style={styles.punkt}>
              <View style={styles.balken} />
              <View style={styles.punktText}>
                <Text style={styles.punktTitel}>{titel}</Text>
                <Text style={styles.punktBeschreibung}>{text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.aktionen}>
        <Button full label="Profil anlegen" onPress={() => router.push('/onboarding')} />
        <Button
          full
          variant="ghost"
          label="Ich habe schon ein Profil"
          onPress={() => router.push('/onboarding')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  inhalt: { flexGrow: 1, paddingHorizontal: S.xl },
  oben: { flex: 1 },

  wortmarke: {
    fontFamily: F.serifMedium,
    fontSize: 52,
    lineHeight: 56,
    color: C.garnet,
    marginTop: S.xxl,
  },
  claim: {
    fontFamily: F.sans,
    fontSize: 15.5,
    lineHeight: 25,
    color: C.ink,
    marginTop: S.lg,
    maxWidth: 300,
  },

  liste: { marginTop: S.xxl, gap: S.md },
  punkt: { flexDirection: 'row', gap: 12 },
  balken: { width: 3, borderRadius: 2, backgroundColor: C.gold },
  punktText: { flex: 1 },
  punktTitel: { fontFamily: F.sansSemi, fontSize: 14, color: C.ink },
  punktBeschreibung: {
    fontFamily: F.sans,
    fontSize: 13,
    lineHeight: 19.5,
    color: C.muted,
    marginTop: 2,
  },

  aktionen: { gap: 10, marginTop: S.xl },
});
