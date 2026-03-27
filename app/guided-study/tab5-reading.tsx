import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../src/constants/colors';
import * as SQLite from 'expo-sqlite';

export default function Tab5Reading({ character = '你' }) {
  const [sentences, setSentences] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchSentences = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        const results = await db.getAllAsync<{ simplified: string, pinyin: string, english: string }>(
          `SELECT simplified, pinyin, english FROM dictionary WHERE simplified LIKE '%' || ? || '%' LIMIT 10`,
          [character]
        );
        setSentences(results || []);
      } catch (e) {
        console.error('Error fetching sentences:', e);
      }
    };
    fetchSentences();
  }, [character]);

  const toggleExpand = (index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  const renderHighlightedSentence = (sentence: string) => {
    const parts = sentence.split(character);
    return (
      <Text style={styles.sentenceText}>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && <Text style={styles.highlightedChar}>{character}</Text>}
          </React.Fragment>
        ))}
      </Text>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.mascotMessage}>🐼 Reading exercises put characters in real context.</Text>
      
      {sentences.length === 0 ? (
        <Text style={styles.emptyState}>No example sentences available yet for this character.</Text>
      ) : (
        sentences.map((s, index) => (
          <TouchableOpacity key={index} style={styles.row} onPress={() => toggleExpand(index)}>
            <View style={styles.rowTop}>
              <View style={styles.sentenceContainer}>
                 {renderHighlightedSentence(s.simplified)}
              </View>
              <View style={styles.tagBox}>
                <Text style={styles.tagText}>{character} {index + 1}</Text>
              </View>
            </View>
            {expandedIndex === index && (
              <View style={styles.expandedContent}>
                <Text style={styles.pinyinText}>{s.pinyin}</Text>
                <Text style={styles.englishText}>{s.english || s.meanings}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  mascotMessage: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24, textAlign: 'center' },
  emptyState: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', marginTop: 32 },
  row: { paddingVertical: 16, paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sentenceContainer: { flex: 1, paddingRight: 16 },
  sentenceText: { fontSize: 18, color: Colors.textPrimary },
  highlightedChar: { fontWeight: '700', color: Colors.primary },
  tagBox: { backgroundColor: Colors.card, borderRadius: 4, paddingVertical: 4, paddingHorizontal: 8 },
  tagText: { fontSize: 12, color: Colors.textMuted },
  expandedContent: { marginTop: 12 },
  pinyinText: { fontSize: 14, color: Colors.textMuted, marginBottom: 4 },
  englishText: { fontSize: 14, color: Colors.textSecondary }
});
