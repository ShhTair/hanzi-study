import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Props {
  visible: boolean;
  onClose: () => void;
  level: string;
  setIndex: number;
  setName: string;
}

const MODES = [
  { id: 'flashcard', color: '#22C55E', label: 'Flashcard study', subtitle: 'Character rote memorization', route: '/study/flashcard', locked: false },
  { id: 'quiz', color: '#0D9488', label: 'Multiple choice', subtitle: 'Quick knowledge check', route: '/study/quiz', locked: false },
  { id: 'writing', color: '#7C3AED', label: 'Writing challenges', subtitle: 'Stroke detection + self-check', route: '/study/writing', locked: false },
  { id: 'guided', color: '#555558', label: 'Guided study', subtitle: 'AI guided daily mix', route: '', locked: true },
];

export function StudyTypePicker({ visible, onClose, level, setIndex, setName }: Props) {
  const router = useRouter();

  const handleSelect = (mode: typeof MODES[0]) => {
    if (mode.locked) return;
    onClose();
    router.push({ pathname: mode.route as any, params: { level, set: setIndex } });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.title}>{setName}</Text>
              <View style={styles.divider} />
              {MODES.map((mode) => (
                <TouchableOpacity 
                  key={mode.id} 
                  style={styles.row} 
                  onPress={() => handleSelect(mode)}
                  activeOpacity={mode.locked ? 1 : 0.7}
                >
                  <View style={[styles.dot, { backgroundColor: mode.color }]} />
                  <View style={styles.textContainer}>
                    <Text style={[styles.label, mode.locked && styles.lockedText]}>{mode.label}</Text>
                    <Text style={styles.subtitle}>{mode.subtitle}</Text>
                  </View>
                  {mode.locked && <Ionicons name="lock-closed" size={20} color={Colors.textDisabled} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 },
  handle: { width: 36, height: 4, backgroundColor: '#555558', borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: 20, paddingVertical: 16 },
  divider: { height: 1, backgroundColor: Colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 16 },
  textContainer: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  lockedText: { color: Colors.textDisabled },
});
