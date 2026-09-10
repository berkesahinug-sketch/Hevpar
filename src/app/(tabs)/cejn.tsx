import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Erscheinen } from '@/components/erscheinen';
import { Kilim } from '@/components/kilim';
import { Button, Chip, Eyebrow } from '@/components/ui';
import { WovenAvatar } from '@/components/woven-avatar';
import { datumKurz, istHeute, EVENTS, type CommunityEvent } from '@/data/events';
import { woerterFuer } from '@/data/sprache';
import { impuls, tick } from '@/lib/haptik';
import { useApp } from '@/state/app-state';
import { C, F, RADIUS, S } from '@/theme/tokens';

/**
 * Der Event-Bereich: wo die Community gerade zusammenkommt.
 *
 * Kein Ticket-Verkauf, kein Kommentarbereich – nur drei Dinge: sehen, was
 * wo stattfindet; leise zusagen; und jemanden aus den eigenen Matches
 * mitnehmen. Die Einladung landet als Nachricht im Chat, denn dort gehört
 * sie hin – ein Event ist ein Vorschlag für ein erstes Treffen an einem
 * Ort, an dem man sich nicht allein verabreden muss.
 */
export default function Cejn() {
  const insets = useSafeAreaInsets();
  const { profil, threads, zusagen, toggleZusage, antworte } = useApp();
  const woerter = woerterFuer(profil.dialekt);

  const [einladungFuer, setEinladungFuer] = useState<CommunityEvent | null>(null);

  const heute = EVENTS.filter((e) => istHeute(e.datum));
  const sortiert = [...EVENTS].sort((a, b) => a.datum.getTime() - b.datum.getTime());

  const einladen = (event: CommunityEvent) => {
    if (threads.length === 0) {
      Alert.alert(
        'Noch niemand zum Einladen',
        'Einladungen gehen an deine Matches. Schick erst ein ' +
          woerter.silav +
          ' — danach kannst du jemanden mitnehmen.',
      );
      return;
    }
    setEinladungFuer(event);
  };

  const einladungSenden = (threadId: string) => {
    if (!einladungFuer) return;
    const e = einladungFuer;
    impuls();
    antworte(
      threadId,
      `Kommst du mit? ${e.titel} — ${datumKurz(e.datum)}, ${e.ort}, ${e.stadt}.`,
    );
    setEinladungFuer(null);
    router.push(`/chat/${threadId}`);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.inhalt, { paddingTop: insets.top + S.lg }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.titel}>{woerter.cejn}</Text>
        <Text style={styles.untertitel}>
          Wo die Community gerade zusammenkommt. Zusagen sieht niemand außer dir — nur die Zahl
          zählt hoch.
        </Text>

        {heute.length > 0 ? (
          <Erscheinen>
            <View style={styles.heute}>
              <Kilim height={9} color={C.gold} />
              <Text style={styles.heuteText}>
                Îşev · Heute: {heute[0].titel} in {heute[0].stadt}
              </Text>
            </View>
          </Erscheinen>
        ) : null}

        <View style={styles.liste}>
          {sortiert.map((event, i) => {
            const zugesagt = zusagen.includes(event.id);
            return (
              <Erscheinen key={event.id} index={i}>
                <View style={styles.karte}>
                  <View style={styles.kopfzeile}>
                    <Chip label={event.typ} tone="quiet" small />
                    <Text style={styles.datum}>{datumKurz(event.datum)}</Text>
                  </View>

                  <Text style={styles.eventTitel}>{event.titel}</Text>
                  <Text style={styles.eventText}>{event.untertitel}</Text>
                  <Text style={styles.ort}>
                    {event.ort} · {event.stadt}
                  </Text>

                  <View style={styles.fusszeile}>
                    <Text style={styles.zahl}>
                      {event.zusagenBasis + (zugesagt ? 1 : 0)} aus der Community sind dabei
                    </Text>
                  </View>

                  <View style={styles.aktionen}>
                    <View style={styles.aktion}>
                      <Button
                        full
                        variant={zugesagt ? 'solid' : 'ghost'}
                        label={zugesagt ? `${woerter.ezTem} ✓` : woerter.ezTem}
                        onPress={() => {
                          tick();
                          toggleZusage(event.id);
                        }}
                      />
                    </View>
                    <View style={styles.aktion}>
                      <Button full variant="gold" label="Einladen" onPress={() => einladen(event)} />
                    </View>
                  </View>
                </View>
              </Erscheinen>
            );
          })}
        </View>

        <Text style={styles.hinweisUnten}>
          Du organisierst selbst etwas? Schreib uns — Events werden geprüft, bevor sie hier
          erscheinen.
        </Text>
      </ScrollView>

      {/* Auswahl, wer eingeladen wird */}
      <Modal
        visible={!!einladungFuer}
        transparent
        animationType="slide"
        onRequestClose={() => setEinladungFuer(null)}>
        <View style={styles.modalFuellung}>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.abdunkeln]}
            onPress={() => setEinladungFuer(null)}
            accessibilityLabel="Schließen"
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + S.xl }]}>
            <Kilim height={10} color={C.terracotta} />
            <Eyebrow>Wen nimmst du mit?</Eyebrow>
            {threads.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => einladungSenden(t.id)}
                accessibilityRole="button"
                accessibilityLabel={`${t.name} einladen`}
                style={({ pressed }) => [styles.matchZeile, pressed && { opacity: 0.7 }]}>
                <WovenAvatar seed={t.id} size={44} radius={11} />
                <View style={styles.matchText}>
                  <Text style={styles.matchName}>{t.name}</Text>
                  <Text style={styles.matchStadt}>{t.stadt}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  inhalt: { paddingHorizontal: S.lg, paddingBottom: 110 },
  titel: { fontFamily: F.serifMedium, fontSize: 26, color: C.ink },
  untertitel: { fontFamily: F.sans, fontSize: 13, lineHeight: 20, color: C.muted, marginTop: 6 },

  heute: {
    backgroundColor: C.forest,
    borderRadius: 12,
    padding: S.md,
    marginTop: S.lg,
  },
  heuteText: { fontFamily: F.serif, fontSize: 16, color: C.onDark, marginTop: 10 },

  liste: { marginTop: S.lg, gap: S.md },
  karte: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: RADIUS.card,
    padding: S.lg,
  },
  kopfzeile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  datum: { fontFamily: F.sansMedium, fontSize: 12.5, color: C.terracotta },
  eventTitel: { fontFamily: F.serifMedium, fontSize: 21, color: C.ink, marginTop: 10 },
  eventText: { fontFamily: F.sans, fontSize: 13.5, lineHeight: 20, color: C.ink, marginTop: 4 },
  ort: { fontFamily: F.sans, fontSize: 12.5, color: C.muted, marginTop: 6 },

  fusszeile: { marginTop: 10 },
  zahl: { fontFamily: F.sans, fontSize: 12.5, color: C.forest },

  aktionen: { flexDirection: 'row', gap: 10, marginTop: S.md },
  aktion: { flex: 1 },

  hinweisUnten: {
    fontFamily: F.sans,
    fontSize: 12,
    lineHeight: 18,
    color: C.muted,
    marginTop: S.xl,
  },

  modalFuellung: { flex: 1, justifyContent: 'flex-end' },
  abdunkeln: { backgroundColor: 'rgba(25,27,23,0.42)' },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingHorizontal: 20,
    paddingTop: S.lg,
    gap: 4,
  },
  matchZeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  matchText: { flex: 1 },
  matchName: { fontFamily: F.serif, fontSize: 17, color: C.ink },
  matchStadt: { fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 1 },
});
