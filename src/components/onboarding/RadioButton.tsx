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
    borderColor: '#0D9488',
  },
  outerInactive: {
    borderColor: '#808080',
  },
  inner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0D9488',
  },
});
