import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import Reanimated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { updateSRS } from '../../src/db/database';
import { PinyinText } from '../../src/components/PinyinText';

type Word = {
  word: string;
  pinyin: string;
  meaning: string;
  level: number;
};

export default function QuizScreen() {
  const router = useRouter();
  const lastCardTime = useRef(Date.now());
  const { level, set } = useLocalSearchParams<{ level?: string; set?: string }>();
  const levelNum = Number(level) || 1;
  const setNum = Number(set) || 0;

  const [questions, setQuestions] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [combo, setCombo] = useState(0);
  
  const [time, setTime] = useState(0);
  const [sessionResults, setSessionResults] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  const comboAnim = useRef(new Animated.Value(0)).current;
  const borderPulse = useSharedValue(0);
  const [showPanda, setShowPanda] = useState(false);
  const [bestCombo, setBestCombo] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        const qs = await db.getAllAsync<Word>(
          'SELECT word, pinyin, meaning, level FROM hsk WHERE level = ? LIMIT 10 OFFSET ?',
          [levelNum, setNum * 10]
        );
        setQuestions(qs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [levelNum, setNum]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && !loading && currentIndex < questions.length) {
      timer = setInterval(() => setTime(t => t + 1), 1000);
    }
  const pulseStyle = useAnimatedStyle(() => ({
    borderColor: Colors.primary,
    borderWidth: 3,
    opacity: borderPulse.value,
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  } as any));
  return () => clearInterval(timer);
  }, [isPaused, loading, currentIndex, questions.length]);

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      loadOptions();
    }
  }, [currentIndex, questions]);

  const loadOptions = async () => {
    try {
      const currentWord = questions[currentIndex].word;
      const db = await SQLite.openDatabaseAsync('hanzi.db');
      const distractors = await db.getAllAsync<{word: string}>(
        'SELECT word FROM hsk WHERE level = ? AND word != ? ORDER BY random() LIMIT 7',
        [levelNum, currentWord]
      );
      
      const allOptions = [currentWord, ...distractors.map(d => d.word)];
      // Shuffle options
      const shuffled = allOptions.sort(() => Math.random() - 0.5);
      setOptions(shuffled);
      setSelectedOption(null);
    } catch (e) {
      console.error(e);
    }
  };

    const handleSelect = async (opt: string) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(opt);
    const correctWord = questions[currentIndex].word;
    const isCorrect = opt === correctWord;
    
    const timeSpentSeconds = Math.round((Date.now() - lastCardTime.current) / 1000);
    lastCardTime.current = Date.now();
    const cappedTime = Math.min(timeSpentSeconds, 60);
    const db = await SQLite.openDatabaseAsync('hanzi.db');
    await db.runAsync('UPDATE user_progress SET studied_seconds = studied_seconds + ? WHERE word_id = ?', [cappedTime, correctWord]);

    if (isCorrect) {
      await updateSRS(correctWord, 4);
      setCorrectCount(prev => prev + 1);
      
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > bestCombo) setBestCombo(newCombo);
      
      if (newCombo === 3 || newCombo === 5 || newCombo === 10) {
        Animated.sequence([
          Animated.timing(comboAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.delay(400),
          Animated.timing(comboAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      }
      if (newCombo === 5) {
        borderPulse.value = withSequence(
          withTiming(0.8, { duration: 150 }),
          withTiming(0, { duration: 150 }),
          withTiming(0.8, { duration: 150 }),
          withTiming(0, { duration: 150 })
        );
      }
      if (newCombo === 10) {
        setShowPanda(true);
        setTimeout(() => setShowPanda(false), 2000);
      }

      setTimeout(() => advance(true), 300);
    } else {
      await updateSRS(correctWord, 1);
      setWrongCount(prev => prev + 1);
      setCombo(0);
      setTimeout(() => advance(false), 600);
    }
  };

  const advance = (wasCorrect: boolean) => {
    const q = questions[currentIndex];
    const newResults = [...sessionResults, {
      word: q.word,
      correct: wasCorrect,
      pinyin: q.pinyin,
      meaning: q.meaning
    }];
    setSessionResults(newResults);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push({ pathname: '/study/summary', params: { results: JSON.stringify(newResults), mode: 'quiz', level: levelNum, set: setNum, bestCombo: bestCombo } } as any);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: Colors.textPrimary }}>No questions found.</Text>
      </View>
    );
  }

  
  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex) / questions.length) * 100;

  const pulseStyle = useAnimatedStyle(() => ({
    borderColor: Colors.primary,
    borderWidth: 3,
    opacity: borderPulse.value,
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  } as any));

  return (
    <View style={styles.container}>
      <Reanimated.View style={pulseStyle} />
      {showPanda && (
        <View style={styles.pandaPopup}>
          <Text style={{fontSize: 60}}>🐼</Text>
          <Text style={styles.pandaText}>连击! Liánjī!</Text>
        </View>
      )}
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.statBox}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.correct} />
          <Text style={styles.statText}>{correctCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="close-circle" size={20} color={Colors.wrong} />
          <Text style={styles.statText}>{wrongCount}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={styles.timerText}>{formatTime(time)}</Text>
        <TouchableOpacity onPress={() => setIsPaused(!isPaused)} style={styles.pauseBtn}>
          <Ionicons name={isPaused ? "play" : "pause"} size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Question Area */}
      <View style={styles.questionArea}>
        <Animated.View style={[styles.comboBadge, { opacity: comboAnim, transform: [{ translateY: comboAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Text style={styles.comboText}>+COMBO x{combo}</Text>
        </Animated.View>
        <PinyinText pinyin={currentQ.pinyin} size={36} style={{ marginBottom: 16 }} />
        <Text style={styles.meaningText}>{currentQ.meaning}</Text>
      </View>

      {/* Options Grid */}
      <View style={styles.optionsGrid}>
        {options.map((opt, i) => {
          const isCorrect = opt === currentQ.word;
          const isSelected = opt === selectedOption;
          
          let bgColor = Colors.card;
          if (selectedOption !== null) {
            if (isCorrect) bgColor = Colors.correct;
            else if (isSelected) bgColor = Colors.wrong;
          }

          return (
            <TouchableOpacity 
              key={i} 
              style={[styles.optionBtn, { backgroundColor: bgColor }]}
              onPress={() => handleSelect(opt)}
              activeOpacity={0.7}
              disabled={selectedOption !== null || isPaused}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pandaPopup: { position: 'absolute', top: '40%', alignSelf: 'center', alignItems: 'center', backgroundColor: Colors.cardElevated, padding: 20, borderRadius: 20, zIndex: 100, elevation: 10 },
  pandaText: { color: Colors.primary, fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 60,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statBox: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  statText: { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginLeft: 4 },
  timerText: { color: Colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginRight: 16 },
  pauseBtn: { padding: 4 },
  progressBarBg: { height: 4, backgroundColor: Colors.divider },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary },
  questionArea: {
    flex: 0.38,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    position: 'relative',
  },
  meaningText: { color: Colors.textPrimary, fontSize: 20, textAlign: 'center' },
  comboBadge: {
    position: 'absolute',
    top: 20,
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  comboText: { color: Colors.textPrimary, fontWeight: 'bold', fontSize: 14 },
  optionsGrid: {
    flex: 0.62,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
    alignContent: 'flex-start',
  },
  optionBtn: {
    width: '48%',
    aspectRatio: 1.5,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: '4%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionText: { color: Colors.textPrimary, fontSize: 36, fontWeight: '600' },
});
