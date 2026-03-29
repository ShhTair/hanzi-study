import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Dimensions, Modal, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import * as SQLite from 'expo-sqlite';
import { Colors } from '../../src/constants/colors';
import { PinyinText } from '../../src/components/PinyinText';
import { AddToSetModal } from '../../src/components/AddToSetModal';
import { toggleFavorite } from '../../src/db/database';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');
const GRID_CELL_SIZE = (width - 32 - 24) / 4; // 4 columns, 16 padding sides, 3 gaps of 8

export default function SearchTab() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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

    const parseSearchQuery = (raw: string) => {
    let q = raw;
    let hskLevel: number | undefined;
    let strokeCount: number | undefined;
    let favoritesOnly = false;

    const hskMatch = q.match(/--hsk([1-9])/i);
    if (hskMatch) {
      hskLevel = parseInt(hskMatch[1]);
      q = q.replace(hskMatch[0], '').trim();
    }

    const strokeMatch = q.match(/--s(\d+)/i);
    if (strokeMatch) {
      strokeCount = parseInt(strokeMatch[1]);
      q = q.replace(strokeMatch[0], '').trim();
    }

    if (q.includes('--fav')) {
      favoritesOnly = true;
      q = q.replace('--fav', '').trim();
    }

    return { q, hskLevel, strokeCount, favoritesOnly };
  };

  const executeSearch = async (text: string) => {
    setQuery(text);
    const { q, hskLevel, strokeCount, favoritesOnly } = parseSearchQuery(text);
    if (q.trim().length > 0 || hskLevel || strokeCount || favoritesOnly) {
      // Inline the query since we need complex joins now
      const db = await SQLite.openDatabaseAsync('hanzi.db');
      
      let sql = 'SELECT d.rowid, d.simplified, d.traditional, d.pinyin, d.meanings, h.level FROM dictionary d LEFT JOIN hsk h ON h.word = d.simplified';
      const params: any[] = [];
      let whereAdded = false;

      const addWhere = () => {
        if (!whereAdded) { sql += ' WHERE '; whereAdded = true; }
        else sql += ' AND ';
      };

      if (strokeCount) {
        sql = sql.replace('FROM dictionary d', 'FROM dictionary d LEFT JOIN graphics g ON g.character = d.simplified');
      }

      if (q.trim().length > 0) {
        addWhere();
        sql += '(d.simplified LIKE ? OR d.pinyin LIKE ? OR d.meanings LIKE ?)';
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }

      if (hskLevel) {
        addWhere();
        sql += 'h.level = ?';
        params.push(hskLevel);
      }

      if (strokeCount) {
        addWhere();
        sql += 'json_array_length(g.strokes) = ?';
        params.push(strokeCount);
      }

      if (favoritesOnly) {
        addWhere();
        sql += 'EXISTS (SELECT 1 FROM favorites f WHERE f.word = d.simplified)';
      }

      sql += ' LIMIT 100';

      const rows = await db.getAllAsync(sql, params);
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
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search pinyin, meaning, or hanzi..."
          value={query}
          onChangeText={executeSearch}
          onSubmitEditing={handleSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => executeSearch('')} style={styles.clearIcon}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
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
              <Ionicons name="time-outline" size={20} color={colors.textMuted} />
              <Text style={styles.historyText}>{item}</Text>
              <TouchableOpacity onPress={() => removeHistoryItem(item)} style={{ padding: 8 }}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
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

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  clearIcon: { padding: 8 },
  input: {
    flex: 1,
    height: 48,
    color: colors.textPrimary,
    fontSize: 16,
  },
  historyTitle: { color: colors.textMuted, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginLeft: 16, marginTop: 16, marginBottom: 8, letterSpacing: 1 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
  historyText: { flex: 1, color: colors.textPrimary, fontSize: 16, marginLeft: 16 },
  clearHistoryBtn: { alignItems: 'center', paddingVertical: 24 },
  clearHistoryText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  listCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listHanzi: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  listMeanings: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  gridContent: { paddingHorizontal: 16, paddingBottom: 16 },
  gridRow: { justifyContent: 'flex-start' },
  gridCell: {
    width: GRID_CELL_SIZE,
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridChar: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  gridBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gridBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32 },
  actionTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, padding: 20, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: colors.divider },
  actionRow: { padding: 20, borderBottomWidth: 1, borderBottomColor: colors.divider, alignItems: 'center' },
  actionText: { fontSize: 18, color: colors.primary, fontWeight: '600' },
});
