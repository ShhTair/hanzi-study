import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useDatabase } from '../../src/hooks/useDatabase';
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
  const { char } = useLocalSearchParams();
  const { db, getCharacterDetail } = useDatabase();
  const { play } = useAudio();
  const [characterData, setCharacterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playTrigger, setPlayTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('Meanings');
  const [isFavorite, setIsFavorite] = useState(false);

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
          headerStyle: { backgroundColor: '#121212' }, 
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={toggleFavorite} style={{ marginRight: 15 }}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#ff4d4f' : '#fff'} />
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
        <TouchableOpacity onPress={() => play(char as string)} style={{ marginLeft: 16 }}>
          <Ionicons name='volume-high' size={28} color='#4A90E2' />
        </TouchableOpacity>
        {characterData.hsk_level && (
          <View style={styles.hskBadge}>
            <Text style={styles.hskText}>HSK {characterData.hsk_level}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {['Meanings', 'Strokes', 'Components', 'Details'].map(tab => (
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

        {activeTab === 'Components' && (
          <View style={styles.componentsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Radical</Text>
              <Text style={styles.statValue}>{characterData.radical || '-'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Decomposition</Text>
              <Text style={styles.meaningText}>{strokeData?.decomposition || '-'}</Text>
            </View>
          </View>
        )}

        {activeTab === 'Details' && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Radical</Text>
              <Text style={styles.statValue}>{characterData.radical || '-'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Strokes</Text>
              <Text style={styles.statValue}>{characterData.stroke_count || '-'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Frequency Rank</Text>
              <Text style={styles.statValue}>{characterData.frequency_rank || '-'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Traditional Form</Text>
              <Text style={styles.statValue}>{characterData.traditional || '-'}</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  svgContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1E1E1E',
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
    backgroundColor: '#2b5c8f',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 16,
  },
  hskText: {
    color: '#fff',
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
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4A90E2',
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
    color: '#fff',
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
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
