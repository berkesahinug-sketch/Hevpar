import type { ReactNode } from 'react';
import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { C, F, RADIUS } from '@/theme/tokens';

/* ---------------------------------- Chip ---------------------------------- */

type ChipProps = {
  label: string;
  /** Ausgewählt – nur bei anklickbaren Chips relevant */
  active?: boolean;
  onPress?: () => void;
  /** "quiet" = ruhiger Sandton, für reine Anzeige im Profil */
  tone?: 'default' | 'quiet';
  small?: boolean;
  disabled?: boolean;
};

/**
 * Kultur-Chip. Ersetzt in Hevpar die generischen Filter: Dialekt, Region,
 * Stadt und Werte sind eigene Datenfelder, keine Freitext-Tags.
 */
export function Chip({ label, active, onPress, tone = 'default', small, disabled }: ChipProps) {
  const quiet = tone === 'quiet';
  const background = quiet ? C.sand : active ? C.forest : 'transparent';
  const foreground = quiet ? C.forest : active ? C.card : C.ink;
  const border = quiet ? 'transparent' : active ? C.forest : C.line;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!active, disabled: !!disabled } : undefined}
      style={({ pressed }) => [
        styles.chip,
        small && styles.chipSmall,
        { backgroundColor: background, borderColor: border },
        pressed && onPress ? styles.pressed : null,
      ]}>
      <Text style={[styles.chipLabel, small && styles.chipLabelSmall, { color: foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* --------------------------------- Button --------------------------------- */

type ButtonProps = {
  label: string;
  onPress?: () => void;
  /** solid = Granat (Primäraktion), ghost = Umriss, gold = Hervorhebung */
  variant?: 'solid' | 'ghost' | 'gold';
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'solid', disabled, full, style }: ButtonProps) {
  const palette = {
    solid: { bg: C.garnet, fg: C.onDark, bd: C.garnet },
    ghost: { bg: 'transparent', fg: C.ink, bd: C.line },
    gold: { bg: C.gold, fg: C.onGold, bd: C.gold },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.bd },
        full && styles.buttonFull,
        disabled && styles.buttonDisabled,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}>
      <Text style={[styles.buttonLabel, { color: palette.fg }]}>{label}</Text>
    </Pressable>
  );
}

/* -------------------------------- Eyebrow --------------------------------- */

/** Kleine Versalien-Überschrift über Prompts und Abschnitten. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

/* --------------------------- Textlink (schlicht) --------------------------- */

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      {({ pressed }) => (
        <Text style={[styles.textLink, pressed && { opacity: 0.6 }]}>{label}</Text>
      )}
    </Pressable>
  );
}

/* -------------------------------- Schalter -------------------------------- */

type SchalterProps = {
  label: string;
  /** Erklärender Satz unter dem Label. Bei Einwilligungen Pflicht, nicht Kür. */
  hinweis?: string;
  an: boolean;
  onChange: (an: boolean) => void;
};

/**
 * Ein-/Aus-Schalter für Einwilligungen und Sichtbarkeit.
 *
 * Bewusst als eigene Zeile mit Erklärtext: Eine Einwilligung nach DSGVO muss
 * verständlich sein und darf nicht in einer Sammelzustimmung untergehen.
 */
export function Schalter({ label, hinweis, an, onChange }: SchalterProps) {
  return (
    <Pressable
      onPress={() => onChange(!an)}
      accessibilityRole="switch"
      accessibilityState={{ checked: an }}
      accessibilityLabel={label}
      accessibilityHint={hinweis}
      style={({ pressed }) => [styles.schalterZeile, pressed && { opacity: 0.75 }]}>
      <View style={styles.schalterText}>
        <Text style={styles.schalterLabel}>{label}</Text>
        {hinweis ? <Text style={styles.schalterHinweis}>{hinweis}</Text> : null}
      </View>
      <View style={[styles.schalterSpur, { backgroundColor: an ? C.forest : C.line }]}>
        <View style={[styles.schalterKnopf, an ? styles.knopfRechts : styles.knopfLinks]} />
      </View>
    </Pressable>
  );
}

/* ------------------------------ Abschnittsbox ------------------------------ */

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.chip,
    borderWidth: 1,
  },
  chipSmall: { paddingVertical: 5, paddingHorizontal: 10 },
  chipLabel: { fontFamily: F.sans, fontSize: 13, letterSpacing: 0.1, lineHeight: 17 },
  chipLabelSmall: { fontSize: 11.5, lineHeight: 15 },

  button: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: { alignSelf: 'stretch' },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { fontFamily: F.sansMedium, fontSize: 14.5 },

  pressed: { opacity: 0.82 },

  eyebrow: {
    fontFamily: F.sans,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: C.muted,
    marginBottom: 8,
  },

  textLink: {
    fontFamily: F.sans,
    fontSize: 12.5,
    color: C.forest,
    textDecorationLine: 'underline',
  },

  row: { flexDirection: 'row', alignItems: 'center' },

  schalterZeile: {
    flexDirection: 'row',
    // Oben ausgerichtet: bei langen Erklärtexten säße der Schalter sonst
    // irgendwo in der Mitte des Absatzes und wirkte lose.
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  schalterText: { flex: 1 },
  schalterLabel: { fontFamily: F.sans, fontSize: 14, color: C.ink, lineHeight: 20 },
  schalterHinweis: {
    fontFamily: F.sans,
    fontSize: 12,
    lineHeight: 18,
    color: C.muted,
    marginTop: 3,
  },
  schalterSpur: {
    marginTop: 2,
    width: 40,
    height: 23,
    borderRadius: RADIUS.chip,
    padding: 3,
    justifyContent: 'center',
  },
  schalterKnopf: { width: 17, height: 17, borderRadius: RADIUS.chip, backgroundColor: C.card },
  knopfLinks: { alignSelf: 'flex-start' },
  knopfRechts: { alignSelf: 'flex-end' },
});
