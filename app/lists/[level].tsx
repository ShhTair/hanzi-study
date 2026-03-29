import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { PinyinText } from '../../src/components/PinyinText';
import { StudyTypePicker } from '../../src/components/StudyTypePicker';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { AddToSetModal } from '../../src/components/AddToSetModal';
import { toggleFavorite } from '../../src/db/database';

type HskCharacter = {
  ease_factor?: number;
  word: string;
  pinyin: string;
  meaning: string;
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

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, marginVertical: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={10}
          color={i <= rating ? Colors.primary : Colors.textMuted}
        />
      ))}
    </View>
  );
}

export default function HskLevelScreen() {
  const { level } = useLocalSearchParams();
  const router = useRouter();
  const [characters, setCharacters] = useState<HskCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedChars, setSelectedChars] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

    const fetchCharacters = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('hanzi.db');
      const results = await db.getAllAsync<HskCharacter>(
        'SELECT h.word, h.pinyin, h.meaning, u.ease_factor FROM hsk h LEFT JOIN user_progress u ON h.word = u.word_id WHERE h.level = ?',
        [level as string]
      );
      setCharacters(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (level) {
      fetchCharacters();
    }
  }, [level as string]);

  const handleLongPress = (char: string) => {
    setIsSelecting(true);
    setSelectedChars(new Set([char]));
  };

  const handlePress = (char: string) => {
    if (isSelecting) {
      setSelectedChars(prev => {
        const next = new Set(prev);
        next.has(char) ? next.delete(char) : next.add(char);
        return next;
      });
    } else {
      router.push(`/character/${encodeURIComponent(char)}` as any);
    }
  };

  const cancelSelect = () => {
    setIsSelecting(false);
    setSelectedChars(new Set());
  };

  const handleBatchFavorite = async () => {
    for (const char of selectedChars) {
      await toggleFavorite(char);
    }
    cancelSelect();
  };

  const handleBatchReset = () => {
    Alert.alert('Reset progress', `Reset progress for ${selectedChars.size} characters?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
          const db = await SQLite.openDatabaseAsync('hanzi.db');
          const words = Array.from(selectedChars).map(c => `'${c}'`).join(',');
          await db.execAsync(`DELETE FROM user_progress WHERE word_id IN (${words})`);
          cancelSelect();
          fetchCharacters();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: HskCharacter }) => {
    // If word is multi-character, we might still want to navigate to character detail 
    // but the character detail screen expects a single character `[char]`.
    // For now we'll just pass the full word. The instructions say 'navigate to /character/[char]'
    const isSelected = selectedChars.has(item.word);
    return (
      <TouchableOpacity 
        style={[styles.card, isSelected && { borderColor: Colors.primary, borderWidth: 2 }]}
        onPress={() => handlePress(item.word)}
        onLongPress={() => handleLongPress(item.word)}
      >
        {isSelected && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={{ position: 'absolute', bottom: 4, right: 4 }} />}
        <Text style={styles.charText}>{item.word}</Text>
        <PinyinText pinyin={item.pinyin} size={14} style={styles.pinyinContainer} />
        <StarRating rating={getRating(item.ease_factor || null)} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>HSK {level}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: isSelecting ? 'Select characters' : `HSK ${level} — ${characters.length} characters`,
          headerRight: isSelecting ? () => (
            <TouchableOpacity onPress={() => setSelectedChars(new Set(characters.map(c => c.word)))}>
              <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Select all</Text>
            </TouchableOpacity>
          ) : undefined,
          headerLeft: isSelecting ? () => (
            <TouchableOpacity onPress={cancelSelect} style={{marginRight: 16}}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          ) : undefined
        }} 
      />
      
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={characters}
          keyExtractor={(item, index) => `${item.word}-${index}`}
          numColumns={3}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
        />
      )}
      <TouchableOpacity style={{ padding: 16, backgroundColor: Colors.primary, margin: 16, borderRadius: 8 }} onPress={() => setPickerVisible(true)}><Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>STUDY</Text></TouchableOpacity>
      
      {isSelecting && (
        <View style={styles.batchBar}>
          <Text style={{ color: Colors.textPrimary, fontWeight: 'bold' }}>{selectedChars.size} selected</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={() => setAddModalVisible(true)}>
              <Ionicons name="add" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBatchFavorite}>
              <Ionicons name="star-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBatchReset}>
              <Ionicons name="refresh" size={24} color={Colors.wrong} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {addModalVisible && (
        <AddToSetModal 
          visible={addModalVisible} 
          onClose={() => { setAddModalVisible(false); cancelSelect(); }} 
          char={Array.from(selectedChars).join(',')} 
        />
      )}

      <StudyTypePicker visible={pickerVisible} onClose={() => setPickerVisible(false)} level={level as string} setIndex={0} setName={`HSK ${level}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  batchBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    padding: 12,
  },
  row: {
    justifyContent: 'flex-start',
  },
  card: {
    flex: 1,
    maxWidth: '31%', // roughly a third minus margins
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    margin: '1.1%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    aspectRatio: 0.85,
  },
  charText: {
    fontSize: 32,
    color: Colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  pinyinContainer: {
    marginBottom: 8,
  },
  badge: {
    backgroundColor: Colors.cardElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 'auto',
  },
  badgeText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
});
