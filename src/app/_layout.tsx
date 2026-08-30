import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider } from '@/state/app-state';
import { C } from '@/theme/tokens';

// Startbild bleibt stehen, bis die Schriften geladen sind. Sonst blitzt die
// Systemschrift kurz auf, und genau das lässt eine App billig wirken.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [schriftenGeladen, schriftFehler] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    // Auch bei einem Ladefehler weitermachen – lieber Systemschrift als eine
    // App, die auf dem Startbild hängen bleibt.
    if (schriftenGeladen || schriftFehler) {
      SplashScreen.hideAsync();
    }
  }, [schriftenGeladen, schriftFehler]);

  if (!schriftenGeladen && !schriftFehler) return null;

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <View style={{ flex: 1, backgroundColor: C.paper }}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: C.paper },
              // Kein Systemtitel: Die Kopfzeilen sind Teil des Designs und
              // werden in den Screens selbst gesetzt.
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="chat/[id]" />
          </Stack>
        </View>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
