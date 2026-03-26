import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';

// These components will be implemented by Agent A
import { PinyinText } from '../../src/components/PinyinText';
import { useAudio } from '../../src/hooks/useAudio';

interface Word {
  word: string;
  pinyin: string;
  meaning: string;
  level: number;
}

export default function StudyScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  
  // Audio hook from Agent A
  // If it doesn't exist yet, we mock it gracefully to prevent crashes
  const useAudioHook = typeof useAudio === 'function' ? useAudio : () => ({ play: () => {}, isPlaying: false });
  const { play } = useAudioHook();

  const [level, setLevel] = useState<number | null>(null);
  const [cards, setCards] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stats
  const [startTime, setStartTime] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    correct: 0,
    rate1: 0,
    rate2: 0,
    rate3: 0,
    rate4: 0,
    rate5: 0,
  });

  // Swipe animation
  const translateX = useRef(new Animated.Value(0)).current;

  const loadLevel = async (hskLevel: number) => {
    setLoading(true);
    setLevel(hskLevel);
    setStartTime(Date.now());
    setStats({ total: 0, correct: 0, rate1: 0, rate2: 0, rate3: 0, rate4: 0, rate5: 0 });
    try {
      // In a real SRS we would join with user_progress and order by next_review
      const result = await db.getAllAsync<Word>('SELECT * FROM hsk WHERE level = ? ORDER BY random() LIMIT 50', [hskLevel]);
      setCards(result);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleFlip = () => {
    setIsFlipped(true);
    if (cards[currentIndex]) {
      play(cards[currentIndex].word);
    }
  };

  const handleRate = async (rating: number) => {
    const card = cards[currentIndex];
    const now = Date.now();

    // SM-2 Algorithm Implementation
    let ease = 2.5;
    let intervalMs = 0;

    try {
      const currentProgress = await db.getFirstAsync<{srs_interval: number, ease_factor: number}>(
        'SELECT srs_interval, ease_factor FROM user_progress WHERE word_id = ?',
        [card.word]
      );
      
      if (currentProgress) {
        ease = currentProgress.ease_factor || 2.5;
        intervalMs = currentProgress.srs_interval || 0;
      }
      
      let intervalDays = intervalMs / (1000 * 60 * 60 * 24);

      if (rating < 3) {
        intervalDays = 1;
      } else {
        ease = ease + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
        ease = Math.max(1.3, ease);
        
        if (intervalDays === 0) {
          intervalDays = 1;
        } else if (intervalDays === 1) {
          intervalDays = 6;
        } else {
          intervalDays = Math.round(intervalDays * ease);
        }
      }

      const newIntervalMs = intervalDays * 1000 * 60 * 60 * 24;
      const nextReview = now + newIntervalMs;

      await db.runAsync(
        `INSERT INTO user_progress (word_id, srs_interval, next_review, ease_factor) 
         VALUES (?, ?, ?, ?)
         ON CONFLICT(word_id) DO UPDATE SET 
         srs_interval = excluded.srs_interval,
         next_review = excluded.next_review,
         ease_factor = excluded.ease_factor`,
        [card.word, newIntervalMs, nextReview, ease]
      );
    } catch (e) {
      console.error(e);
    }

    // Update stats
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      correct: prev.correct + (rating >= 3 ? 1 : 0),
      rate1: prev.rate1 + (rating === 1 ? 1 : 0),
      rate2: prev.rate2 + (rating === 2 ? 1 : 0),
      rate3: prev.rate3 + (rating === 3 ? 1 : 0),
      rate4: prev.rate4 + (rating === 4 ? 1 : 0),
      rate5: prev.rate5 + (rating === 5 ? 1 : 0),
    }));

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      translateX.setValue(0);
    } else {
      // Session complete -> navigate to summary
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      router.replace({
        pathname: '/study-complete',
        params: {
          total: stats.total + 1,
          correct: stats.correct + (rating >= 3 ? 1 : 0),
          timeSpent,
          rate1: stats.rate1 + (rating === 1 ? 1 : 0),
          rate2: stats.rate2 + (rating === 2 ? 1 : 0),
          rate3: stats.rate3 + (rating === 3 ? 1 : 0),
          rate4: stats.rate4 + (rating === 4 ? 1 : 0),
          rate5: stats.rate5 + (rating === 5 ? 1 : 0),
        }
      });
      setCards([]);
      setLevel(null);
    }
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      if (translationX < -100) {
        // Swipe left
        handleRate(1);
      } else if (translationX > 100) {
        // Swipe right
        handleRate(5);
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!level || cards.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select HSK Level to Study</Text>
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
            <TouchableOpacity key={l} style={styles.levelButton} onPress={() => loadLevel(l)}>
              <Text style={styles.levelButtonText}>HSK {l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  const currentCard = cards[currentIndex];
  
  // Rotation for swipe
  const rotate = translateX.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.progressText}>
          Card {currentIndex + 1} of {cards.length}
        </Text>

        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          enabled={isFlipped}
        >
          <Animated.View style={[styles.cardWrapper, { transform: [{ translateX }, { rotate }] }]}>
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => !isFlipped && handleFlip()}
            >
              <Text style={styles.cardWord}>{currentCard.word}</Text>

              {isFlipped ? (
                <View style={styles.cardBack}>
                  {/* Replaced Text with PinyinText from Agent A */}
                  {PinyinText ? (
                    <PinyinText pinyin={currentCard.pinyin} size={28} />
                  ) : (
                    <Text style={styles.cardPinyin}>{currentCard.pinyin}</Text>
                  )}
                  <Text style={styles.cardMeaning}>{currentCard.meaning}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>HSK {currentCard.level}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.hintText}>Tap to reveal</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>

        {isFlipped && (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.actionButton, styles.btn1]} onPress={() => handleRate(1)}>
              <Text style={styles.buttonText}>1 Forgot</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.btn2]} onPress={() => handleRate(2)}>
              <Text style={styles.buttonText}>2 Hard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.btn3]} onPress={() => handleRate(3)}>
              <Text style={styles.buttonText}>3 Good</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.btn4]} onPress={() => handleRate(4)}>
              <Text style={styles.buttonText}>4 Easy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.btn5]} onPress={() => handleRate(5)}>
              <Text style={styles.buttonText}>5 Perfect</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  levelButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 100,
    alignItems: 'center',
  },
  levelButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  progressText: {
    color: '#888888',
    fontSize: 16,
    marginBottom: 20,
  },
  cardWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardWord: {
    fontSize: 80,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardBack: {
    alignItems: 'center',
    marginTop: 20,
  },
  cardPinyin: {
    fontSize: 28,
    color: '#4A90E2',
    marginBottom: 10,
  },
  cardMeaning: {
    fontSize: 20,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 14,
  },
  hintText: {
    color: '#666666',
    fontSize: 16,
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 40,
    width: '100%',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btn1: { backgroundColor: '#D95F45' }, // Red (Forgot)
  btn2: { backgroundColor: '#E8A838' }, // Orange (Hard)
  btn3: { backgroundColor: '#F1C40F' }, // Yellow (Good)
  btn4: { backgroundColor: '#82C070' }, // Light Green (Easy)
  btn5: { backgroundColor: '#5BA85A' }, // Green (Perfect)
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});