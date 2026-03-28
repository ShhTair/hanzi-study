import { Colors } from '../../../src/constants/colors';

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RadioButton } from './RadioButton';

interface Props {
  label: string;
  description: string;
  preview?: string;
  selected: boolean;
  onPress: () => void;
  showDivider?: boolean;
}

export function OptionRow({ label, description, preview, selected, onPress, showDivider }: Props) {
  return (
    <>
      <TouchableOpacity onPress={onPress} style={styles.container}>
        <RadioButton selected={selected} onPress={onPress} />
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          {preview && <Text style={styles.preview}>{preview}</Text>}
          <Text style={styles.description}>{description}</Text>
        </View>
      </TouchableOpacity>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  preview: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
});
