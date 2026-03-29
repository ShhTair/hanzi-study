import { Colors } from '../../src/constants/colors';

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAudio } from '../../src/hooks/useAudio';
import { OnboardingCard } from '../../src/components/onboarding/OnboardingCard';

export default function Step3() {
  const { speakCharacter } = useAudio();

  const TONE_DEMO = [
    { char: '妈', pinyin: 'mā', tone: 1, meaning: 'mother', color: Colors.tone1 },
    { char: '麻', pinyin: 'má', tone: 2, meaning: 'hemp', color: Colors.tone2 },
    { char: '马', pinyin: 'mǎ', tone: 3, meaning: 'horse', color: Colors.tone3 },
    { char: '骂', pinyin: 'mà', tone: 4, meaning: 'scold', color: Colors.tone4 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to learning Hanzi!</Text>

      <OnboardingCard>
        <View style={styles.cardContent}>
          <Text style={styles.para}>
            Hanzi are Chinese characters with over 3,000 years of history. Each character is a building block — many are made from simpler components called radicals that give hints to meaning or pronunciation.
          </Text>
          <Text style={styles.para}>
            Chinese characters have one pronunciation written in Pinyin using tones. There are 4 tones + a neutral tone, each shown in a different color in this app.
          </Text>
          
          <View style={styles.demoRow}>
            {TONE_DEMO.map((item, i) => (
              <TouchableOpacity key={i} onPress={() => speakCharacter(item.char)} style={[styles.demoBox, {backgroundColor: item.color + '33'}]}>
                <Text style={{color: item.color, fontSize: 16, fontWeight: 'bold'}}>{item.pinyin}</Text>
                <Text style={{color: Colors.textPrimary, fontSize: 32, fontWeight: 'bold', marginVertical: 4}}>{item.char}</Text>
                <Text style={{color: Colors.textSecondary, fontSize: 12}}>{item.meaning}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={[styles.para, styles.lastPara]}>
            The app is free for HSK 1 characters. A one-time upgrade unlocks all 11,000+ HSK characters and custom set creation.
          </Text>
        </View>
      </OnboardingCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 32,
    marginTop: '-40%',
  },
  cardContent: {
    padding: 20,
  },
  para: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 16,
  },
  demoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  demoBox: { flex: 1, marginHorizontal: 2, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  lastPara: {
    marginBottom: 0,
  },
});
