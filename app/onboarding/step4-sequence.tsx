import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { OnboardingCard } from '../../src/components/onboarding/OnboardingCard';
import { OptionRow } from '../../src/components/onboarding/OptionRow';

interface Props {
  sequence: string;
  setSequence: (val: string) => void;
}

export default function Step4({ sequence, setSequence }: Props) {
  const [expanded, setExpanded] = useState(false);

  const mainOptions = [
    {
      value: 'hsk',
      label: 'HSK Levels',
      preview: '你好中国人大学生...',
      desc: 'Characters divided by the official HSK 3.0 proficiency levels (1-9). Best for exam preparation.',
    },
    {
      value: 'frequency',
      label: 'Frequency',
      preview: '的了是不在这个有...',
      desc: 'Characters ordered by how often they appear in modern Chinese text. Great for everyday reading.',
    },
    {
      value: 'stroke_count',
      label: 'Stroke Count',
      preview: '一二三十大人口山...',
      desc: 'Simple characters first, complex later. Good for beginners focusing on writing.',
    },
  ];

  const extraOptions = [
    {
      value: 'traditional',
      label: 'Traditional',
      preview: '你好中國人大學生...',
      desc: 'Traditional form sequence',
    },
    {
      value: 'custom',
      label: 'Custom',
      preview: '',
      desc: 'import your own list',
    },
  ];

  const visibleOptions = expanded ? [...mainOptions, ...extraOptions] : mainOptions;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a character sequence</Text>
      
      <OnboardingCard>
        {visibleOptions.map((opt, index) => (
          <OptionRow
            key={opt.value}
            label={opt.label}
            description={opt.desc}
            preview={opt.preview}
            selected={sequence === opt.value}
            onPress={() => setSequence(opt.value)}
            showDivider={index < visibleOptions.length - 1 || !expanded}
          />
        ))}
        
        <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.seeMoreText}>{expanded ? 'SEE LESS' : 'SEE MORE'}</Text>
        </TouchableOpacity>
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
    marginTop: '-30%',
  },
  seeMoreBtn: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});
