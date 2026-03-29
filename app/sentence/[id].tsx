import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { PinyinText } from '../../src/components/PinyinText';
import { useAudio } from '../../src/hooks/useAudio';

type SentenceData = {
  rowid: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  meanings: string;
};

export default function SentenceInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { speakSentence } = useAudio();
  const [data, setData] = useState<SentenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        const row = await db.getFirstAsync<SentenceData>(
          'SELECT rowid, simplified, traditional, pinyin, meanings FROM dictionary WHERE rowid = ?',
          [Number(id)]
        );
        setData(row);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Sentence not found.</Text>
      </View>
    );
  }

  const characters = Array.from(new Set(data.simplified.split(''))).filter(c => /[\u4e00-\u9fff]/.test(c));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen 
        options={{ 
          title: 'Sentence', 
          headerStyle: { backgroundColor: Colors.background }, 
          headerTintColor: Colors.textPrimary 
        }} 
      />

      <View style={styles.mainCard}>
        <View style={styles.sentenceHeader}>
          <Text style={styles.sentenceText}>{data.simplified}</Text>
          <TouchableOpacity onPress={() => speakSentence(data.simplified)} style={styles.audioBtn}>
            <Ionicons name="volume-high" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <PinyinText pinyin={data.pinyin} size={16} style={styles.pinyinText} />
        
        <Text style={styles.meaningText}>{data.meanings ? data.meanings.split('/').join('; ') : ''}</Text>
      </View>

      <Text style={styles.sectionTitle}>Characters</Text>
      <View style={styles.chipsContainer}>
        {characters.map((char, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.chip}
            onPress={() => router.push(`/character/${encodeURIComponent(char)}` as any)}
          >
            <Text style={styles.chipText}>{char}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.sourceText}>From CC-CEDICT dictionary</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.wrong,
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  mainCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  sentenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sentenceText: {
    flex: 1,
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 32,
    marginRight: 16,
  },
  audioBtn: {
    padding: 8,
    backgroundColor: Colors.cardElevated,
    borderRadius: 8,
  },
  pinyinText: {
    marginBottom: 16,
  },
  meaningText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    backgroundColor: Colors.cardElevated,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 20,
    color: Colors.textPrimary,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
