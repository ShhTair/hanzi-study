import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

interface Word {
  word: string;
  pinyin: string;
  meaning: string;
  level: number;
}

export default function StudyScreen() {
  const db = useSQLiteContext();
  const [level, setLevel] = useState<number | null>(null);
  const [cards, setCards] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadLevel = async (hskLevel: number) => {
    setLoading(true);
    setLevel(hskLevel);
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

  const handleRate = async (rating: number) => {
    const card = cards[currentIndex];
    const now = Date.now();
    // Simple SRS logic
    // rating 1 = Forgot (Left), rating 5 = Remembered (Right)
    const easeFactor = rating === 5 ? 2.6 : 1.3;
    const interval = rating === 5 ? 1000 * 60 * 60 * 24 : 1000 * 60 * 5; // 1 day vs 5 mins
    const nextReview = now + interval;

    try {
      await db.runAsync(
        `INSERT INTO user_progress (word_id, srs_interval, next_review, ease_factor) 
         VALUES (?, ?, ?, ?)
         ON CONFLICT(word_id) DO UPDATE SET 
         srs_interval = excluded.srs_interval,
         next_review = excluded.next_review,
         ease_factor = excluded.ease_factor`,
        [card.word, interval, nextReview, easeFactor]
      );
    } catch (e) {
      console.error(e);
    }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Session complete
      setCards([]);
      setLevel(null);
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

  return (
    <View style={styles.container}>
      <Text style={styles.progressText}>
        Card {currentIndex + 1} of {cards.length}
      </Text>

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => setIsFlipped(true)}
      >
        <Text style={styles.cardWord}>{currentCard.word}</Text>

        {isFlipped ? (
          <View style={styles.cardBack}>
            <Text style={styles.cardPinyin}>{currentCard.pinyin}</Text>
            <Text style={styles.cardMeaning}>{currentCard.meaning}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>HSK {currentCard.level}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.hintText}>Tap to reveal</Text>
        )}
      </TouchableOpacity>

      {isFlipped && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.actionButton, styles.forgotButton]} onPress={() => handleRate(1)}>
            <Text style={styles.buttonText}>Forgot (Left)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.rememberedButton]} onPress={() => handleRate(5)}>
            <Text style={styles.buttonText}>Remembered (Right)</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  card: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
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
    gap: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  forgotButton: {
    backgroundColor: '#D95F45',
  },
  rememberedButton: {
    backgroundColor: '#5BA85A',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
