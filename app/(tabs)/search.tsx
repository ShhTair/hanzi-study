import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Dimensions, Modal, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import { Colors } from '../../src/constants/colors';
import { PinyinText } from '../../src/components/PinyinText';
import { AddToSetModal } from '../../src/components/AddToSetModal';
import { toggleFavorite } from '../../src/db/database';

const { width } = Dimensions.get('window');
const GRID_CELL_SIZE = (width - 32 - 24) / 4; // 4 columns, 16 padding sides, 3 gaps of 8

export default function SearchTab() {
  const { searchCharacters } = useDatabase();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedChar, setSelectedChar] = useState<any>(null);
  const [addToSetVisible, setAddToSetVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@hanzi_search_history').then(raw => {
      if (raw) setHistory(JSON.parse(raw));
    });
    AsyncStorage.getItem('@hanzi_search_view').then(raw => {
      if (raw === 'grid' || raw === 'list') setViewMode(raw);
    });
  }, []);

  const toggleViewMode = async () => {
    const next = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(next);
    await AsyncStorage.setItem('@hanzi_search_view', next);
  };

  const addToHistory = async (q: string) => {
    if (!q.trim()) return;
    const raw = await AsyncStorage.getItem('@hanzi_search_history');
    const hist: string[] = raw ? JSON.parse(raw) : [];
    const updated = [q, ...hist.filter(h => h !== q)].slice(0, 20);
    setHistory(updated);
    await AsyncStorage.setItem('@hanzi_search_history', JSON.stringify(updated));
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem('@hanzi_search_history');
  };

  const removeHistoryItem = async (q: string) => {
    const updated = history.filter(h => h !== q);
    setHistory(updated);
    await AsyncStorage.setItem('@hanzi_search_history', JSON.stringify(updated));
  };

  const executeSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length > 0) {
      const rows = await searchCharacters(text);
      setResults(rows);
    } else {
      setResults([]);
    }
  };

  const handleSubmit = () => {
    addToHistory(query);
    Keyboard.dismiss();
  };

  const handleHistoryTap = (q: string) => {
    setQuery(q);
    executeSearch(q);
    addToHistory(q);
    Keyboard.dismiss();
  };

  const handleLongPress = (item: any) => {
    setSelectedChar(item);
    setActionSheetVisible(true);
  };

  const renderActionSheet = () => (
    <Modal visible={actionSheetVisible} transparent animationType="fade" onRequestClose={() => setActionSheetVisible(false)}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActionSheetVisible(false)}>
        <View style={styles.actionSheet}>
          <Text style={styles.actionTitle}>{selectedChar?.simplified}</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => {
            setActionSheetVisible(false);
            router.push(`/character/${encodeURIComponent(selectedChar?.simplified)}` as any);
          }}>
            <Text style={styles.actionText}>View character</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => {
            setActionSheetVisible(false);
            setAddToSetVisible(true);
          }}>
            <Text style={styles.actionText}>Add to custom set...</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={async () => {
            setActionSheetVisible(false);
            if (selectedChar) await toggleFavorite(selectedChar.simplified);
          }}>
            <Text style={styles.actionText}>Add/Remove Favorite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => {
            setActionSheetVisible(false);
            router.push({ pathname: '/study/flashcard', params: { chars: selectedChar?.simplified } });
          }}>
            <Text style={styles.actionText}>Study this character</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderGridItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.gridCell}
      onPress={() => router.push(`/character/${encodeURIComponent(item.simplified)}` as any)}
      onLongPress={() => handleLongPress(item)}
    >
      <Text style={styles.gridChar}>{item.simplified}</Text>
      {/* Assuming hsk badge available, we check if it has a level */}
      {item.hsk_level ? (
        <View style={styles.gridBadge}>
          <Text style={styles.gridBadgeText}>HSK {item.hsk_level}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.listCard}
      onPress={() => router.push(`/character/${encodeURIComponent(item.simplified)}` as any)}
      onLongPress={() => handleLongPress(item)}
    >
      <Text style={styles.listHanzi}>{item.simplified} {item.traditional && `(${item.traditional})`}</Text>
      <PinyinText pinyin={item.pinyin} size={16} style={{ marginTop: 4 }} />
      <Text style={styles.listMeanings} numberOfLines={2}>
        {item.meanings ? (typeof item.meanings === 'string' && item.meanings.startsWith('[') ? JSON.parse(item.meanings).join(', ') : item.meanings) : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Search',
          headerRight: () => (
            <TouchableOpacity onPress={toggleViewMode} style={{ marginRight: 16 }}>
              <MaterialIcons name={viewMode === 'list' ? 'grid-view' : 'view-list'} size={24} color="#FFF" />
            </TouchableOpacity>
          )
        }} 
      />

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search pinyin, meaning, or hanzi..."
          value={query}
          onChangeText={executeSearch}
          onSubmitEditing={handleSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => executeSearch('')} style={styles.clearIcon}>
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {isFocused && query.length === 0 ? (
        <FlatList
          data={history}
          keyExtractor={(item) => item}
          ListHeaderComponent={() => history.length > 0 ? <Text style={styles.historyTitle}>Recent Searches</Text> : null}
          ListFooterComponent={() => history.length > 0 ? (
            <TouchableOpacity onPress={clearHistory} style={styles.clearHistoryBtn}>
              <Text style={styles.clearHistoryText}>Clear all history</Text>
            </TouchableOpacity>
          ) : null}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.historyRow} onPress={() => handleHistoryTap(item)}>
              <Ionicons name="time-outline" size={20} color={Colors.textMuted} />
              <Text style={styles.historyText}>{item}</Text>
              <TouchableOpacity onPress={() => removeHistoryItem(item)} style={{ padding: 8 }}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      ) : (
        viewMode === 'grid' ? (
          <FlatList
            data={results}
            key={'grid'} // force re-render on toggle
            keyExtractor={(item) => item.id.toString()}
            numColumns={4}
            renderItem={renderGridItem}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
          />
        ) : (
          <FlatList
            data={results}
            key={'list'}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderListItem}
            contentContainerStyle={styles.listContent}
          />
        )
      )}

      {renderActionSheet()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { marginRight: 8 },
  clearIcon: { padding: 8 },
  input: {
    flex: 1,
    height: 48,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  historyTitle: { color: Colors.textMuted, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginLeft: 16, marginTop: 16, marginBottom: 8, letterSpacing: 1 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  historyText: { flex: 1, color: Colors.textPrimary, fontSize: 16, marginLeft: 16 },
  clearHistoryBtn: { alignItems: 'center', paddingVertical: 24 },
  clearHistoryText: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  listCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listHanzi: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
  listMeanings: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  gridContent: { paddingHorizontal: 16, paddingBottom: 16 },
  gridRow: { justifyContent: 'flex-start' },
  gridCell: {
    width: GRID_CELL_SIZE,
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridChar: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  gridBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gridBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: Colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 },
  actionTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, padding: 20, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: Colors.divider },
  actionRow: { padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.divider, alignItems: 'center' },
  actionText: { fontSize: 18, color: Colors.primary, fontWeight: '600' },
});
