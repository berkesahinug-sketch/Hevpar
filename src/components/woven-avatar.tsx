import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { C } from '@/theme/tokens';

type Props = {
  /** Stabiler Schlüssel, z. B. die Profil-ID. Gleicher Seed = gleiches Muster. */
  seed: string;
  size?: number;
  radius?: number;
};

/**
 * Der Avatar vor dem Match: ein aus der Profil-ID errechnetes Kilim-Muster.
 *
 * Bewusst kein unscharfes Foto. Ein verwaschenes Bild ist ein Versprechen auf
 * ein Foto und lädt zum Erraten ein; ein gewebtes Muster ist eine eigene,
 * erkennbare Identität. Aus demselben Grund liegt kein Buchstabe darüber: Das
 * Muster selbst ist das Erkennungszeichen, der Name steht daneben.
 *
 * Das Muster ist deterministisch – dieselbe Person hat auf jedem Gerät
 * dasselbe Bild.
 */
export function WovenAvatar({ seed, size = 96, radius = 14 }: Props) {
  const tiles = useMemo(() => {
    const rnd = seeded(seed);
    const palette = [C.garnet, C.terracotta, C.gold, C.forest, '#D8C7A4'];
    return Array.from({ length: 36 }, () => ({
      color: palette[Math.floor(rnd() * palette.length)],
      shape: Math.floor(rnd() * 4),
    }));
  }, [seed]);

  return (
    <View
      style={[
        styles.frame,
        { width: size, height: size, borderRadius: radius },
      ]}>
      <Svg width={size} height={size} viewBox="0 0 60 60">
        {tiles.map((tile, i) => {
          const x = (i % 6) * 10;
          const y = Math.floor(i / 6) * 10;
          return <Path key={i} d={tilePath(x, y, tile.shape)} fill={tile.color} opacity={0.92} />;
        })}
      </Svg>
    </View>
  );
}

/** Eine von vier gewebten Grundformen, je 10x10 groß. */
function tilePath(x: number, y: number, shape: number) {
  switch (shape) {
    case 0:
      return `M${x} ${y} L${x + 10} ${y} L${x + 5} ${y + 10} Z`;
    case 1:
      return `M${x} ${y + 10} L${x + 5} ${y} L${x + 10} ${y + 10} Z`;
    case 2:
      return `M${x} ${y} L${x + 10} ${y + 5} L${x} ${y + 10} Z`;
    default:
      return `M${x} ${y} L${x + 10} ${y} L${x + 10} ${y + 10} Z`;
  }
}

/**
 * Kleiner deterministischer Zufallsgenerator.
 * Erst wird der Seed zu einer Zahl gehasht (FNV-1a), dann liefert ein linearer
 * Kongruenzgenerator daraus die Folge. Ähnliche Namen ergeben so trotzdem
 * deutlich verschiedene Muster.
 */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 4294967296;
  };
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: C.card,
  },
});
