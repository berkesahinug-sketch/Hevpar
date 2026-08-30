import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Kilim } from '@/components/kilim';
import { Button } from '@/components/ui';
import type { Profil, Prompt } from '@/data/demo-profile';
import { C, F, RADIUS, S } from '@/theme/tokens';

type Props = {
  ziel: { profil: Profil; prompt: Prompt } | null;
  onSchliessen: () => void;
  onSenden: (text: string) => void;
};

/**
 * Das Silav-Fenster.
 *
 * Die zitierte Prompt-Antwort steht oben und bleibt stehen. Man antwortet auf
 * einen konkreten Satz, nicht auf ein Gesicht. Ohne Text kein Senden – ein
 * leeres Silav gibt es nicht.
 */
export function SilavSheet({ ziel, onSchliessen, onSenden }: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const schliessen = () => {
    setText('');
    onSchliessen();
  };

  const senden = () => {
    const sauber = text.trim();
    if (!sauber) return;
    setText('');
    onSenden(sauber);
  };

  return (
    <Modal
      visible={!!ziel}
      animationType="slide"
      transparent
      onRequestClose={schliessen}
      statusBarTranslucent>
      {ziel ? (
        <KeyboardAvoidingView
          style={styles.fuellung}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Klick auf den abgedunkelten Bereich schließt das Fenster */}
          <Pressable
            style={[StyleSheet.absoluteFill, styles.abdunkeln]}
            onPress={schliessen}
            accessibilityLabel="Schließen"
          />

          <View style={[styles.sheet, { paddingBottom: insets.bottom + S.xl }]}>
            <Kilim height={10} color={C.terracotta} />

            <Text style={styles.anrede}>Du antwortest {ziel.profil.name} auf</Text>
            <Text style={styles.zitat}>„{ziel.prompt.antwort}“</Text>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Schreib etwas, das nur du schreiben würdest."
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={3}
              style={styles.eingabe}
              accessibilityLabel="Deine Nachricht"
            />

            <View style={styles.aktionen}>
              <Button variant="ghost" label="Abbrechen" onPress={schliessen} />
              <Button
                style={styles.senden}
                label="Silav senden"
                disabled={!text.trim()}
                onPress={senden}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fuellung: { flex: 1, justifyContent: 'flex-end' },
  abdunkeln: { backgroundColor: 'rgba(25,27,23,0.42)' },

  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingHorizontal: 20,
    paddingTop: S.lg,
  },
  anrede: { fontFamily: F.sans, fontSize: 12.5, color: C.muted, marginTop: S.md },
  zitat: { fontFamily: F.serif, fontSize: 16, lineHeight: 22, color: C.ink, marginTop: 6 },

  eingabe: {
    marginTop: S.md,
    padding: 12,
    minHeight: 84,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    fontFamily: F.sans,
    fontSize: 14,
    lineHeight: 20,
    color: C.ink,
    textAlignVertical: 'top',
  },

  aktionen: { flexDirection: 'row', gap: 10, marginTop: 12 },
  senden: { flex: 1 },
});
