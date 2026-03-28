import { Colors } from '../../../src/constants/colors';

import { View, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

export function OnboardingCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
});
