import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Kilim } from '@/components/kilim';
import { Button, TextLink } from '@/components/ui';
import { anmelden, registrieren } from '@/lib/konto';
import { useApp } from '@/state/app-state';
import { C, F, RADIUS, S } from '@/theme/tokens';

/**
 * Registrieren und Anmelden mit E-Mail und Passwort.
 *
 * Nach dem Anmelden entscheidet der Profilstand, wohin es geht: Wer schon
 * ein Profil hat, landet in der App; wer keins hat, im Onboarding.
 */
export default function Konto() {
  const insets = useSafeAreaInsets();
  const { neu } = useLocalSearchParams<{ neu?: string }>();
  const { profilNeuLaden } = useApp();

  const [registrierung, setRegistrierung] = useState(neu === '1');
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  const absenden = async () => {
    setFehler(null);
    setHinweis(null);
    setLaedt(true);
    try {
      if (registrierung) {
        const { mailBestaetigen } = await registrieren(email.trim(), passwort);
        if (mailBestaetigen) {
          setHinweis(
            'Fast geschafft: Wir haben dir eine E-Mail geschickt. Bestätige sie und melde dich dann hier an.',
          );
          setRegistrierung(false);
          return;
        }
        router.replace('/onboarding');
        return;
      }

      await anmelden(email.trim(), passwort);
      // Profil laden entscheidet, ob das Onboarding noch fehlt
      try {
        await profilNeuLaden();
      } catch {
        // Wenn das Laden scheitert, ist das Onboarding der sichere Weg
      }
      router.replace('/weiche');
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Etwas ist schiefgegangen. Versuch es nochmal.');
    } finally {
      setLaedt(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.inhalt, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + S.xl }]}
        keyboardShouldPersistTaps="handled">
        <Kilim height={12} color={C.terracotta} />
        <Text style={styles.titel}>{registrierung ? 'Konto anlegen' : 'Willkommen zurück'}</Text>
        <Text style={styles.untertitel}>
          {registrierung
            ? 'E-Mail und Passwort genügen. Alles Weitere kommt danach.'
            : 'Melde dich mit deiner E-Mail an.'}
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-Mail"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={styles.eingabe}
          accessibilityLabel="E-Mail"
        />
        <TextInput
          value={passwort}
          onChangeText={setPasswort}
          placeholder="Passwort (mindestens 6 Zeichen)"
          placeholderTextColor={C.muted}
          secureTextEntry
          autoComplete={registrierung ? 'new-password' : 'current-password'}
          style={styles.eingabe}
          accessibilityLabel="Passwort"
        />

        {fehler ? <Text style={styles.fehler}>{fehler}</Text> : null}
        {hinweis ? <Text style={styles.hinweis}>{hinweis}</Text> : null}

        <View style={styles.aktion}>
          {laedt ? (
            <ActivityIndicator color={C.garnet} />
          ) : (
            <Button
              full
              label={registrierung ? 'Konto anlegen' : 'Anmelden'}
              disabled={!email.trim() || passwort.length < 6}
              onPress={absenden}
            />
          )}
        </View>

        <View style={styles.wechsel}>
          <TextLink
            label={registrierung ? 'Ich habe schon ein Konto' : 'Ich bin neu hier — Konto anlegen'}
            onPress={() => {
              setFehler(null);
              setHinweis(null);
              setRegistrierung((r) => !r);
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  inhalt: { paddingHorizontal: S.xl },
  titel: { fontFamily: F.serifMedium, fontSize: 32, color: C.ink, marginTop: S.xl },
  untertitel: { fontFamily: F.sans, fontSize: 13.5, lineHeight: 21, color: C.muted, marginTop: 8 },

  eingabe: {
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

  fehler: { fontFamily: F.sans, fontSize: 13, lineHeight: 20, color: C.garnet, marginTop: S.md },
  hinweis: { fontFamily: F.sans, fontSize: 13, lineHeight: 20, color: C.forest, marginTop: S.md },

  aktion: { marginTop: S.lg, minHeight: 48, justifyContent: 'center' },
  wechsel: { marginTop: S.lg, alignItems: 'center' },
});
