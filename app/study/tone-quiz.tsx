import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { updateSRS } from '../../src/db/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/context/ThemeContext';

type Word = {
  word: string;
  pinyin: string;
  meaning: string;
  level: number;
};

function getToneNumber(pinyin: string): 1|2|3|4|5 {
  if (/[āēīōūǖ]/.test(pinyin)) return 1;
  if (/[áéíóúǘ]/.test(pinyin)) return 2;
  if (/[ǎěǐǒǔǚ]/.test(pinyin)) return 3;
  if (/[àèìòùǜ]/.test(pinyin)) return 4;
  return 5;
}

function stripTones(pinyin: string): string {
  return pinyin
    .replace(/[āáǎà]/g, 'a')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o')
    .replace(/[ūúǔù]/g, 'u')
    .replace(/[ǖǘǚǜ]/g, 'ü');
}

export default function ToneQuizScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const lastCardTime = useRef(Date.now());
  const { level, set, mode: urlMode } = useLocalSearchParams<{ level?: string; set?: string; mode?: string }>();
  const levelNum = Number(level) || 1;
  const setNum = Number(set) || 0;

  const [questions, setQuestions] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedTone, setSelectedTone] = useState<number | null>(null);
  const [correctTone, setCorrectTone] = useState<number | null>(null);
  
  const [sessionResults, setSessionResults] = useState<any[]>([]);

  // Combo tracking
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        let qs: Word[];
        if (level === 'custom') {
          qs = await db.getAllAsync<Word>(
            'SELECT h.word, h.pinyin, h.meaning, h.level FROM custom_set_chars c JOIN hsk h ON c.word = h.word WHERE c.set_id = ? ORDER BY c.position',
            [setNum]
          );
        } else {
          qs = await db.getAllAsync<Word>(
            'SELECT word, pinyin, meaning, level FROM hsk WHERE level = ? LIMIT 10 OFFSET ?',
            [levelNum, setNum * 10]
          );
        }
        setQuestions(qs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [level, levelNum, setNum]);

  useEffect(() => {
    return () => {
      if (currentIndex > 0 && currentIndex < questions.length) {
        const session = { mode: 'tone_quiz', level, setId: setNum, currentIndex, totalCards: questions.length, results: sessionResults, savedAt: Date.now() };
        AsyncStorage.setItem('@hanzi_saved_session', JSON.stringify(session));
      } else if (currentIndex >= questions.length && questions.length > 0) {
        AsyncStorage.removeItem('@hanzi_saved_session');
      }
    };
  }, [currentIndex, sessionResults, questions.length, level, setNum]);

  const handleAnswer = async (tone: number) => {
    if (selectedTone !== null) return;
    
    const timeSpentSeconds = Math.round((Date.now() - lastCardTime.current) / 1000);
    lastCardTime.current = Date.now();
    const cappedTime = Math.min(timeSpentSeconds, 60);
    const db = await SQLite.openDatabaseAsync('hanzi.db');
    
    const card = questions[currentIndex];
    const actualTone = getToneNumber(card.pinyin);
    const isCorrect = tone === actualTone;
    
    setSelectedTone(tone);
    setCorrectTone(actualTone);

    await db.runAsync('UPDATE user_progress SET studied_seconds = studied_seconds + ? WHERE word_id = ?', [cappedTime, card.word]);
    await updateSRS(card.word, isCorrect ? 3 : 1);

    if (!isCorrect) {
      await db.runAsync(
        'INSERT INTO tone_errors (word, wrong_tone, correct_tone) VALUES (?, ?, ?)',
        [card.word, tone, actualTone]
      );
      setCombo(0);
    } else {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > bestCombo) setBestCombo(newCombo);
    }

    const newResults = [...sessionResults, {
      word: card.word,
      correct: isCorrect,
      pinyin: card.pinyin,
      meaning: card.meaning
    }];
    setSessionResults(newResults);

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        setSelectedTone(null);
        setCorrectTone(null);
      } else {
        router.push({ pathname: '/study/summary', params: { results: JSON.stringify(newResults), mode: 'tone_quiz', level, set: setNum, bestCombo: Math.max(bestCombo, isCorrect ? combo + 1 : combo) } } as any);
      }
    }, 800);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>No questions found.</Text>
      </View>
    );
  }

  const card = questions[currentIndex];
  const untonedPinyin = stripTones(card.pinyin);

  const renderToneButton = (tone: number, label: string, color: string) => {
    const isSelected = selectedTone === tone;
    const isActual = correctTone === tone;
    const isWrong = isSelected && !isActual;
    const isCorrectPick = isSelected && isActual;

    let bgColor = color + '4D'; // 30% opacity
    let borderColor = 'transparent';
    let opacity = 1;

    if (selectedTone !== null) {
      if (isActual) {
        bgColor = color;
      } else if (isWrong) {
        bgColor = colors.wrong + '4D';
        borderColor = colors.wrong;
      } else {
        opacity = 0.5;
      }
    }

    return (
      <TouchableOpacity 
        key={tone}
        style={[styles.toneBtn, { backgroundColor: bgColor, borderColor, borderWidth: isWrong ? 2 : 0, opacity }]}
        onPress={() => handleAnswer(tone)}
        activeOpacity={0.7}
      >
        <Text style={[styles.toneLabel, selectedTone !== null && isActual ? {color: '#FFF'} : {color: colors.textPrimary}]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tone Practice</Text>
        <Text style={styles.counter}>{currentIndex + 1}/{questions.length}</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.largeChar, { color: colors.textPrimary }]}>{card.word}</Text>
          <Text style={[styles.untonedPinyin, { color: colors.textSecondary }]}>{untonedPinyin}</Text>
        </View>

        <View style={styles.buttonsGrid}>
          {renderToneButton(1, '1st — mā', colors.tone1)}
          {renderToneButton(2, '2nd — má', colors.tone2)}
          {renderToneButton(3, '3rd — mǎ', colors.tone3)}
          {renderToneButton(4, '4th — mà', colors.tone4)}
        </View>
        <View style={styles.neutralContainer}>
          {renderToneButton(5, 'Neutral — ma', colors.toneN)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: { marginRight: 16 },
  headerTitle: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  counter: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  cardContainer: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    maxHeight: 300,
  },
  largeChar: { fontSize: 80, fontWeight: 'bold', marginBottom: 16 },
  untonedPinyin: { fontSize: 24, letterSpacing: 2 },
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  toneBtn: {
    width: '47%',
    aspectRatio: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toneLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  neutralContainer: {
    marginTop: 16,
    alignItems: 'center',
  }
});
