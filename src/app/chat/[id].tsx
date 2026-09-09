import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Eyebrow } from '@/components/ui';
import { WovenAvatar } from '@/components/woven-avatar';
import { useApp } from '@/state/app-state';
import { C, F, RADIUS, S } from '@/theme/tokens';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { threads, antworte, alsGelesen } = useApp();
  const [text, setText] = useState('');

  const thread = threads.find((t) => t.id === id);

  useEffect(() => {
    if (id) alsGelesen(id);
  }, [id, alsGelesen, thread?.nachrichten.length]);

  if (!thread) {
    return (
      <View style={[styles.screen, styles.fehlend, { paddingTop: insets.top + S.xxl }]}>
        <Text style={styles.fehlendText}>Diese Unterhaltung gibt es nicht mehr.</Text>
        <Button label="Zurück" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const senden = () => {
    const sauber = text.trim();
    if (!sauber) return;
    antworte(thread.id, sauber);
    setText('');
  };

  const meldenFragen = () => {
    Alert.alert(`${thread.name} melden oder blockieren?`, 'Was möchtest du tun?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Blockieren',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Blockieren',
            'Wird mit der Moderation gebaut (Schritt 6). Danach siehst du diese Person nicht mehr und sie dich nicht.',
          ),
      },
      {
        text: 'Melden',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Melden',
            'Wird mit der Moderation gebaut (Schritt 6). Jede Meldung wird von Menschen geprüft und beantwortet.',
          ),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Kopfzeile */}
      <View style={[styles.kopf, { paddingTop: insets.top + S.md }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Zurück"
          hitSlop={10}>
          <Text style={styles.zurueck}>‹</Text>
        </Pressable>

        <WovenAvatar seed={thread.id} size={38} radius={10} />

        <View style={styles.kopfText}>
          <Text style={styles.name}>{thread.name}</Text>
          <Text style={styles.meta}>
            {thread.verifiziert ? 'Verifiziert · ' : ''}
            {thread.stadt}
          </Text>
        </View>

        {/* Melden und Blockieren müssen aus jeder Unterhaltung erreichbar sein */}
        <Pressable
          onPress={meldenFragen}
          accessibilityRole="button"
          accessibilityLabel="Melden oder blockieren"
          hitSlop={10}>
          <Text style={styles.melden}>Melden</Text>
        </Pressable>
      </View>

      {/*
        Die zitierte Prompt-Antwort steht fest über dem Verlauf und scrollt
        nicht weg. Man soll jederzeit sehen, worauf dieses Gespräch antwortet.
      */}
      <View style={styles.kontext}>
        <Eyebrow>{thread.kontext.frage}</Eyebrow>
        <Text style={styles.kontextText}>{thread.kontext.antwort}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.verlauf} showsVerticalScrollIndicator={false}>
        {thread.nachrichten.map((nachricht, i) => (
          <View
            key={i}
            style={[styles.blase, nachricht.vonMir ? styles.blaseRechts : styles.blaseLinks]}>
            <Text style={nachricht.vonMir ? styles.textMeins : styles.textAndere}>
              {nachricht.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.eingabeZeile, { paddingBottom: insets.bottom + S.md }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={senden}
          placeholder="Nachricht"
          placeholderTextColor={C.muted}
          style={styles.eingabe}
          accessibilityLabel="Nachricht schreiben"
          returnKeyType="send"
        />
        <Button label="Senden" disabled={!text.trim()} onPress={senden} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },

  fehlend: { paddingHorizontal: S.lg, gap: S.lg, alignItems: 'flex-start' },
  fehlendText: { fontFamily: F.sans, fontSize: 14, color: C.muted },

  kopf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: S.lg,
    paddingBottom: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    backgroundColor: C.card,
  },
  zurueck: { fontFamily: F.sans, fontSize: 26, lineHeight: 30, color: C.ink },
  kopfText: { flex: 1 },
  name: { fontFamily: F.serif, fontSize: 18, lineHeight: 21, color: C.ink },
  meta: { fontFamily: F.sans, fontSize: 11.5, color: C.muted },
  melden: { fontFamily: F.sans, fontSize: 12.5, color: C.garnet },

  kontext: {
    backgroundColor: C.sand,
    marginHorizontal: S.lg,
    marginTop: S.lg,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: S.md,
  },
  kontextText: { fontFamily: F.serif, fontSize: 15.5, lineHeight: 22, color: C.ink },

  verlauf: { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.sm },
  blase: { maxWidth: '78%', paddingVertical: 10, paddingHorizontal: 13, borderRadius: 14, marginBottom: 9 },
  blaseLinks: {
    alignSelf: 'flex-start',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
  },
  blaseRechts: { alignSelf: 'flex-end', backgroundColor: C.garnet },
  textMeins: { fontFamily: F.sans, fontSize: 14, lineHeight: 21, color: C.onDark },
  textAndere: { fontFamily: F.sans, fontSize: 14, lineHeight: 21, color: C.ink },

  eingabeZeile: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: S.md,
    borderTopWidth: 1,
    borderTopColor: C.line,
    backgroundColor: C.card,
  },
  eingabe: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    fontFamily: F.sans,
    fontSize: 14,
    color: C.ink,
  },
});
