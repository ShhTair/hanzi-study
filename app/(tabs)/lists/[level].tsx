import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { PinyinText } from '../../../src/components/PinyinText';
import { BG, CARD, CARD2, BORDER, TEXT, TEXT_DIM, ACCENT } from '../../../src/constants/colors';

type HskCharacter = {
  word: string;
  pinyin: string;
  meaning: string;
};

export default function HskLevelScreen() {
  const { level } = useLocalSearchParams();
  const router = useRouter();
  const [characters, setCharacters] = useState<HskCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        const results = await db.getAllAsync<HskCharacter>(
          'SELECT word, pinyin, meaning FROM hsk WHERE level = ?',
          [level as string]
        );
        setCharacters(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (level) {
      fetchCharacters();
    }
  }, [level as string]);

  const renderItem = ({ item }: { item: HskCharacter }) => {
    // If word is multi-character, we might still want to navigate to character detail 
    // but the character detail screen expects a single character `[char]`.
    // For now we'll just pass the full word. The instructions say 'navigate to /character/[char]'
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push(`/character/${encodeURIComponent(item.word)}` as any)}
      >
        <Text style={styles.charText}>{item.word}</Text>
        <PinyinText pinyin={item.pinyin} size={14} style={styles.pinyinContainer} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>HSK {level}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `HSK ${level} — ${characters.length} characters` }} />
      
      {loading ? (
        <ActivityIndicator size="large" color={ACCENT} style={styles.loader} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
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
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    margin: '1.1%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    aspectRatio: 0.85,
  },
  charText: {
    fontSize: 32,
    color: TEXT,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  pinyinContainer: {
    marginBottom: 8,
  },
  badge: {
    backgroundColor: CARD2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 'auto',
  },
  badgeText: {
    fontSize: 10,
    color: TEXT_DIM,
    fontWeight: 'bold',
  },
});
