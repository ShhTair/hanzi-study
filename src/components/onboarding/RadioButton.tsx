import { Colors } from '../../../src/constants/colors';

import { View, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  selected: boolean;
  onPress: () => void;
}

export function RadioButton({ selected, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.outer, selected ? styles.outerActive : styles.outerInactive]}>
      {selected && <View style={styles.inner} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerActive: {
    borderColor: Colors.primary,
  },
  outerInactive: {
    borderColor: Colors.primary,
  },
  inner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
  },
});
