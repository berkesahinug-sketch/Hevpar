import { Tabs } from 'expo-router/js-tabs';

import { KilimTabBar } from '@/components/kilim-tab-bar';
import { woerterFuer } from '@/data/sprache';
import { useApp } from '@/state/app-state';
import { C } from '@/theme/tokens';

export default function TabLayout() {
  const { profil } = useApp();
  const woerter = woerterFuer(profil.dialekt);

  return (
    <Tabs
      // Eigene Leiste statt der System-Tabbar: Nur so bekommen wir den
      // Kilim-Marker und die Papierfarben, die das Design vorgibt.
      tabBar={(props) => <KilimTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: C.paper },
      }}>
      <Tabs.Screen name="entdecken" options={{ title: 'Entdecken' }} />
      <Tabs.Screen name="cejn" options={{ title: woerter.cejn }} />
      <Tabs.Screen name="nachrichten" options={{ title: 'Nachrichten' }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
