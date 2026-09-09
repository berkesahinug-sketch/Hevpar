import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  /** Position in einer Liste – spätere Elemente erscheinen etwas später */
  index?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Lässt Inhalt sanft von unten einschweben, in Listen gestaffelt.
 *
 * Die Staffelung ist gedeckelt: Ab dem sechsten Element gibt es keine weitere
 * Verzögerung mehr, sonst wartet man beim Scrollen auf seine eigenen Karten.
 */
export function Erscheinen({ children, index = 0, style }: Props) {
  const fortschritt = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fortschritt, {
      toValue: 1,
      duration: 360,
      delay: Math.min(index, 5) * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fortschritt, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fortschritt,
          transform: [
            { translateY: fortschritt.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
