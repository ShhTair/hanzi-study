import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { OnboardingCard } from '../../src/components/onboarding/OnboardingCard';

interface Props {
  onStudyPress?: () => void;
}

export default function Step6({ onStudyPress }: Props) {
  const steps = [
    {
      title: 'Learn with flashcards',
      desc: 'Use flashcards to build character recognition. Each card shows the character with stroke animations, pinyin, meanings, and example sentences.',
    },
    {
      title: 'Review with quizzes',
      desc: 'Ready to test yourself? Review characters you\'ve learned using multiple-choice quizzes on meaning, pinyin reading, and more.',
    },
    {
      title: 'Master by writing',
      desc: 'Practice writing Hanzi with your finger. Stroke order matters — learning correct stroke order helps with both recognition and memory.',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How to use Hanzi Study</Text>
      
      <OnboardingCard>
        {steps.map((step, index) => (
          <View key={index}>
            <View style={styles.row}>
              <View style={styles.textContainer}>
                <Text style={styles.heading}>{step.title}</Text>
                <Text style={styles.bodyText}>{step.desc}</Text>
              </View>
              <TouchableOpacity style={styles.studyBtn} onPress={onStudyPress}>
                <Text style={styles.studyBtnText}>STUDY</Text>
              </TouchableOpacity>
            </View>
            {index < steps.length - 1 && <View style={styles.divider} />}
          </View>
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
    marginTop: '-25%',
  },
  row: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
  },
  studyBtn: {
    backgroundColor: '#3A3A3C',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  studyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#3C3C3E',
  },
});
