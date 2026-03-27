import { View, Text, StyleSheet } from 'react-native';
import { OnboardingCard } from '../../src/components/onboarding/OnboardingCard';
import { OptionRow } from '../../src/components/onboarding/OptionRow';

interface Props {
  level: string;
  setLevel: (val: string) => void;
}

export default function Step2({ level, setLevel }: Props) {
  const options = [
    {
      value: 'beginner',
      label: 'Complete Beginner',
      desc: 'Completely new to Chinese? Start here to learn more about how Chinese characters work.',
    },
    {
      value: 'novice',
      label: 'Novice Learner',
      desc: 'Already know some basic characters? Start here to learn HSK 1 vocabulary.',
    },
    {
      value: 'experienced',
      label: 'Experienced Learner',
      desc: 'Looking to improve your Chinese? Start here with the default advanced settings.',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What is your Chinese level?</Text>
      
      <OnboardingCard>
        {options.map((opt, index) => (
          <OptionRow
            key={opt.value}
            label={opt.label}
            description={opt.desc}
            selected={level === opt.value}
            onPress={() => setLevel(opt.value)}
            showDivider={index < options.length - 1}
          />
        ))}
      </OnboardingCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: '-40%',
  },
});
