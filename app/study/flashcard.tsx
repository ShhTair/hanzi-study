import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, G } from 'react-native-svg';
import { Colors } from '../../src/constants/colors';
import { updateSRS, getWordsContaining, getSentencesContaining, toggleFavorite, isFavorite } from '../../src/db/database';
import { PinyinText } from '../../src/components/PinyinText';
import { useAudio } from '../../src/hooks/useAudio';

type Word = {
  word: string;
  pinyin: string;
  meaning: string;
  level: number;
};

type Graphics = {
  strokes: string[];
};

export default function FlashcardScreen() {
  const router = useRouter();
  const { level, set } = useLocalSearchParams();
  const levelNum = Number(level) || 1;
  const setNum = Number(set) || 0;

  const [cards, setCards] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPinyinBefore, setShowPinyinBefore] = useState(false);
  
  const [graphics, setGraphics] = useState<Graphics | null>(null);
  const [vocab, setVocab] = useState<any[]>([]);
  const [sentence, setSentence] = useState<any[]>([]);
  const [favorited, setFavorited] = useState(false);
  
  const [strokeCount, setStrokeCount] = useState(0);
  const [sessionResults, setSessionResults] = useState<any[]>([]);
  const animationTimer = useRef<NodeJS.Timeout | null>(null);

  const flipAnim = useRef(new Animated.Value(0)).current;

  // Audio Hook
  const { speakCharacter } = useAudio();

  useEffect(() => {
    const init = async () => {
      try {
        const pinyinSetting = await AsyncStorage.getItem('@hanzi_show_pinyin_before_flip');
        setShowPinyinBefore(pinyinSetting === 'true');

        const db = await SQLite.openDatabaseAsync('hanzi.db');
        const chars = await db.getAllAsync<Word>(
          'SELECT word, pinyin, meaning, level FROM hsk WHERE level = ? LIMIT 10 OFFSET ?',
          [levelNum, setNum * 10]
        );
        setCards(chars);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [levelNum, setNum]);

  const loadCardData = async (word: string) => {
    try {
      const db = await SQLite.openDatabaseAsync('hanzi.db');
      const gRow = await db.getFirstAsync<{ strokes: string }>('SELECT strokes FROM graphics WHERE character = ?', [word]);
      if (gRow) {
        setGraphics({ strokes: JSON.parse(gRow.strokes) });
      } else {
        setGraphics(null);
      }

      const isFav = await isFavorite(word);
      setFavorited(isFav);

      const w = await getWordsContaining(word);
      setVocab(w.slice(0, 3));

      const s = await getSentencesContaining(word);
      setSentence(s.slice(0, 1));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length) {
      setIsFlipped(false);
      flipAnim.setValue(0);
      loadCardData(cards[currentIndex].word);
    }
  }, [currentIndex, cards]);

  useEffect(() => {
    if (graphics && graphics.strokes) {
      playStrokeAnimation();
    }
    return () => {
      if (animationTimer.current) clearInterval(animationTimer.current);
    };
  }, [graphics]);

  const playStrokeAnimation = () => {
    if (animationTimer.current) clearInterval(animationTimer.current);
    setStrokeCount(0);
    if (!graphics || !graphics.strokes) return;
    
    let count = 0;
    animationTimer.current = setInterval(() => {
      count++;
      setStrokeCount(count);
      if (count >= graphics.strokes.length) {
        if (animationTimer.current) clearInterval(animationTimer.current);
      }
    }, 400);
  };

  const handleFlip = () => {
    if (isFlipped) return;
    setIsFlipped(true);
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    if (cards[currentIndex]) {
      speakCharacter(cards[currentIndex].word);
    }
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const handleRate = async (rating: number) => {
    const card = cards[currentIndex];
    await updateSRS(card.word, rating);
    
    const newResults = [...sessionResults, {
      word: card.word,
      correct: rating >= 3,
      pinyin: card.pinyin,
      meaning: card.meaning
    }];
    setSessionResults(newResults);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push({ pathname: '/study/summary', params: { results: JSON.stringify(newResults), mode: 'flashcard', level: levelNum, set: setNum } } as any);
    }
  };

  const handleToggleFavorite = async () => {
    const card = cards[currentIndex];
    if (card) {
      const fav = await toggleFavorite(card.word);
      setFavorited(fav);
    }
  };

  const shuffleCards = () => {
    setCards(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: Colors.textPrimary }}>No characters found.</Text>
      </View>
    );
  }

  const card = cards[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HSK {levelNum} Set {setNum}</Text>
        <Text style={styles.counter}>{currentIndex + 1}/{cards.length}</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.cardContainer} onPress={handleFlip} activeOpacity={0.9}>
          {/* Front Face */}
          <Animated.View style={[styles.cardFace, { transform: [{ rotateY: frontInterpolate }] }]}>
            <View style={styles.svgContainer}>
              {graphics && graphics.strokes && (
                <Svg width="180" height="180" viewBox="0 0 1024 1024" style={{ transform: [{ scaleY: -1 }] }}>
                  <G>
                    {graphics.strokes.map((stroke, i) => (
                      <Path
                        key={i}
                        d={stroke}
                        fill={i < strokeCount ? Colors.textPrimary : Colors.divider}
                      />
                    ))}
                  </G>
                </Svg>
              )}
            </View>
            {showPinyinBefore && (
              <PinyinText pinyin={card.pinyin} size={24} style={styles.pinyinFront} />
            )}
            <View style={styles.vocabPreview}>
              {vocab.map((v, i) => (
                <Text key={i} style={styles.vocabText}>{v.simplified} - {v.meanings.split('/')[0]}</Text>
              ))}
            </View>
          </Animated.View>

          {/* Back Face */}
          <Animated.View style={[styles.cardFace, styles.cardBack, { transform: [{ rotateY: backInterpolate }] }]}>
            <PinyinText pinyin={card.pinyin} size={32} style={styles.pinyinBack} />
            <Text style={styles.meaningText}>{card.meaning}</Text>
            {sentence.length > 0 && (
              <View style={styles.sentenceBox}>
                <Text style={styles.sentenceChar}>{sentence[0].simplified}</Text>
                <PinyinText pinyin={sentence[0].pinyin} size={14} />
                <Text style={styles.sentenceMeaning}>{sentence[0].meanings.split('/')[0]}</Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>

      {isFlipped ? (
        <View style={styles.srsBar}>
          <TouchableOpacity style={[styles.srsBtn, { backgroundColor: Colors.wrong }]} onPress={() => handleRate(1)}>
            <Text style={styles.srsText}>Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.srsBtn, { backgroundColor: Colors.warning }]} onPress={() => handleRate(2)}>
            <Text style={styles.srsText}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.srsBtn, { backgroundColor: Colors.primary }]} onPress={() => handleRate(3)}>
            <Text style={styles.srsText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.srsBtn, { backgroundColor: Colors.correct }]} onPress={() => handleRate(4)}>
            <Text style={styles.srsText}>Easy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.srsBtn, { backgroundColor: Colors.tone4 }]} onPress={() => handleRate(5)}>
            <Text style={styles.srsText}>Perfect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/character/${encodeURIComponent(card.word)}` as any)}>
            <MaterialIcons name="info-outline" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleToggleFavorite}>
            <MaterialIcons name={favorited ? "star" : "star-border"} size={28} color={favorited ? Colors.primary : Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={playStrokeAnimation}>
            <MaterialIcons name="play-circle-outline" size={32} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="format-list-bulleted" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={shuffleCards}>
            <MaterialIcons name="shuffle" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 60,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: { marginRight: 16 },
  headerTitle: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  counter: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  cardContainer: { flex: 1, position: 'relative' },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    justifyContent: 'center',
  },
  svgContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  pinyinFront: { marginTop: 16, marginBottom: 8 },
  vocabPreview: { marginTop: 'auto', width: '100%', alignItems: 'center' },
  vocabText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 4 },
  pinyinBack: { marginBottom: 16 },
  meaningText: { color: Colors.textPrimary, fontSize: 18, textAlign: 'center', marginBottom: 32 },
  sentenceBox: { backgroundColor: Colors.background, padding: 16, borderRadius: 12, width: '100%' },
  sentenceChar: { color: Colors.textPrimary, fontSize: 18, marginBottom: 4 },
  sentenceMeaning: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  iconBtn: { padding: 8 },
  srsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  srsBtn: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  srsText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});
