import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Kilim } from '@/components/kilim';
import { C, F } from '@/theme/tokens';

/**
 * Die untere Navigationsleiste.
 *
 * Statt Icons markiert ein kurzes Kilim-Band den aktiven Bereich. Das ist der
 * dritte und letzte Ort, an dem das Zickzack auftaucht – und auch hier trägt es
 * Information: Es zeigt, wo man ist.
 */
export function KilimTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.leiste, { paddingBottom: insets.bottom + 12 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : (options.title ?? route.name);
        const aktiv = state.index === index;

        const oeffnen = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!aktiv && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={oeffnen}
            accessibilityRole="button"
            accessibilityState={{ selected: aktiv }}
            accessibilityLabel={label}
            style={styles.knopf}>
            <View style={styles.marker}>
              <Kilim height={7} dense color={aktiv ? C.terracotta : C.muted} opacity={aktiv ? 1 : 0.25} />
            </View>
            <Text style={[styles.label, aktiv ? styles.labelAktiv : null]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  leiste: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 10,
  },
  knopf: { flex: 1, alignItems: 'center', gap: 5 },
  marker: { width: 22 },
  label: { fontFamily: F.sans, fontSize: 11, letterSpacing: 0.2, color: C.muted },
  labelAktiv: { fontFamily: F.sansSemi, color: C.garnet },
});
