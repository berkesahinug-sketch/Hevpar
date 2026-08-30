import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Kilim } from '@/components/kilim';
import { WovenAvatar } from '@/components/woven-avatar';
import { useApp } from '@/state/app-state';
import { C, F, S } from '@/theme/tokens';

export default function Nachrichten() {
  const insets = useSafeAreaInsets();
  const { threads } = useApp();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.inhalt, { paddingTop: insets.top + S.lg }]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.titel}>Nachrichten</Text>

      {threads.length === 0 ? (
        <View style={styles.leer}>
          <Kilim height={10} color={C.line} opacity={1} />
          <Text style={styles.leerText}>
            Noch keine Unterhaltung. Schick jemandem ein Silav zu einer Antwort, die dir aufgefallen
            ist — das ist hier der einzige Weg, ein Gespräch zu starten.
          </Text>
        </View>
      ) : (
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
                  <Text style={styles.vorschau} numberOfLines={1}>
                    {letzte?.text ?? ''}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
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
});
