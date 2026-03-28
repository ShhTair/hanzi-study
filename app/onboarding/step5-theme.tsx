import { Colors } from '../../src/constants/colors';

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RadioButton } from '../../src/components/onboarding/RadioButton';

interface Props {
  theme: 'dark' | 'light';
  setTheme: (val: 'dark' | 'light') => void;
}

function ThemeCard({ type, selected, onPress }: { type: 'dark'|'light'; selected: boolean; onPress: () => void }) {
  const isDark = type === 'dark';
  const headerBg = isDark ? Colors.background : Colors.primary;
  const contentBg = isDark ? Colors.background : Colors.primary;
  const charBoxBg = isDark ? Colors.card : Colors.textPrimary;
  const textColor = isDark ? Colors.textPrimary : Colors.primary;

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.radioContainer}>
        <RadioButton selected={selected} onPress={onPress} />
      </View>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.previewCard}>
        <View style={[styles.cardHeader, { backgroundColor: headerBg }]}>
          <Text style={styles.headerLabel}>{isDark ? 'Dark theme' : 'Light theme'}</Text>
          <MaterialIcons name="search" size={22} color="#FFFFFF" />
        </View>
        <View style={[styles.cardContent, { backgroundColor: contentBg }]}>
          <View style={[styles.charBox, { backgroundColor: charBoxBg }]}>
            <Text style={{ fontSize: 48, color: textColor, fontWeight: 'bold' }}>好</Text>
            <View style={styles.tealDot} />
          </View>
          <View style={styles.textStack}>
            <Text style={[styles.charText, { color: textColor }]}>好 · hǎo</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>HSK 1</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function Step5({ theme, setTheme }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select an app theme</Text>
      <ThemeCard type="dark" selected={theme === 'dark'} onPress={() => setTheme('dark')} />
      <ThemeCard type="light" selected={theme === 'light'} onPress={() => setTheme('light')} />
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
    marginTop: '-35%',
  },
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioContainer: {
    marginRight: 16,
  },
  previewCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardContent: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  charBox: {
    width: 90,
    height: 90,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tealDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    position: 'absolute',
    bottom: 6,
    left: 6,
  },
  textStack: {
    marginLeft: 16,
    alignItems: 'flex-start',
  },
  charText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  badgeText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
