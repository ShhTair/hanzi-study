import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { getAllFavorites, toggleFavorite } from '../src/db/database';
import { PinyinText } from '../src/components/PinyinText';
import { MaterialIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const data = await getAllFavorites();
    setFavorites(data);
  };

  const handleRemove = async (word: string) => {
    Alert.alert('Remove Favorite', `Remove ${word} from favorites?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await toggleFavorite(word);
        loadFavorites();
      }},
    ]);
  };

  const renderRightActions = (word: string) => {
    return (
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemove(word)}>
        <MaterialIcons name="delete" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.panda}>🐼</Text>
        <Text style={styles.emptyText}>No favorites yet.{'\n'}Tap ★ on any character to save it.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <TouchableOpacity style={styles.sortBtn}>
          <MaterialIcons name="sort" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.word}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item.word)}>
            <TouchableOpacity 
              style={styles.row}
              onPress={() => router.push(`/character/${item.word}`)}
            >
              <Text style={styles.character}>{item.word}</Text>
              <View style={styles.info}>
                <PinyinText pinyin="" size={14} />
                <Text style={styles.addedText}>Added: {new Date(item.added_at * 1000).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          </Swipeable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.card,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  sortBtn: { padding: 8, marginRight: -8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginLeft: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 32 },
  panda: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  row: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    alignItems: 'center',
  },
  character: { fontSize: 28, color: Colors.textPrimary, marginRight: 16 },
  info: { flex: 1 },
  addedText: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  deleteButton: {
    backgroundColor: Colors.wrong,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
});
