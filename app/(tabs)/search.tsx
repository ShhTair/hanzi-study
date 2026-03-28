import { Colors } from '../../src/constants/colors';

import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useRouter } from 'expo-router';

export default function SearchTab() {
  const { searchCharacters } = useDatabase();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

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
        placeholderTextColor="#888"
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push(`/character/${item.simplified}`)}
          >
            <Text style={styles.hanzi}>{item.simplified} {item.traditional && `(${item.traditional})`}</Text>
            <Text style={styles.pinyin}>{item.pinyin}</Text>
            <Text style={styles.meanings} numberOfLines={2}>
              {item.meanings ? JSON.parse(item.meanings).join(', ') : ''}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: Colors.background },
  input: {
    height: 50,
    backgroundColor: Colors.card,
    color: Colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  card: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  hanzi: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
  pinyin: { fontSize: 16, color: '#aaa', marginTop: 4 },
  meanings: { fontSize: 14, color: '#ccc', marginTop: 4 },
});
