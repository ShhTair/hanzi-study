import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { toggleFavorite, getSentencesContaining, isFavorite } from '../../src/db/database';
import { PinyinText } from '../../src/components/PinyinText';
import { useAudio } from '../../src/hooks/useAudio';

export default function WordInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { speakCharacter } = useAudio();

  const [word, setWord] = useState<any>(null);
  const [hskLevel, setHskLevel] = useState<number | null>(null);
  const [sentences, setSentences] = useState<any[]>([]);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        const entry = await db.getFirstAsync<any>('SELECT * FROM dictionary WHERE id = ?', [parseInt(id, 10)]);
        
        if (entry) {
          setWord(entry);
          
          const hskRow = await db.getFirstAsync<{level: number}>('SELECT level FROM hsk WHERE word = ?', [entry.simplified]);
          if (hskRow) setHskLevel(hskRow.level);

          const fav = await isFavorite(entry.simplified);
          setFavorited(fav);

          if (entry.simplified.length > 0) {
             const firstChar = entry.simplified[0];
             const sents = await getSentencesContaining(firstChar);
             // Default all sentences to not expanded
             setSentences(sents.map((s: any) => ({ ...s, expanded: false })));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id]);

  const handleFavorite = async () => {
    if (!word) return;
    const isNowFav = await toggleFavorite(word.simplified);
    setFavorited(isNowFav);
  };

  const toggleSentence = (index: number) => {
    setSentences(prev => {
      const copy = [...prev];
      copy[index].expanded = !copy[index].expanded;
      return copy;
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!word) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: Colors.textPrimary }}>Word not found</Text>
      </View>
    );
  }

  const meaningsList = word.meanings.split('/').filter(Boolean);
  const chars = word.simplified.split('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerWord}>{word.simplified}</Text>
        <TouchableOpacity onPress={handleFavorite} style={styles.iconBtn}>
          <Ionicons name={favorited ? "star" : "star-outline"} size={24} color={favorited ? Colors.primary : Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.charsRow}>
            <Text style={styles.simplified}>{word.simplified}</Text>
            <Text style={[styles.traditional, word.simplified === word.traditional && { color: Colors.textMuted }]}>
              {word.traditional}
            </Text>
          </View>

          <View style={styles.pinyinRow}>
            <PinyinText pinyin={word.pinyin} size={20} />
            <TouchableOpacity onPress={() => speakCharacter(word.simplified)} style={styles.audioBtn}>
              <Ionicons name="volume-high" size={24} color={Colors.primary} />
            </TouchableOpacity>
            {hskLevel && (
              <View style={styles.hskBadge}>
                <Text style={styles.hskBadgeText}>HSK {hskLevel}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meanings</Text>
          <View style={styles.card}>
            {meaningsList.map((m: string, i: number) => (
              <View key={i} style={styles.meaningRow}>
                <Text style={styles.meaningNum}>{i + 1}.</Text>
                <Text style={styles.meaningText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Components</Text>
          <View style={styles.componentsRow}>
            {chars.map((char: string, i: number) => (
              <TouchableOpacity 
                key={i} 
                style={styles.charChip}
                onPress={() => router.push(`/character/${encodeURIComponent(char)}` as any)}
              >
                <Text style={styles.chipText}>{char}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Example Sentences</Text>
          {sentences.length === 0 ? (
            <Text style={{ color: Colors.textMuted }}>No examples found.</Text>
          ) : (
            sentences.map((item, index) => (
              <TouchableOpacity key={index} style={styles.sentenceCard} onPress={() => toggleSentence(index)}>
                <Text style={styles.sentenceText}>{item.simplified}</Text>
                {item.expanded && (
                  <View style={styles.sentenceExpanded}>
                    <PinyinText pinyin={item.pinyin} size={14} style={{ marginBottom: 4 }} />
                    <Text style={styles.sentenceTranslation}>{item.meanings.split('/')[0]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconBtn: { padding: 8 },
  headerWord: { color: Colors.textPrimary, fontSize: 24, fontWeight: 'bold' },
  content: { padding: 16 },
  heroSection: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  charsRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  simplified: { color: Colors.textPrimary, fontSize: 48, fontWeight: 'bold', marginRight: 12 },
  traditional: { color: Colors.textSecondary, fontSize: 32 },
  pinyinRow: { flexDirection: 'row', alignItems: 'center' },
  audioBtn: { marginLeft: 16, marginRight: 16, padding: 4 },
  hskBadge: { backgroundColor: Colors.primaryDark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  hskBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  section: { marginBottom: 24 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  card: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  meaningRow: { flexDirection: 'row', marginBottom: 8 },
  meaningNum: { color: Colors.textSecondary, fontSize: 16, width: 24 },
  meaningText: { color: Colors.textSecondary, fontSize: 16, flex: 1 },
  componentsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  charChip: {
    backgroundColor: Colors.cardElevated,
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { color: Colors.textPrimary, fontSize: 24, fontWeight: 'bold' },
  sentenceCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sentenceText: { color: Colors.textPrimary, fontSize: 18 },
  sentenceExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  sentenceTranslation: { color: Colors.textSecondary, fontSize: 14 },
});
