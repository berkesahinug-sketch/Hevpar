import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Kilim } from '@/components/kilim';
import { Chip, Eyebrow } from '@/components/ui';
import { WovenAvatar } from '@/components/woven-avatar';
import type { Profil, Prompt } from '@/data/demo-profile';
import { woerterFuer } from '@/data/sprache';
import { useApp } from '@/state/app-state';
import { C, F, RADIUS, S } from '@/theme/tokens';

type Props = {
  profil: Profil;
  onSilav: (profil: Profil, prompt: Prompt) => void;
};

/**
 * Eine Profilkarte.
 *
 * Es gibt bewusst keinen Knopf, der das ganze Profil liked. Ein Silav geht
 * immer an eine einzelne Prompt-Antwort. Das erzeugt Reibung und kostet
 * Kontakte – genau das ist beabsichtigt: weniger Kontakte, höhere Qualität.
 */
export function ProfileCard({ profil, onSilav }: Props) {
  const { profil: ich } = useApp();
  const woerter = woerterFuer(ich.dialekt);

  return (
    <View style={styles.karte}>
      <View style={styles.kopf}>
        <WovenAvatar seed={profil.id} size={74} />

        <View style={styles.kopfText}>
          <Text style={styles.name}>
            {profil.name}, {profil.alter}
          </Text>
          <Text style={styles.meta}>{profil.stadt} · Foto nach dem Match</Text>

          <View style={styles.chips}>
            {profil.chips.map((chip) => (
              <Chip key={chip} label={chip} tone="quiet" small />
            ))}
          </View>
        </View>
      </View>

      {/* Trenner zwischen Kopf und Prompts */}
      <View style={styles.trenner}>
        <Kilim height={9} color={C.line} opacity={1} />
      </View>

      <View style={styles.prompts}>
        {profil.prompts.map((prompt) => (
          <View key={prompt.frage} style={styles.prompt}>
            <Eyebrow>{prompt.frage}</Eyebrow>
            <Text style={styles.antwort}>{prompt.antwort}</Text>

            <Pressable
              onPress={() => onSilav(profil, prompt)}
              accessibilityRole="button"
              accessibilityLabel={`${woerter.silav} an ${profil.name} zur Antwort auf ${prompt.frage}`}
              style={({ pressed }) => [styles.silav, pressed && { opacity: 0.7 }]}>
              <Text style={styles.silavText}>{woerter.silav} zu dieser Antwort</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  karte: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: S.lg,
  },

  kopf: { flexDirection: 'row', gap: S.md, alignItems: 'flex-start', padding: S.lg, paddingBottom: 0 },
  kopfText: { flex: 1 },
  name: { fontFamily: F.serif, fontSize: 24, lineHeight: 27, color: C.ink },
  meta: { fontFamily: F.sans, fontSize: 12.5, color: C.muted, marginTop: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 10 },

  trenner: { paddingHorizontal: S.lg, paddingTop: S.lg },

  prompts: { paddingHorizontal: S.lg, paddingBottom: S.lg },
  prompt: { paddingTop: S.lg },
  antwort: { fontFamily: F.serif, fontSize: 17.5, lineHeight: 25, color: C.ink },
  silav: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: RADIUS.chip,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  silavText: { fontFamily: F.sans, fontSize: 12.5, color: C.garnet },
});
