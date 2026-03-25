import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useDatabase } from '../../../src/hooks/useDatabase';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// The exact length of stroke paths in Make Me a Hanzi isn't known upfront without getTotalLength(),
// but since the coordinate space is 1024x1024, a max length of ~3500 covers almost any single stroke.
const MAX_PATH_LENGTH = 3500;

function Stroke({ d, index, playTrigger }: { d: string; index: number; playTrigger: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Reset and animate
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
  const { getCharacterDetail } = useDatabase();
  const [characterData, setCharacterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playTrigger, setPlayTrigger] = useState(0);

  useEffect(() => {
    async function load() {
      if (typeof char === 'string') {
        const data = await getCharacterDetail(char);
        setCharacterData(data);
      }
      setLoading(false);
    }
    load();
  }, [char, getCharacterDetail]);

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
      <Stack.Screen options={{ title: char as string, headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#fff' }} />
      
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

      <View style={styles.playButtonContainer}>
        <TouchableOpacity style={styles.playButton} onPress={() => setPlayTrigger(p => p + 1)}>
          <Text style={styles.playButtonText}>Replay Animation</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.pinyinContainer}>
          <Text style={styles.pinyin}>{characterData.pinyin}</Text>
          {characterData.hsk_level && (
            <View style={styles.hskBadge}>
              <Text style={styles.hskText}>HSK {characterData.hsk_level}</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Meanings</Text>
        <View style={styles.meaningsContainer}>
          {meanings.map((meaning: string, idx: number) => (
            <View key={idx} style={styles.meaningItem}>
              <Text style={styles.meaningText}>• {meaning}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Details</Text>
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
            <Text style={styles.statLabel}>Frequency</Text>
            <Text style={styles.statValue}>{characterData.frequency_rank || '-'}</Text>
          </View>
        </View>
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
    // Note: MakeMeAHanzi coordinates have Y axis pointing down, but sometimes it needs flipping.
    // Standard MakeMeAHanzi coordinates require a scaleY(-1) and translateY(-1024) technically, 
    // but React Native SVG handles standard SVG paths just fine if we transform it.
    transform: [{ scaleY: -1 }],
  },
  playButtonContainer: {
    alignItems: 'center',
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
  detailsContainer: {
    flex: 1,
  },
  pinyinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  pinyin: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 16,
  },
  hskBadge: {
    backgroundColor: '#2b5c8f',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hskText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 12,
    marginTop: 8,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
