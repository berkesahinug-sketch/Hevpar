import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Kilim } from '@/components/kilim';
import { SilavSheet } from '@/components/silav-sheet';
import { Eyebrow } from '@/components/ui';
import { WovenAvatar } from '@/components/woven-avatar';
import type { EingehendesSilav } from '@/lib/begegnungen';
import { impuls } from '@/lib/haptik';
import { useApp } from '@/state/app-state';
import { C, F, RADIUS, S } from '@/theme/tokens';

export default function Nachrichten() {
  const insets = useSafeAreaInsets();
  const { threads, silavEingang, beantworteSilav } = useApp();
  const [antwortAuf, setAntwortAuf] = useState<EingehendesSilav | null>(null);

  const antwortSenden = async (text: string) => {
    if (!antwortAuf) return;
    const eingang = antwortAuf;
    setAntwortAuf(null);
    impuls();
    try {
      await beantworteSilav(eingang, text);
    } catch (e) {
      Alert.alert('Das hat nicht geklappt', e instanceof Error ? e.message : 'Unbekannter Fehler.');
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.inhalt, { paddingTop: insets.top + S.lg }]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.titel}>Nachrichten</Text>

      {silavEingang.length > 0 ? (
        <View style={styles.eingang}>
          <Eyebrow>Silavs an dich</Eyebrow>
          {silavEingang.map((s) => (
            <View key={s.von} style={styles.eingangKarte}>
              <View style={styles.eingangKopf}>
                <WovenAvatar seed={s.von} size={44} radius={11} />
                <View style={styles.eingangText}>
                  <Text style={styles.eingangName}>
                    {s.name}
                    {s.stadt ? `, ${s.stadt}` : ''}
                  </Text>
                  <Text style={styles.eingangZitat}>auf „{s.zitat}“</Text>
                </View>
              </View>
              <Text style={styles.eingangNachricht}>{s.text}</Text>
              <Pressable
                onPress={() => setAntwortAuf(s)}
                accessibilityRole="button"
                accessibilityLabel={`${s.name} antworten`}
                style={({ pressed }) => [styles.eingangKnopf, pressed && { opacity: 0.7 }]}>
                <Text style={styles.eingangKnopfText}>Antworten — daraus wird euer Match</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {threads.length === 0 && silavEingang.length === 0 ? (
        <View style={styles.leer}>
          <Kilim height={10} color={C.line} opacity={1} />
          <Text style={styles.leerText}>
            Noch keine Unterhaltung. Schick jemandem ein Silav zu einer Antwort, die dir aufgefallen
            ist — das ist hier der einzige Weg, ein Gespräch zu starten.
          </Text>
        </View>
      ) : null}

      {threads.length > 0 && (
        <View style={styles.liste}>
          {threads.map((thread) => {
            const letzte = thread.nachrichten[thread.nachrichten.length - 1];
            return (
              <Pressable
                key={thread.id}
                onPress={() => router.push(`/chat/${thread.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Unterhaltung mit ${thread.name}`}
                style={({ pressed }) => [styles.zeile, pressed && { opacity: 0.7 }]}>
                <WovenAvatar seed={thread.id} size={50} radius={12} />
                <View style={styles.zeileText}>
                  <Text style={styles.name}>{thread.name}</Text>
                  <Text
                    style={[styles.vorschau, thread.ungelesen && styles.vorschauNeu]}
                    numberOfLines={1}>
                    {letzte?.text ?? ''}
                  </Text>
                </View>
                {thread.ungelesen ? <View style={styles.punkt} /> : null}
              </Pressable>
            );
          })}
        </View>
      )}

      <SilavSheet
        ziel={
          antwortAuf
            ? {
                profil: {
                  id: antwortAuf.von,
                  name: antwortAuf.name,
                  alter: 0,
                  stadt: antwortAuf.stadt,
                  verifiziert: true,
                  chips: [],
                  prompts: [],
                },
                prompt: { frage: antwortAuf.frage, antwort: antwortAuf.zitat },
              }
            : null
        }
        onSchliessen={() => setAntwortAuf(null)}
        onSenden={antwortSenden}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  inhalt: { paddingHorizontal: S.lg, paddingBottom: 110 },
  titel: { fontFamily: F.serifMedium, fontSize: 26, color: C.ink },

  leer: { marginTop: 22 },
  leerText: { fontFamily: F.sans, fontSize: 13.5, lineHeight: 22, color: C.muted, marginTop: S.md },

  liste: { marginTop: S.lg },
  zeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  zeileText: { flex: 1, minWidth: 0 },
  name: { fontFamily: F.serif, fontSize: 18, color: C.ink },
  vorschau: { fontFamily: F.sans, fontSize: 13, color: C.muted, marginTop: 2 },
  vorschauNeu: { fontFamily: F.sansSemi, color: C.ink },
  punkt: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold },

  eingang: { marginTop: S.lg },
  eingangKarte: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.gold,
    borderRadius: RADIUS.card,
    padding: S.md,
    marginTop: 8,
  },
  eingangKopf: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eingangText: { flex: 1 },
  eingangName: { fontFamily: F.serif, fontSize: 17, color: C.ink },
  eingangZitat: { fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 2 },
  eingangNachricht: { fontFamily: F.serif, fontSize: 15.5, lineHeight: 22, color: C.ink, marginTop: 10 },
  eingangKnopf: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: RADIUS.chip,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  eingangKnopfText: { fontFamily: F.sans, fontSize: 12.5, color: C.garnet },
});
