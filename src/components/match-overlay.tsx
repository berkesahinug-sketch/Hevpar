import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Kilim } from '@/components/kilim';
import { Button } from '@/components/ui';
import { WovenAvatar } from '@/components/woven-avatar';
import type { Profil } from '@/data/demo-profile';
import { C, F, S } from '@/theme/tokens';

type Props = {
  match: Profil | null;
  onSchliessen: () => void;
  onChat: () => void;
};

/**
 * Der Match-Screen. Der einzige Ort, an dem die App ganzflächig waldgrün wird –
 * dadurch ist der Moment ohne Konfetti oder Animation unverwechselbar.
 *
 * "Hûn li hev hatin" heißt: Ihr seid zueinander gekommen.
 */
export function MatchOverlay({ match, onSchliessen, onChat }: Props) {
  return (
    <Modal visible={!!match} animationType="fade" onRequestClose={onSchliessen} statusBarTranslucent>
      {match ? (
        <View style={styles.flaeche}>
          <View style={styles.band}>
            <Kilim height={14} color={C.gold} />
          </View>

          <View style={styles.avatare}>
            {/* Vor dem Match Muster, ab jetzt kämen hier die echten Fotos */}
            <WovenAvatar seed="berke" size={78} radius={16} />
            <WovenAvatar seed={match.id} size={78} radius={16} />
          </View>

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

  aktionen: { marginTop: S.xl, gap: 10, width: '100%', maxWidth: 260, alignItems: 'center' },
  spaeter: { fontFamily: F.sans, fontSize: 13.5, color: C.onDarkMuted, paddingVertical: 4 },
});
