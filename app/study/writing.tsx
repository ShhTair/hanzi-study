import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Line, Polyline } from 'react-native-svg';
import { Colors } from '../../src/constants/colors';
import { updateSRS } from '../../src/db/database';
import { PinyinText } from '../../src/components/PinyinText';
import { useWritingCanvas, normalizePath, calculateDTW } from '../../src/hooks/useWritingCanvas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');
const CANVAS_SIZE = width * 0.85;

type Word = {
  word: string;
  pinyin: string;
  meaning: string;
  level: number;
};

export default function WritingScreen() {
  const router = useRouter();
  const lastCardTime = useRef(Date.now());
  const { level, set, mode: urlMode } = useLocalSearchParams<{ level?: string; set?: string; mode?: string }>();
  const levelNum = Number(level) || 1;
  const setNum = Number(set) || 0;
  const { colors } = useTheme();

  const [questions, setQuestions] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [medians, setMedians] = useState<number[][][]>([]);
  
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  const [showHint, setShowHint] = useState(false);
  const [writingMode, setWritingMode] = useState<'auto' | 'self_check'>('auto');
  const [evalResults, setEvalResults] = useState<{match: boolean, distance: number}[] | null>(null);
  const [sessionResults, setSessionResults] = useState<any[]>([]);

  // Use the custom hook
  const {
    panResponder,
    paths,
    currentPath,
    currentStrokeIndex,
    wrongAttempts,
    strokeFeedback,
    resetCanvas
  } = useWritingCanvas(medians, CANVAS_SIZE, writingMode);

  // Sync wrong attempts to component state
  useEffect(() => {
    if (wrongAttempts > wrongCount) {
      setWrongCount(wrongAttempts);
    }
  }, [wrongAttempts]);

  useEffect(() => {
    const init = async () => {
      const savedMode = await AsyncStorage.getItem('@hanzi_writing_mode');
      if (savedMode === 'self_check') setWritingMode('self_check');
      try {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        let qs;
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
    if (questions.length > 0 && currentIndex < questions.length) {
      loadMedians();
      resetCanvas();
      setShowHint(false);
      setEvalResults(null);
    }
  }, [currentIndex, questions]);

  useEffect(() => {
    return () => {
      if (currentIndex > 0 && currentIndex < questions.length) {
        const session = { mode: 'writing', level, setId: setNum, currentIndex, totalCards: questions.length, results: sessionResults, savedAt: Date.now() };
        AsyncStorage.setItem('@hanzi_saved_session', JSON.stringify(session));
      } else if (currentIndex >= questions.length && questions.length > 0) {
        AsyncStorage.removeItem('@hanzi_saved_session');
      }
    };
  }, [currentIndex, sessionResults, questions.length, level, setNum]);

  const loadMedians = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('hanzi.db');
      const row = await db.getFirstAsync<{ medians: string }>(
        'SELECT medians FROM graphics WHERE character = ?',
        [questions[currentIndex].word]
      );
      if (row && row.medians) {
        setMedians(JSON.parse(row.medians));
      } else {
        setMedians([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Check for completion in auto mode
    if (writingMode === 'auto' && medians.length > 0 && currentStrokeIndex >= medians.length) {
      setCorrectCount(prev => prev + 1);
      setTimeout(() => {
        advance(wrongCount === 0 && hintsUsed === 0);
      }, 800);
    }
  }, [currentStrokeIndex, medians, writingMode]);

  const advance = async (wasCorrect: boolean) => {
    const timeSpentSeconds = Math.round((Date.now() - lastCardTime.current) / 1000);
    lastCardTime.current = Date.now();
    const cappedTime = Math.min(timeSpentSeconds, 60);
    const db = await SQLite.openDatabaseAsync('hanzi.db');
    
    const card = questions[currentIndex];
    await db.runAsync('UPDATE user_progress SET studied_seconds = studied_seconds + ? WHERE word_id = ?', [cappedTime, card.word]);

    const rating = wasCorrect ? 4 : (wrongCount > 2 ? 1 : 3);
    await updateSRS(card.word, rating);

    const newResults = [...sessionResults, {
      word: card.word,
      correct: wasCorrect,
      pinyin: card.pinyin,
      meaning: card.meaning
    }];
    setSessionResults(newResults);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push({ pathname: '/study/summary', params: { results: JSON.stringify(newResults), mode: 'writing', level: levelNum, set: setNum } } as any);
    }
  };

  const evaluateSelfCheck = async () => {
    let correct = 0;
    const results = medians.map((expectedMedian, i) => {
      const userStroke = paths[i];
      if (!userStroke) return { match: false, distance: 999 };

      const userPoints = userStroke.map(pt => pt.split(',').map(Number));
      const normUser = normalizePath(userPoints);
      const normExpected = normalizePath(expectedMedian);
      const distance = calculateDTW(normUser, normExpected);
      
      // Threshold for self check
      const match = distance < 0.35;
      if (match) correct++;
      return { match, distance };
    });
    
    setEvalResults(results);
    const accuracy = medians.length > 0 ? correct / medians.length : 0;
    
    const card = questions[currentIndex];
    const rating = accuracy > 0.8 ? 3 : accuracy > 0.5 ? 2 : 1;
    await updateSRS(card.word, rating);
    
    const timeSpentSeconds = Math.round((Date.now() - lastCardTime.current) / 1000);
    lastCardTime.current = Date.now();
    const cappedTime = Math.min(timeSpentSeconds, 60);
    const db = await SQLite.openDatabaseAsync('hanzi.db');
    await db.runAsync('UPDATE user_progress SET studied_seconds = studied_seconds + ? WHERE word_id = ?', [cappedTime, card.word]);
    
    const newResults = [...sessionResults, {
      word: card.word,
      correct: accuracy > 0.8,
      pinyin: card.pinyin,
      meaning: card.meaning
    }];
    setSessionResults(newResults);
  };
  
  const handleMarkCorrect = async () => {
    const card = questions[currentIndex];
    await updateSRS(card.word, 4);
    
    const newResults = sessionResults.map(r => r.word === card.word ? { ...r, correct: true } : r);
    setSessionResults(newResults);
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push({ pathname: '/study/summary', params: { results: JSON.stringify(sessionResults), mode: 'writing', level: levelNum, set: setNum } } as any);
    }
  };

  const skipQuestion = () => {
    setHintsUsed(prev => prev + 1);
    advance(false);
  };

  const triggerHint = () => {
    setHintsUsed(prev => prev + 1);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 1500);
  };

  const renderGrid = () => (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Line x1={0} y1={CANVAS_SIZE / 2} x2={CANVAS_SIZE} y2={CANVAS_SIZE / 2} stroke={colors.divider} strokeWidth={2} strokeDasharray="6, 6" />
      <Line x1={CANVAS_SIZE / 2} y1={0} x2={CANVAS_SIZE / 2} y2={CANVAS_SIZE} stroke={colors.divider} strokeWidth={2} strokeDasharray="6, 6" />
      <Line x1={0} y1={0} x2={CANVAS_SIZE} y2={CANVAS_SIZE} stroke={colors.divider} strokeWidth={2} strokeDasharray="6, 6" />
      <Line x1={CANVAS_SIZE} y1={0} x2={0} y2={CANVAS_SIZE} stroke={colors.divider} strokeWidth={2} strokeDasharray="6, 6" />
    </Svg>
  );

  const getPointsPath = (pathStringArr: string[]) => {
    if (!pathStringArr || pathStringArr.length === 0) return '';
    return 'M ' + pathStringArr.map(pt => pt.replace(',', ' ')).join(' L ');
  };

  const getMedianPath = (medianPoints: number[][]) => {
    if (!medianPoints || medianPoints.length === 0) return '';
    const scaled = medianPoints.map(([x, y]) => {
      const normY = (900 - y) / 900;
      const normX = x / 900;
      return `${normX * CANVAS_SIZE} ${normY * CANVAS_SIZE}`;
    });
    return 'M ' + scaled.join(' L ');
  };

  const toggleMode = async () => {
    const next = writingMode === 'auto' ? 'self_check' : 'auto';
    setWritingMode(next);
    await AsyncStorage.setItem('@hanzi_writing_mode', next);
    resetCanvas();
    setEvalResults(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.center, {backgroundColor: colors.background}]}>
        <Text style={{ color: colors.textPrimary }}>No questions found.</Text>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const isWrong = strokeFeedback === 'wrong' && writingMode === 'auto';
  const shouldShowHint = showHint || isWrong;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <View style={styles.statBox}>
          <Ionicons name="checkmark-circle" size={20} color={colors.correct} />
          <Text style={[styles.statText, {color: '#FFF'}]}>{correctCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="close-circle" size={20} color={colors.wrong} />
          <Text style={[styles.statText, {color: '#FFF'}]}>{wrongCount}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={toggleMode} style={{ marginRight: 16 }}>
          <Text style={{color: '#FFF', fontSize: 14, fontWeight: 'bold'}}>
            {writingMode === 'auto' ? 'Auto Detect' : 'Self Check'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.topArea}>
        <PinyinText pinyin={currentQ.pinyin} size={32} style={{ marginBottom: 12 }} />
        <Text style={[styles.meaningText, {color: colors.textSecondary}]}>{currentQ.meaning}</Text>
      </View>

      <View style={styles.center}>
        <View 
          style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE, backgroundColor: colors.card, borderColor: colors.border }]}
          {...panResponder.panHandlers}
        >
          {renderGrid()}
          
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Draw already completed strokes */}
            {paths.map((p, i) => {
              let strokeColor = colors.textPrimary;
              if (writingMode === 'self_check' && evalResults && evalResults[i]) {
                strokeColor = evalResults[i].match ? colors.correct : colors.wrong;
              } else if (writingMode !== 'self_check') {
                strokeColor = strokeFeedback === 'wrong' && i === paths.length - 1 ? colors.wrong : colors.textPrimary;
              }
              return (
                <Polyline
                  key={`drawn-${i}`}
                  points={p.map(pt => pt.replace(',', ' ')).join(' ')}
                  stroke={strokeColor}
                  strokeWidth={12}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
            
            {/* Draw current stroke being drawn */}
            {currentPath.length > 0 && (
              <Polyline points={currentPath.map(pt => pt.replace(',', ' ')).join(' ')} stroke={colors.textPrimary} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Hint / Wrong Feedback */}
            {shouldShowHint && medians[currentStrokeIndex] && (
              <Path 
                d={getMedianPath(medians[currentStrokeIndex])} 
                stroke={colors.primary} 
                strokeWidth={12} 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                strokeOpacity={0.6}
              />
            )}
          </Svg>

          {isWrong && (
            <View style={styles.wrongIndicator}>
              <Ionicons name="close-circle" size={48} color={colors.wrong} />
            </View>
          )}

          {evalResults && (
            <View style={{position: 'absolute', bottom: '35%', alignSelf: 'center', backgroundColor: colors.cardElevated, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 5}}>
              <Text style={{color: colors.textPrimary, fontSize: 18, fontWeight: 'bold'}}>Accuracy: {Math.round((evalResults.filter(r => r.match).length / medians.length) * 100)}%</Text>
              <View style={{flexDirection: 'row', gap: 12, marginTop: 12}}>
                <TouchableOpacity onPress={handleMarkCorrect} style={{backgroundColor: colors.correct, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8}}>
                  <Text style={{color: '#FFF', fontWeight: 'bold'}}>Mark Correct</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={nextQuestion} style={{backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8}}>
                  <Text style={{color: '#FFF', fontWeight: 'bold'}}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomArea}>
        {!evalResults && (
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: colors.card, borderColor: colors.border}]} onPress={triggerHint}>
            <Ionicons name="bulb-outline" size={24} color={colors.textPrimary} />
            <Text style={[styles.actionText, {color: colors.textPrimary}]}>Hint</Text>
          </TouchableOpacity>
        )}

        {writingMode === 'self_check' && !evalResults && paths.length > 0 && (
          <TouchableOpacity 
            onPress={evaluateSelfCheck}
            style={[styles.actionBtn, {backgroundColor: colors.primary, borderColor: colors.primary, minWidth: 120}]}>
            <Ionicons name="checkmark" size={24} color="#FFF" />
            <Text style={[styles.actionText, {color: '#FFF'}]}>Check</Text>
          </TouchableOpacity>
        )}

        {!evalResults && (
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: colors.card, borderColor: colors.border}]} onPress={skipQuestion}>
            <Ionicons name="play-skip-forward-outline" size={24} color={colors.textPrimary} />
            <Text style={[styles.actionText, {color: colors.textPrimary}]}>Skip</Text>
          </TouchableOpacity>
        )}
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
  statBox: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  statText: { fontSize: 16, fontWeight: 'bold', marginLeft: 4 },
  topArea: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  meaningText: { fontSize: 18, textAlign: 'center' },
  canvas: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
  },
  wrongIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  bottomArea: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 24,
  },
  actionBtn: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 90,
    borderWidth: 1,
  },
  actionText: { fontSize: 14, marginTop: 4, fontWeight: '600' },
});
