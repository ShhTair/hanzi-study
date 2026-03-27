import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../src/constants/colors';
import * as SQLite from 'expo-sqlite';

export default function Tab4Etymology({ character = '你', pinyin = 'nǐ' }) {
  const [meanings, setMeanings] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchDictData = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        const result = await db.getFirstAsync<{ meanings: string }>(
          'SELECT meanings FROM dictionary WHERE simplified = ? LIMIT 1',
          [character]
        );
        if (result && result.meanings) {
          try {
             const m = JSON.parse(result.meanings);
             setMeanings(Array.isArray(m) ? m : [result.meanings]);
          } catch(e) {
             setMeanings([result.meanings]);
          }
        }
      } catch (e) {
        console.error('Error fetching dictionary:', e);
      }
    };
    fetchDictData();
  }, [character]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.mascotMessage}>🐼 Understanding character origins helps long-term memory.</Text>
      
      <View style={styles.section}>
        <Text style={styles.ancientLabel}>Ancient Form</Text>
        <Text style={styles.largeStylizedChar}>{character}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.formExplanationLabel}>Form explanation</Text>
        <Text style={styles.explanationText}>
          {character} 【{pinyin}】 depicts a person bowing — the origin of the meaning 'you'.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.meaningsHeader}>Character meanings</Text>
        {meanings.length > 0 ? (
           meanings.map((m, i) => (
             <Text key={i} style={styles.meaningsList}>{i + 1}. {m}</Text>
           ))
        ) : (
           <Text style={styles.meaningsList}>1. (orig.) Original meaning not available.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.componentHeader}>Component meanings</Text>
        <Text style={styles.pinyinLine}>Pinyin: {pinyin}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  mascotMessage: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24, textAlign: 'center' },
  section: { marginBottom: 24, alignItems: 'flex-start' },
  ancientLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  largeStylizedChar: { fontSize: 160, fontWeight: '200', color: Colors.textPrimary, alignSelf: 'center' },
  formExplanationLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 24, marginBottom: 8 },
  explanationText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  meaningsHeader: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  meaningsList: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
  componentHeader: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  pinyinLine: { fontSize: 14, color: Colors.textMuted, marginTop: 16 }
});
