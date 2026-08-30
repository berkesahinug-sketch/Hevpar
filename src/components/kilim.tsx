import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { C } from '@/theme/tokens';

type Props = {
  /** Höhe des Bandes in Punkten */
  height?: number;
  color?: string;
  opacity?: number;
  /** Engere Zacken – für kleine Flächen wie Navigationsmarker */
  dense?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Das Kilim-Zickzack. Einziges traditionelles Element der App und immer
 * strukturtragend: Fortschritt im Onboarding, Trenner in Profilkarten,
 * Marker in der Navigation. Nie reine Deko.
 *
 * Die Komponente misst ihre eigene Breite und zeichnet so viele Zacken, wie
 * hineinpassen. Dadurch bleiben die Winkel überall gleich, egal wie breit die
 * Fläche ist – ein gedehntes Muster würde je nach Bildschirm anders aussehen.
 */
export function Kilim({ height = 12, color = C.gold, opacity = 0.9, dense, style }: Props) {
  const [width, setWidth] = useState(0);

  // Breite einer vollen Zickzack-Periode (zwei Zacken)
  const period = dense ? 16 : 40;

  return (
    <View style={style} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height} opacity={opacity}>
          <Path d={zigzag(width, period, height, 0.67, 0.17)} stroke={color} strokeWidth={1.4} fill="none" />
          <Path
            d={zigzag(width, period, height, 1, 0.5)}
            stroke={color}
            strokeWidth={1.4}
            fill="none"
            opacity={0.45}
          />
        </Svg>
      ) : (
        // Platzhalter, damit die Zeile vor der ersten Messung nicht springt
        <View style={{ height }} />
      )}
    </View>
  );
}

/**
 * Baut den SVG-Pfad einer Zickzack-Linie.
 * `low` und `high` sind Anteile der Gesamthöhe (1 = ganz unten, 0 = ganz oben).
 */
function zigzag(width: number, period: number, height: number, low: number, high: number) {
  const yLow = height * low;
  const yHigh = height * high;
  // Vier Wendepunkte pro Periode: unten, oben, unten, oben
  const step = period / 4;

  let d = `M0 ${yLow}`;
  for (let i = 1; i * step <= width + step; i++) {
    const x = Math.min(i * step, width);
    d += ` L${x} ${i % 2 === 1 ? yHigh : yLow}`;
    if (x >= width) break;
  }
  return d;
}
