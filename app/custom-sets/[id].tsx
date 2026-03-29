import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { getCustomSetChars, removeCharFromSet, renameCustomSet } from '../../src/db/database';
import { AddToSetModal } from '../../src/components/AddToSetModal';
import { StudyTypePicker } from '../../src/components/StudyTypePicker';

export default function CustomSetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const setId = Number(id);
  const [setName, setSetName] = useState('Custom Set');
  const [chars, setChars] = useState<{word: string, ease: number | null}[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const loadData = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('hanzi.db');
      const setRow = await db.getFirstAsync<{name: string}>('SELECT name FROM custom_sets WHERE id = ?', [setId]);
      if (setRow) setSetName(setRow.name);

      const words = await getCustomSetChars(db, setId);
      const charsData = await Promise.all(words.map(async (w) => {
        const easeRow = await db.getFirstAsync<{ease_factor: number}>('SELECT ease_factor FROM user_progress WHERE word_id = ?', [w]);
        return { word: w, ease: easeRow ? easeRow.ease_factor : null };
      }));
      setChars(charsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRename = () => {
    Alert.prompt('Rename Set', 'Enter new name', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', onPress: async (name?: string) => {
        if (name && name.trim()) {
          const db = await SQLite.openDatabaseAsync('hanzi.db');
          await renameCustomSet(db, setId, name.trim());
          setSetName(name.trim());
        }
      }}
    ], 'plain-text', setName);
  };

  const handleRemove = (word: string) => {
    Alert.alert('Remove Character', `Remove ${word} from this set?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        await removeCharFromSet(db, setId, word);
        loadData();
      }}
    ]);
  };

  function getRating(easeFactor: number | null): number {
    if (!easeFactor) return 0;
    if (easeFactor < 1.5) return 0;
    if (easeFactor < 2.0) return 1;
    if (easeFactor < 2.5) return 2;
    if (easeFactor < 3.0) return 3;
    if (easeFactor < 3.5) return 4;
    return 5;
  }

  const renderItem = ({ item }: { item: {word: string, ease: number | null} }) => {
    const rating = getRating(item.ease);
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push(`/character/${encodeURIComponent(item.word)}` as any)}
        onLongPress={() => handleRemove(item.word)}
      >
        <Text style={styles.charText}>{item.word}</Text>
        <View style={styles.starsContainer}>
          {[1,2,3,4,5].map(i => (
            <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={8} color={i <= rating ? Colors.primary : Colors.textMuted} />
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: setName,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.textPrimary,
          headerTitle: () => (
            <TouchableOpacity onPress={handleRename}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary }}>{setName}</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')} style={{ padding: 8 }}>
              <Ionicons name="search" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          )
        }} 
      />

      {chars.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No characters yet.</Text>
          <Text style={styles.emptySubtext}>Tap + to add characters to this set.</Text>
        </View>
      ) : (
        <FlatList
          data={chars}
          keyExtractor={(item) => item.word}
          numColumns={4}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {chars.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.studyBtn} onPress={() => setPickerVisible(true)}>
            <Text style={styles.studyBtnText}>STUDY</Text>
          </TouchableOpacity>
        </View>
      )}

      

      <StudyTypePicker 
        visible={pickerVisible} 
        onClose={() => setPickerVisible(false)} 
        level="custom" 
        setIndex={setId} 
        setName={setName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: Colors.textPrimary, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary },
  listContent: { padding: 12 },
  card: {
    flex: 1,
    margin: 4,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charText: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  starsContainer: { flexDirection: 'row', gap: 1 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.card },
  studyBtn: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  studyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
