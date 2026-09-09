import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Kilim } from '@/components/kilim';
import { Chip, Eyebrow, Schalter } from '@/components/ui';
import { WovenAvatar } from '@/components/woven-avatar';
import { useApp } from '@/state/app-state';
import { C, F, S } from '@/theme/tokens';

/**
 * Öffentliche Kontaktadresse für Meldungen und Datenschutzanfragen.
 * Apple Guideline 1.2 verlangt eine erreichbare Adresse; ohne sie gibt es
 * keine Freigabe. Vor dem Einreichen durch die echte Adresse ersetzen.
 */
const KONTAKT = 'kontakt@hevpar.app';

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const { profil, einwilligung, sichtbarkeit, setSichtbarkeit, herkunftsdatenLoeschen } = useApp();

  const angaben = [
    ...profil.dialekt,
    ...(profil.region ? [profil.region] : []),
    ...profil.werte,
  ];

  const herkunftLoeschenFragen = () => {
    Alert.alert(
      'Angaben zu Herkunft löschen?',
      'Dialekt, Region und Werte werden entfernt und deine Zustimmung dazu wird zurückgenommen. Dein Konto und deine Unterhaltungen bleiben bestehen.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: herkunftsdatenLoeschen },
      ],
    );
  };

  const kontoLoeschenFragen = () => {
    Alert.alert(
      'Konto löschen?',
      'Dein Profil, deine Silavs und alle Unterhaltungen werden dauerhaft gelöscht. Das lässt sich nicht rückgängig machen.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Konto löschen',
          style: 'destructive',
          // Wird an Supabase angebunden, sobald es Konten gibt (Schritt 4).
          onPress: () =>
            Alert.alert('Noch nicht verfügbar', 'Die Kontolöschung wird mit der Anmeldung gebaut.'),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.inhalt, { paddingTop: insets.top + S.lg }]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.titel}>Dein Profil</Text>

      <View style={styles.kopf}>
        <WovenAvatar seed="berke" size={70} />
        <View>
          <Text style={styles.name}>{profil.name}</Text>
          <Text style={styles.status}>Verifizierung ausstehend</Text>
        </View>
      </View>

      <View style={styles.abschnitt}>
        <Eyebrow>Deine Angaben</Eyebrow>
        {angaben.length > 0 ? (
          <View style={styles.chips}>
            {angaben.map((angabe) => (
              <Chip key={angabe} label={angabe} tone="quiet" small />
            ))}
          </View>
        ) : (
          <Text style={styles.hinweis}>
            {einwilligung.herkunftsdaten
              ? 'Noch nichts ausgewählt.'
              : 'Du hast der Speicherung von Dialekt und Herkunft nicht zugestimmt. Diese Angaben bleiben leer.'}
          </Text>
        )}
      </View>

      <View style={styles.abschnitt}>
        <Eyebrow>Deine Antworten</Eyebrow>
        {profil.antworten.length > 0 ? (
          profil.antworten.map((a) => (
            <View key={a.frage} style={styles.antwort}>
              <Eyebrow>{a.frage}</Eyebrow>
              <Text style={styles.antwortText}>{a.antwort}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.hinweis}>
            Noch keine Antworten. Auf sie kommen die Silavs — ohne Antworten bleibt dein Profil
            stumm.
          </Text>
        )}
      </View>

      <View style={styles.trenner}>
        <Kilim height={10} color={C.line} opacity={1} />
      </View>

      <View style={styles.abschnitt}>
        <Eyebrow>Sichtbarkeit</Eyebrow>
        <Schalter
          label="Fotos erst nach dem Match"
          hinweis="Fest eingestellt. Diese Regel gilt für alle und lässt sich nicht abschalten."
          an
          onChange={() => {
            Alert.alert(
              'Fest eingestellt',
              'Fotos sind bei Hevpar grundsätzlich erst nach einem Match sichtbar. Das ist keine Einstellung, sondern die Grundlage der App.',
            );
          }}
        />
        <Schalter
          label="Herkunftsregion im Profil zeigen"
          an={sichtbarkeit.herkunftImProfil}
          onChange={(an) => setSichtbarkeit({ herkunftImProfil: an })}
        />
        <Schalter
          label="Für Menschen aus meiner Stadt unsichtbar"
          hinweis="Nützlich, wenn sich die Community vor Ort gut kennt."
          an={sichtbarkeit.unsichtbarInMeinerStadt}
          onChange={(an) => setSichtbarkeit({ unsichtbarInMeinerStadt: an })}
        />
      </View>

      <View style={styles.abschnitt}>
        <Eyebrow>Deine Daten</Eyebrow>
        <Text style={styles.hinweis}>
          Angaben zu Herkunft und Überzeugungen sind besonders geschützt. Du kannst sie jederzeit
          löschen, ohne dein Konto zu verlieren.
        </Text>
        <Aktion
          label="Angaben zu Herkunft löschen"
          onPress={herkunftLoeschenFragen}
          gefahr={false}
        />
        <Aktion label="Konto löschen" onPress={kontoLoeschenFragen} gefahr />
      </View>

      <View style={styles.abschnitt}>
        <Eyebrow>Sicherheit und Meldungen</Eyebrow>
        <Text style={styles.hinweis}>
          Profile und Nachrichten kannst du direkt in der Unterhaltung melden oder blockieren. Jede
          Meldung wird von Menschen geprüft und beantwortet.
        </Text>
        <Aktion
          label={`Schreib uns: ${KONTAKT}`}
          onPress={() => Linking.openURL(`mailto:${KONTAKT}`)}
          gefahr={false}
        />
      </View>
    </ScrollView>
  );
}

function Aktion({
  label,
  onPress,
  gefahr,
}: {
  label: string;
  onPress: () => void;
  gefahr: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.aktion, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.aktionText, gefahr && { color: C.garnet }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  inhalt: { paddingHorizontal: S.lg, paddingBottom: 110 },
  titel: { fontFamily: F.serifMedium, fontSize: 26, color: C.ink },

  kopf: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginTop: S.lg },
  name: { fontFamily: F.serif, fontSize: 21, color: C.ink },
  status: { fontFamily: F.sans, fontSize: 12.5, color: C.muted, marginTop: 3 },

  abschnitt: { marginTop: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hinweis: { fontFamily: F.sans, fontSize: 12.5, lineHeight: 20, color: C.muted },

  trenner: { marginTop: S.xl },
  antwort: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: S.md,
    marginBottom: 8,
  },
  antwortText: { fontFamily: F.serif, fontSize: 15.5, lineHeight: 22, color: C.ink },

  aktion: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line, marginTop: 2 },
  aktionText: { fontFamily: F.sans, fontSize: 14, color: C.ink },
});
