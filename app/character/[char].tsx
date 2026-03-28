import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useDatabase } from '../../src/hooks/useDatabase';
import { getWordsContaining, getSentencesContaining } from '../../src/db/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PinyinText } from '../../src/components/PinyinText';
import { useAudio } from '../../src/hooks/useAudio';
import { Colors } from '../../src/constants/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const MAX_PATH_LENGTH = 3500;

function Stroke({ d, index, playTrigger }: { d: string; index: number; playTrigger: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      index * 600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    );
  }, [playTrigger, index, d]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: MAX_PATH_LENGTH - MAX_PATH_LENGTH * progress.value,
    };
  });

  return (
    <AnimatedPath
      d={d}
      stroke="#ffffff"
      strokeWidth={40}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={MAX_PATH_LENGTH}
      animatedProps={animatedProps}
      fill="none"
    />
  );
}

export default function CharacterDetail() {
  const router = useRouter();
  const { char } = useLocalSearchParams();
  const { db, getCharacterDetail } = useDatabase();
  const { speakCharacter } = useAudio();
  const [characterData, setCharacterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playTrigger, setPlayTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('Meanings');
  const [isFavorite, setIsFavorite] = useState(false);
  const [displayScript, setDisplayScript] = useState<'simplified'|'traditional'>('simplified');
  const [words, setWords] = useState<any[]>([]);
  const [sentences, setSentences] = useState<any[]>([]);

  useEffect(() => {
    async function initFavoriteSchema() {
      try {
        await db.execAsync('ALTER TABLE user_progress ADD COLUMN is_favorite INTEGER DEFAULT 0;');
      } catch (e) {
        // Column likely already exists
      }
    }
    initFavoriteSchema();
  }, [db]);

  useEffect(() => {
    async function load() {
      if (typeof char === 'string') {
        const data = await getCharacterDetail(char);
        setCharacterData(data);
        AsyncStorage.getItem('@hanzi_display_script').then(val => { if (val === 'traditional') setDisplayScript('traditional'); });
        getWordsContaining(char).then(setWords);
        getSentencesContaining(char).then(setSentences);
        
        try {
          const row = await db.getFirstAsync<{ is_favorite: number }>('SELECT is_favorite FROM user_progress WHERE word_id = ?', [char as string]);
          if (row) {
            setIsFavorite(row.is_favorite === 1);
          }
        } catch (e) {
          // ignore error if not found or column missing yet
        }
      }
      setLoading(false);
    }
    load();
  }, [char, getCharacterDetail, db]);

  const toggleFavorite = async () => {
    const newStatus = !isFavorite;
    setIsFavorite(newStatus);
    try {
      const exists = await db.getFirstAsync('SELECT word_id FROM user_progress WHERE word_id = ?', [char as string]);
      if (exists) {
        await db.runAsync('UPDATE user_progress SET is_favorite = ? WHERE word_id = ?', [newStatus ? 1 : 0, char as string]);
      } else {
        await db.runAsync('INSERT INTO user_progress (word_id, is_favorite) VALUES (?, ?)', [char as string, newStatus ? 1 : 0]);
      }
    } catch (e) {
      console.warn("Failed to update favorites:", e);
    }
  };

  const strokeData = useMemo(() => {
    if (characterData?.stroke_data) {
      try {
        return JSON.parse(characterData.stroke_data);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [characterData]);

  const displayChar = displayScript === 'traditional' && characterData?.traditional ? characterData.traditional : char;

  const meanings = useMemo(() => {
    if (characterData?.meanings) {
      try {
        return JSON.parse(characterData.meanings);
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [characterData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!characterData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Character not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen 
        options={{ 
          title: char as string, 
          headerStyle: { backgroundColor: Colors.background }, 
          headerTintColor: Colors.textPrimary,
          headerRight: () => (
            <TouchableOpacity onPress={toggleFavorite} style={{ marginRight: 15 }}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? Colors.wrong : Colors.textPrimary} />
            </TouchableOpacity>
          )
        }} 
      />
      
      {/* SVG Canvas Box */}
      <View style={styles.svgContainer}>
        {strokeData && strokeData.strokes ? (
          <Svg viewBox="0 0 1024 1024" width="100%" height="100%">
            {/* Draw faint background paths for all strokes */}
            {strokeData.strokes.map((d: string, i: number) => (
              <Path
                key={`bg-${i}`}
                d={d}
                stroke="#333333"
                strokeWidth={40}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {/* Draw animated foreground paths */}
            {strokeData.strokes.map((d: string, i: number) => (
              <Stroke key={`fg-${i}-${char}`} d={d} index={i} playTrigger={playTrigger} />
            ))}
          </Svg>
        ) : (
          <Text style={{color: '#666', marginTop: '50%', textAlign: 'center'}}>No stroke data</Text>
        )}
      </View>

      <View style={styles.pinyinContainer}>
        <PinyinText pinyin={characterData.pinyin} size={36} />
        <TouchableOpacity onPress={() => speakCharacter(char as string)} style={{ marginLeft: 16 }}>
          <Ionicons name='volume-high' size={28} color={Colors.primary} />
        </TouchableOpacity>
        {characterData.hsk_level && (
          <View style={styles.hskBadge}>
            <Text style={styles.hskText}>HSK {characterData.hsk_level}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {['Meanings', 'Strokes', 'Vocab', 'Sentences'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]} 
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.detailsContainer}>
        {activeTab === 'Meanings' && (
          <View style={styles.meaningsContainer}>
            {meanings.map((meaning: string, idx: number) => (
              <View key={idx} style={styles.meaningItem}>
                <Text style={styles.meaningText}>• {meaning}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Strokes' && (
          <View style={styles.strokesContainer}>
            <View style={styles.playButtonContainer}>
              <TouchableOpacity style={styles.playButton} onPress={() => setPlayTrigger(p => p + 1)}>
                <Text style={styles.playButtonText}>Replay Animation</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.statLabel}>Total Strokes: {characterData.stroke_count || '-'}</Text>
          </View>
        )}

        {activeTab === 'Vocab' && (
          <View style={styles.vocabContainer}>
            {words.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No vocabulary found</Text>
              </View>
            ) : (
              words.map((item: any, idx: number) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.wordRow}
                  onPress={() => router.push({ pathname: '/word/[id]', params: { id: item.id?.toString() || item.rowid?.toString() || item.simplified } } as any)}
                >
                  <View style={styles.wordLeft}>
                    <Text style={styles.wordSimplified}>{item.simplified}</Text>
                  </View>
                  <View style={styles.wordCenter}>
                    <Text style={styles.wordPinyin}>{item.pinyin}</Text>
                    <Text style={styles.wordMeaning} numberOfLines={1}>{item.meanings ? item.meanings.split('/')[0] : ''}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'Sentences' && (
          <View style={styles.sentencesContainer}>
            {sentences.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No sentences found</Text>
              </View>
            ) : (
              sentences.map((item: any, idx: number) => {
                const parts = item.simplified.split(char as string);
                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.sentenceRow}
                    onPress={() => {
                      const newSentences = [...sentences];
                      newSentences[idx].expanded = !newSentences[idx].expanded;
                      setSentences(newSentences);
                    }}
                  >
                    <Text style={styles.sentenceText}>
                      {parts.map((part: string, pIdx: number) => (
                        <React.Fragment key={pIdx}>
                          {part}
                          {pIdx < parts.length - 1 && (
                            <Text style={styles.sentenceHighlight}>{char}</Text>
                          )}
                        </React.Fragment>
                      ))}
                    </Text>
                    {item.expanded && (
                      <View style={styles.sentenceExpanded}>
                        <PinyinText pinyin={item.pinyin} size={14} style={{marginBottom: 4, justifyContent: 'flex-start'}} />
                        <Text style={styles.sentenceTranslation}>{item.meanings ? item.meanings.split('/')[0] : ''}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
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
    fontSize: 18,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  svgContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 20,
    transform: [{ scaleY: -1 }],
  },
  pinyinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  hskBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 16,
  },
  hskText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.primary,
  },
  detailsContainer: {
    flex: 1,
  },
  meaningsContainer: {
    marginBottom: 24,
  },
  meaningItem: {
    marginBottom: 8,
  },
  meaningText: {
    fontSize: 18,
    color: '#eee',
    lineHeight: 26,
  },
  strokesContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  playButtonContainer: {
    marginBottom: 24,
  },
  playButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  playButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  componentsContainer: {
    flexDirection: 'column',
    gap: 16,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  statBox: {
    width: '48%',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  vocabContainer: { flex: 1, marginTop: 16 },
  wordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  wordLeft: { width: 60 },
  wordSimplified: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
  wordCenter: { flex: 1, paddingHorizontal: 12 },
  wordPinyin: { fontSize: 14, color: Colors.textMuted, marginBottom: 4 },
  wordMeaning: { fontSize: 14, color: Colors.textSecondary },
  sentencesContainer: { flex: 1, marginTop: 16 },
  sentenceRow: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  sentenceText: { fontSize: 16, color: Colors.textPrimary, lineHeight: 24 },
  sentenceHighlight: { color: Colors.primary, fontWeight: 'bold' },
  sentenceExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  sentenceTranslation: { fontSize: 14, color: Colors.textSecondary },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyStateText: { color: Colors.textMuted, fontSize: 16 },
});
