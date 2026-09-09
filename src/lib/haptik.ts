import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Spürbares Feedback an den wichtigen Stellen.
 *
 * Sparsam eingesetzt: Auswahl bestätigen, Silav senden, Match. Nicht bei jedem
 * Scrollen oder Tippen – sonst stumpft es ab und nervt. Im Browser passiert
 * nichts, Haptik gibt es nur auf dem Gerät.
 */

const amGeraet = Platform.OS === 'ios' || Platform.OS === 'android';

/** Kurzes Ticken – ein Chip wurde gewählt, ein Schalter umgelegt. */
export function tick() {
  if (amGeraet) Haptics.selectionAsync().catch(() => {});
}

/** Deutlicher Impuls – ein Silav geht raus. */
export function impuls() {
  if (amGeraet) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Erfolgsmoment – der Match. */
export function erfolg() {
  if (amGeraet) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
