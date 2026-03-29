import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PinyinText } from '../../src/components/PinyinText';
import { AddToSetModal } from '../../src/components/AddToSetModal';
import { useAudio } from '../../src/hooks/useAudio';
import { Colors } from '../../src/constants/colors';
import * as Clipboard from 'expo-clipboard';

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


function getRating(easeFactor: number | null): number {
  if (!easeFactor) return 0;
  if (easeFactor < 1.5) return 0;
  if (easeFactor < 2.0) return 1;
  if (easeFactor < 2.5) return 2;
  if (easeFactor < 3.0) return 3;
  if (easeFactor < 3.5) return 4;
  return 5;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={i <= rating ? Colors.primary : Colors.textMuted}
        />
      ))}
    </View>
  );
}

function TappableSentence({ text, highlight, router }: { text: string; highlight: string; router: any }) {
  const chars = text.split('');
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {chars.map((char: string, i: number) => {
        const isChinese = /[\u4e00-\u9fff]/.test(char);
        const isHighlight = char === highlight;
        if (!isChinese) {
          return <Text key={i} style={styles.punctuation}>{char}</Text>;
        }
        return (
          <TouchableOpacity key={i} onPress={() => router.push('/character/'+char)}>
            <Text style={[styles.sentenceChar, isHighlight && styles.highlighted]}>
              {char}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
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
  const [strokeCount, setStrokeCount] = useState<number | null>(null);
  const [easeFactor, setEaseFactor] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [addToSetVisible, setAddToSetVisible] = useState(false);

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
          const efRow = await db.getFirstAsync<{ease_factor: number}>('SELECT ease_factor FROM user_progress WHERE word_id = ?', [char as string]);
          if (efRow) {
            setEaseFactor(efRow.ease_factor);
          }
          const graphicsRow = await db.getFirstAsync<{strokes: string}>('SELECT strokes FROM graphics WHERE character = ?', [char as string]);
          if (graphicsRow && graphicsRow.strokes) {
            setStrokeCount(JSON.parse(graphicsRow.strokes).length);
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

  
  const handleCopy = async () => {
    const text = `${char} [${characterData.pinyin}] ${meanings[0] || ''}`;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openPleco = async (character: string) => {
    const url = `plecoapi://x-callback-url/s?q=${encodeURIComponent(character)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(`https://www.pleco.com/`);
    }
  };

  const openMDBG = async (character: string) => {
    await Linking.openURL(`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${encodeURIComponent(character)}`);
  };

  const openTatoeba = async (character: string) => {
    await Linking.openURL(`https://tatoeba.org/en/sentences/search?query=${encodeURIComponent(character)}&from=cmn&to=eng`);
  };

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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setAddToSetVisible(true)} style={{ marginRight: 15 }}>
                <MaterialIcons name='playlist-add' size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCopy} style={{ marginRight: 15 }}>
                <Ionicons name='copy-outline' size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleFavorite} style={{ marginRight: 15 }}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? Colors.wrong : Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )
        }} 
      />
      {copied && <Text style={styles.copiedToast}>Copied!</Text>}
      <AddToSetModal visible={addToSetVisible} onClose={() => setAddToSetVisible(false)} char={char as string} />
      
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
            <View style={styles.externalLinksRow}>
              <TouchableOpacity onPress={() => openPleco(char as string)}>
                <Text style={styles.externalLink}>Pleco ↗</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openMDBG(char as string)}>
                <Text style={styles.externalLink}>MDBG ↗</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openTatoeba(char as string)}>
                <Text style={styles.externalLink}>Tatoeba ↗</Text>
              </TouchableOpacity>
            </View>
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
                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.sentenceRow}
                    onPress={() => {
                      router.push({ pathname: '/sentence/[id]', params: { id: (item.rowid || item.id).toString() } } as any);
                    }}
                  >
                    <TappableSentence text={item.simplified} highlight={char as string} router={router} />
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
  strokeCountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -10, marginBottom: 20 },
  strokeCountLabel: { fontSize: 13, color: Colors.textMuted },
  strokeCountValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  copiedToast: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    zIndex: 1000
  },
  externalLinksRow: { flexDirection: 'row', marginTop: 16, gap: 16 },
  externalLink: { fontSize: 13, color: Colors.primary, marginRight: 16 },
  sentenceChar: { fontSize: 20, color: Colors.textPrimary, paddingHorizontal: 1 },
  highlighted: { color: Colors.primary, fontWeight: '700' },
  punctuation: { fontSize: 20, color: Colors.textMuted },
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
