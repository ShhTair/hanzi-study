import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Line, Circle, Polyline } from 'react-native-svg';
import { Colors } from '../../src/constants/colors';
import { updateSRS } from '../../src/db/database';
import { PinyinText } from '../../src/components/PinyinText';
import { useWritingCanvas } from '../../src/hooks/useWritingCanvas';

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
  const { level, set } = useLocalSearchParams();
  const levelNum = Number(level) || 1;
  const setNum = Number(set) || 0;

  const [questions, setQuestions] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [medians, setMedians] = useState<number[][][]>([]);
  
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  const [showHint, setShowHint] = useState(false);

  // Use the custom hook
  const {
    panResponder,
    paths,
    currentPath,
    currentStrokeIndex,
    wrongAttempts,
    strokeFeedback,
    resetCanvas
  } = useWritingCanvas(medians, CANVAS_SIZE);

  // Sync wrong attempts to component state
  useEffect(() => {
    if (wrongAttempts > wrongCount) {
      setWrongCount(wrongAttempts);
    }
  }, [wrongAttempts]);

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
    if (questions.length > 0 && currentIndex < questions.length) {
      loadMedians();
      resetCanvas();
      setShowHint(false);
    }
  }, [currentIndex, questions]);

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
    // Check for completion
    if (medians.length > 0 && currentStrokeIndex >= medians.length) {
      setCorrectCount(prev => prev + 1);
      setTimeout(() => {
        advance();
      }, 800);
    }
  }, [currentStrokeIndex, medians]);

  const advance = async () => {
    // Optionally record SRS based on wrong attempts
    const rating = wrongCount === 0 && hintsUsed === 0 ? 4 : (wrongCount > 2 ? 1 : 3);
    await updateSRS(questions[currentIndex].word, rating);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push('/study/summary');
    }
  };

  const skipQuestion = () => {
    setHintsUsed(prev => prev + 1);
    advance();
  };

  const triggerHint = () => {
    setHintsUsed(prev => prev + 1);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 1500);
  };

  const renderGrid = () => (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Line x1={0} y1={CANVAS_SIZE / 2} x2={CANVAS_SIZE} y2={CANVAS_SIZE / 2} stroke={Colors.divider} strokeWidth={2} strokeDasharray="6, 6" />
      <Line x1={CANVAS_SIZE / 2} y1={0} x2={CANVAS_SIZE / 2} y2={CANVAS_SIZE} stroke={Colors.divider} strokeWidth={2} strokeDasharray="6, 6" />
      <Line x1={0} y1={0} x2={CANVAS_SIZE} y2={CANVAS_SIZE} stroke={Colors.divider} strokeWidth={2} strokeDasharray="6, 6" />
      <Line x1={CANVAS_SIZE} y1={0} x2={0} y2={CANVAS_SIZE} stroke={Colors.divider} strokeWidth={2} strokeDasharray="6, 6" />
    </Svg>
  );

  const getPointsPath = (pathStringArr: string[]) => {
    if (!pathStringArr || pathStringArr.length === 0) return '';
    return 'M ' + pathStringArr.map(pt => pt.replace(',', ' ')).join(' L ');
  };

  const getMedianPath = (medianPoints: number[][]) => {
    if (!medianPoints || medianPoints.length === 0) return '';
    const scaled = medianPoints.map(([x, y]) => {
      // rawY is 0-900 MakeMeAHanzi coordinates.
      // normalizeY = (900 - rawY) / 900
      const normY = (900 - y) / 900;
      const normX = x / 900;
      return `${normX * CANVAS_SIZE} ${normY * CANVAS_SIZE}`;
    });
    return 'M ' + scaled.join(' L ');
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
  const isWrong = strokeFeedback === 'wrong';
  const shouldShowHint = showHint || isWrong;

  return (
    <View style={styles.container}>
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
        <View style={styles.statBox}>
          <Ionicons name="help-circle" size={20} color={Colors.warning} />
          <Text style={styles.statText}>{hintsUsed}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.topArea}>
        <PinyinText pinyin={currentQ.pinyin} size={32} style={{ marginBottom: 12 }} />
        <Text style={styles.meaningText}>{currentQ.meaning}</Text>
      </View>

      <View style={styles.center}>
        <View 
          style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}
          {...panResponder.panHandlers}
        >
          {renderGrid()}
          
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Draw already completed strokes */}
            {paths.map((p, i) => (
              <Path key={`done-${i}`} d={getPointsPath(p)} stroke="#F0FFF0" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            
            {/* Draw current stroke being drawn */}
            {currentPath.length > 0 && (
              <Path d={getPointsPath(currentPath)} stroke="#F0FFF0" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Hint / Wrong Feedback */}
            {shouldShowHint && medians[currentStrokeIndex] && (
              <Path 
                d={getMedianPath(medians[currentStrokeIndex])} 
                stroke={Colors.primary} 
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
              <Ionicons name="close-circle" size={48} color={Colors.wrong} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.actionBtn} onPress={triggerHint}>
          <Ionicons name="bulb-outline" size={24} color={Colors.textPrimary} />
          <Text style={styles.actionText}>Hint</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={skipQuestion}>
          <Ionicons name="play-skip-forward-outline" size={24} color={Colors.textPrimary} />
          <Text style={styles.actionText}>Skip</Text>
        </TouchableOpacity>
      </View>
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
  statBox: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  statText: { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginLeft: 4 },
  topArea: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  meaningText: { color: Colors.textSecondary, fontSize: 18, textAlign: 'center' },
  canvas: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  wrongIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  bottomArea: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 32,
  },
  actionBtn: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    minWidth: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: { color: Colors.textPrimary, fontSize: 16, marginTop: 8, fontWeight: '600' },
});
