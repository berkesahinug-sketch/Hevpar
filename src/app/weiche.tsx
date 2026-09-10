import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useApp } from '@/state/app-state';
import { C } from '@/theme/tokens';

/**
 * Kleine Weiche nach dem Anmelden: Wer ein Profil hat, geht in die App,
 * wer keins hat, ins Onboarding. Solange das noch geklaert wird, dreht
 * sich ein Ladekreis auf Papier.
 */
export default function Weiche() {
  const { profilVorhanden } = useApp();

  if (profilVorhanden === null) {
    return (
      <View style={{ flex: 1, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.garnet} />
      </View>
    );
  }
  return <Redirect href={profilVorhanden ? '/entdecken' : '/onboarding'} />;
}
