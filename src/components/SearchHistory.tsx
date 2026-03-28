import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface Props {
  onSelect: (query: string) => void;
  visible: boolean;
}

export function SearchHistory({ onSelect, visible }: Props) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  const load = async () => {
    const data = await AsyncStorage.getItem('@hanzi_search_history');
    if (data) setHistory(JSON.parse(data));
  };

  const remove = async (index: number) => {
    const h = [...history];
    h.splice(index, 1);
    setHistory(h);
    await AsyncStorage.setItem('@hanzi_search_history', JSON.stringify(h));
  };

  const clearAll = async () => {
    setHistory([]);
    await AsyncStorage.removeItem('@hanzi_search_history');
  };

  if (!visible || history.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Searches</Text>
        <TouchableOpacity onPress={clearAll}><Text style={styles.clear}>Clear all</Text></TouchableOpacity>
      </View>
      {history.map((q, i) => (
        <TouchableOpacity key={`${q}-${i}`} style={styles.row} onPress={() => onSelect(q)}>
          <MaterialIcons name="history" size={20} color={Colors.textSecondary} />
          <Text style={styles.query}>{q}</Text>
          <TouchableOpacity onPress={() => remove(i)} style={styles.removeBtn}>
            <MaterialIcons name="close" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  clear: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  query: { flex: 1, fontSize: 16, color: Colors.textPrimary, marginLeft: 12 },
  removeBtn: { padding: 8, marginRight: -8 },
});

export const saveSearch = async (query: string) => {
  if (!query.trim()) return;
  const data = await AsyncStorage.getItem('@hanzi_search_history');
  let h: string[] = data ? JSON.parse(data) : [];
  h = h.filter(x => x !== query);
  h.unshift(query);
  if (h.length > 20) h = h.slice(0, 20);
  await AsyncStorage.setItem('@hanzi_search_history', JSON.stringify(h));
};
