import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Erscheinen } from '@/components/erscheinen';
import { Kilim } from '@/components/kilim';
import { Button, Eyebrow } from '@/components/ui';
import { DEMO_PROFILE, type Profil, type Prompt } from '@/data/demo-profile';
import { heutigeFrage } from '@/data/frage-des-tages';
import { woerterFuer } from '@/data/sprache';
import { WovenAvatar } from '@/components/woven-avatar';
import { useApp } from '@/state/app-state';
import { C, F, RADIUS, S } from '@/theme/tokens';

/**
 * Die Frage des Tages. Der Einsatz ist die eigene Antwort: Erst wer selbst
 * geantwortet hat, sieht, was andere geschrieben haben – und kann darauf ein
 * Silav schicken. Zuschauen ohne mitzuspielen gibt es nicht.
 */
export function Tageskarte({ onSilav }: { onSilav: (p: Profil, prompt: Prompt) => void }) {
  const { profil, tagesAntwort, setTagesAntwort, modus, tagesAndere } = useApp();
  const woerter = woerterFuer(profil.dialekt);
  const frage = heutigeFrage();
  const [text, setText] = useState('');

  // Woher die Antworten der anderen kommen: im echten Modus aus der
  // Datenbank (die sie erst nach der eigenen Antwort herausgibt), in der
  // Demo aus den Beispieldaten.
  const andere =
    modus === 'echt'
      ? tagesAndere.map((t) => ({
          profilId: t.profilId,
          name: t.name,
          stadt: t.stadt,
          text: t.text,
        }))
      : frage.antworten.map((a) => {
          const p = DEMO_PROFILE.find((x) => x.id === a.profilId);
          return { profilId: a.profilId, name: p?.name ?? '', stadt: p?.stadt ?? '', text: a.text };
        });

  const abgeben = () => {
    const sauber = text.trim();
    if (sauber) setTagesAntwort(sauber);
  };

  return (
    <View style={styles.karte}>
      <Kilim height={9} color={C.gold} />
      <View style={styles.kopf}>
        <Eyebrow>
          {woerter.pirsaRoje} · Frage des Tages
        </Eyebrow>
        <Text style={styles.frage}>{frage.frage}</Text>
      </View>

      {!tagesAntwort ? (
        <>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Erst antworten, dann siehst du die anderen."
            placeholderTextColor={C.muted}
            multiline
            style={styles.eingabe}
            accessibilityLabel="Antwort auf die Frage des Tages"
          />
          <View style={styles.absenden}>
            <Button label="Antworten" disabled={!text.trim()} onPress={abgeben} />
          </View>
        </>
      ) : (
        <View style={styles.antworten}>
          <View style={styles.meine}>
            <Text style={styles.meineText}>{tagesAntwort}</Text>
            <Text style={styles.meineWer}>Deine Antwort</Text>
          </View>

          {andere.length === 0 && modus === 'echt' ? (
            <Text style={styles.leer}>
              Noch hat heute niemand sonst geantwortet. Schau später wieder rein.
            </Text>
          ) : null}
          {andere.map((a, i) => (
            <Erscheinen key={a.profilId} index={i}>
              <View style={styles.andere}>
                <WovenAvatar seed={a.profilId} size={40} radius={10} />
                <View style={styles.andereText}>
                  <Text style={styles.andereWer}>
                    {a.name}
                    {a.stadt ? `, ${a.stadt}` : ''}
                  </Text>
                  <Text style={styles.andereAntwort}>{a.text}</Text>
                  <View style={styles.silav}>
                    <Button
                      variant="ghost"
                      label={`${woerter.silav} auf diese Antwort`}
                      onPress={() =>
                        onSilav(
                          {
                            id: a.profilId,
                            name: a.name,
                            alter: 0,
                            stadt: a.stadt,
                            verifiziert: true,
                            chips: [],
                            prompts: [],
                          },
                          { frage: frage.frage, antwort: a.text },
                        )
                      }
                    />
                  </View>
                </View>
              </View>
            </Erscheinen>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  karte: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: RADIUS.card,
    padding: S.lg,
    marginTop: S.lg,
  },
  kopf: { marginTop: S.md },
  frage: { fontFamily: F.serifMedium, fontSize: 20, lineHeight: 26, color: C.ink },

  eingabe: {
    marginTop: S.md,
    padding: 12,
    minHeight: 64,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    fontFamily: F.serif,
    fontSize: 15.5,
    lineHeight: 22,
    color: C.ink,
    textAlignVertical: 'top',
  },
  absenden: { marginTop: 10, alignSelf: 'flex-end' },

  antworten: { marginTop: S.md, gap: S.md },
  meine: { backgroundColor: C.sand, borderRadius: 12, padding: S.md },
  meineText: { fontFamily: F.serif, fontSize: 15.5, lineHeight: 22, color: C.ink },
  meineWer: { fontFamily: F.sans, fontSize: 11.5, color: C.muted, marginTop: 6 },

  andere: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  andereText: { flex: 1 },
  andereWer: { fontFamily: F.sansMedium, fontSize: 12.5, color: C.muted },
  andereAntwort: { fontFamily: F.serif, fontSize: 15.5, lineHeight: 22, color: C.ink, marginTop: 3 },
  silav: { marginTop: 8, alignSelf: 'flex-start' },
  leer: { fontFamily: F.sans, fontSize: 13, lineHeight: 20, color: C.muted },
});
