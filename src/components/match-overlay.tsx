import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Kilim } from '@/components/kilim';
import { Button } from '@/components/ui';
import { WovenAvatar } from '@/components/woven-avatar';
import type { Profil } from '@/data/demo-profile';
import { erfolg } from '@/lib/haptik';
import { C, F, S } from '@/theme/tokens';

type Props = {
  match: Profil | null;
  onSchliessen: () => void;
  onChat: () => void;
};

/**
 * Der Match-Screen. Der einzige Ort, an dem die App ganzflächig waldgrün wird.
 *
 * Der Moment baut sich in drei Schlägen auf: Das goldene Band zieht sich auf,
 * die beiden Muster kommen von außen zusammen, dann erst der Satz. Kein
 * Konfetti – die Choreografie selbst ist die Feier.
 *
 * "Hûn li hev hatin" heißt: Ihr seid zueinander gekommen.
 */
export function MatchOverlay({ match, onSchliessen, onChat }: Props) {
  const band = useRef(new Animated.Value(0)).current;
  const avatare = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!match) return;
    band.setValue(0);
    avatare.setValue(0);
    text.setValue(0);
    erfolg();
    Animated.sequence([
      Animated.timing(band, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(avatare, { toValue: 1, useNativeDriver: true, speed: 9, bounciness: 9 }),
      Animated.timing(text, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [match, band, avatare, text]);

  return (
    <Modal visible={!!match} animationType="fade" onRequestClose={onSchliessen} statusBarTranslucent>
      {match ? (
        <View style={styles.flaeche}>
          <Animated.View style={[styles.band, { transform: [{ scaleX: band }] }]}>
            <Kilim height={14} color={C.gold} />
          </Animated.View>

          <View style={styles.avatare}>
            <Animated.View
              style={{
                opacity: avatare,
                transform: [
                  { translateX: avatare.interpolate({ inputRange: [0, 1], outputRange: [-48, 0] }) },
                ],
              }}>
              <WovenAvatar seed="berke" size={78} radius={16} />
            </Animated.View>
            <Animated.View
              style={{
                opacity: avatare,
                transform: [
                  { translateX: avatare.interpolate({ inputRange: [0, 1], outputRange: [48, 0] }) },
                ],
              }}>
              <WovenAvatar seed={match.id} size={78} radius={16} />
            </Animated.View>
          </View>

          <Animated.View
            style={{
              alignItems: 'center',
              opacity: text,
              transform: [
                { translateY: text.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
              ],
            }}>
            <Text style={styles.titel}>Hûn li hev hatin</Text>
            <Text style={styles.text}>
              Du und {match.name} habt euch beide gemeldet. Ab jetzt seht ihr eure Fotos.
            </Text>

            <View style={styles.aktionen}>
              <Button full variant="gold" label="Schreiben" onPress={onChat} />
              <Pressable onPress={onSchliessen} accessibilityRole="button" hitSlop={8}>
                {({ pressed }) => (
                  <Text style={[styles.spaeter, pressed && { opacity: 0.6 }]}>Später</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flaeche: {
    flex: 1,
    backgroundColor: C.forest,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  band: { width: 160, marginBottom: S.xl },
  avatare: { flexDirection: 'row', gap: S.md },

  titel: {
    fontFamily: F.serifMedium,
    fontSize: 32,
    lineHeight: 38,
    color: C.onDark,
    marginTop: S.xl,
    textAlign: 'center',
  },
  text: {
    fontFamily: F.sans,
    fontSize: 14,
    lineHeight: 22,
    color: C.onDarkMuted,
    marginTop: S.sm,
    maxWidth: 260,
    textAlign: 'center',
  },

  aktionen: { marginTop: S.xl, gap: 10, width: 260, alignItems: 'center' },
  spaeter: { fontFamily: F.sans, fontSize: 13.5, color: C.onDarkMuted, paddingVertical: 4 },
});
