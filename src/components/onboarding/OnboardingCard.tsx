import { View, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

export function OnboardingCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
});
