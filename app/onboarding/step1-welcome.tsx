import { Colors } from '../../src/constants/colors';

import { View, Text, StyleSheet } from 'react-native';
import { OnboardingCard } from '../../src/components/onboarding/OnboardingCard';

export default function Step1() {
  return (
    <View style={styles.container}>
      {/* Background enso circle */}
      <View style={styles.ensoCircle} />
      
      <View style={styles.topSection}>
        <Text style={styles.titleHanzi}>汉字学习</Text>
        <Text style={styles.subtitle}>Hanzi Study</Text>
      </View>

      <OnboardingCard>
        <View style={styles.cardContent}>
          <Text style={styles.para1}>
            Thanks for downloading Hanzi Study! This app will help you read and write Chinese characters.
          </Text>
          <Text style={styles.para2}>
            We'll get started by customizing how you want to learn. You can change these settings later at any time.
          </Text>
        </View>
      </OnboardingCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: Colors.background,
  },
  ensoCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.textPrimary,
    opacity: 0.08,
    transform: [{ translateY: -60 }],
  },
  topSection: {
    alignItems: 'center',
    transform: [{ translateY: -60 }],
  },
  titleHanzi: {
    fontSize: 56,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: Colors.textPrimary,
    letterSpacing: 3,
    marginBottom: 48,
  },
  cardContent: {
    padding: 20,
  },
  para1: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 16,
  },
  para2: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
});
