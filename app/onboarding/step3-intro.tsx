import { Colors } from '../../src/constants/colors';

import { View, Text, StyleSheet } from 'react-native';
import { OnboardingCard } from '../../src/components/onboarding/OnboardingCard';

export default function Step3() {
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
  lastPara: {
    marginBottom: 0,
  },
});
