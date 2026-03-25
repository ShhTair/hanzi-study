import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet } from 'react-native';
import { useDatabase } from '../../src/hooks/useDatabase';

export default function SearchTab() {
  const { searchCharacters } = useDatabase();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length > 0) {
      const rows = await searchCharacters(text);
      setResults(rows);
    } else {
      setResults([]);
    }
  }, [searchCharacters]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search pinyin, meaning, or hanzi..."
        value={query}
        onChangeText={handleSearch}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.hanzi}>{item.simplified} {item.traditional && `(${item.traditional})`}</Text>
            <Text style={styles.pinyin}>{item.pinyin}</Text>
            <Text style={styles.meanings} numberOfLines={2}>
              {item.meanings ? JSON.parse(item.meanings).join(', ') : ''}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f0f0f0' },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  hanzi: { fontSize: 24, fontWeight: 'bold' },
  pinyin: { fontSize: 16, color: '#666', marginTop: 4 },
  meanings: { fontSize: 14, color: '#333', marginTop: 4 },
});
