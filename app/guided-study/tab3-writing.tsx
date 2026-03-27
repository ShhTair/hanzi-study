import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Line, Polyline, Circle } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useWritingCanvas } from '../../src/hooks/useWritingCanvas';
import * as SQLite from 'expo-sqlite';

const { width } = Dimensions.get('window');
const CANVAS_SIZE = width - 32;

export default function Tab3Writing({ character = '你', pinyin = 'nǐ', tone = 3, meanings = 'you' }) {
  const [characterData, setCharacterData] = useState<any>(null);
  const [medians, setMedians] = useState<number[][][]>([]);
  
  useEffect(() => {
    const fetchCharData = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        const result = await db.getFirstAsync<{ graphics: string }>(
          'SELECT graphics FROM graphics WHERE character = ?',
          [character]
        );
        if (result && result.graphics) {
          const data = JSON.parse(result.graphics);
          setCharacterData(data);
          if (data.medians) {
            setMedians(data.medians);
          }
        }
      } catch (e) {
        console.error('Error fetching char graphics:', e);
      }
    };
    fetchCharData();
  }, [character]);

  const {
    panResponder,
    paths,
    currentPath,
    currentStrokeIndex,
    wrongAttempts,
    strokeFeedback,
    resetCanvas
  } = useWritingCanvas(medians, CANVAS_SIZE);

  // Determine current stroke color based on feedback
  let currentStrokeColor = Colors.textPrimary;
  if (strokeFeedback === 'correct') currentStrokeColor = Colors.correct;
  if (strokeFeedback === 'wrong') currentStrokeColor = Colors.wrong;

  // Next start point for hint dot
  let startPoint = null;
  if (medians && medians.length > currentStrokeIndex) {
    const firstPoint = medians[currentStrokeIndex][0];
    if (firstPoint) {
      startPoint = {
        x: (firstPoint[0] / 900) * CANVAS_SIZE,
        y: (1 - firstPoint[1] / 900) * CANVAS_SIZE // Y inversion
      };
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badgeContainer}>
          <View style={styles.toneCircle}>
            <Text style={styles.toneText}>{tone}</Text>
          </View>
          <Text style={styles.badgeText}>{pinyin}</Text>
        </View>
        <Text style={styles.meanings}><Text style={styles.bold}>{meanings.split(',')[0]}</Text>{meanings.includes(',') ? ',' + meanings.split(',').slice(1).join(',') : ''}</Text>
      </View>

      <Text style={styles.mascotMessage}>🐼 Practice writing Hanzi to solidify into memory.</Text>

      <View style={styles.canvasWrapper}>
        <View style={styles.canvasHeader}>
          <Text style={styles.counterText}>{currentStrokeIndex + 1}</Text>
          <Text style={styles.wrongCounterText}>{wrongAttempts}</Text>
        </View>
        
        <View style={styles.canvasContainer}>
          {/* The Grid */}
          <Svg height={CANVAS_SIZE} width={CANVAS_SIZE} style={styles.absolute}>
            <Line x1={CANVAS_SIZE / 2} y1="0" x2={CANVAS_SIZE / 2} y2={CANVAS_SIZE} stroke="#404040" strokeWidth="0.5" strokeDasharray="4 4" />
            <Line x1="0" y1={CANVAS_SIZE / 2} x2={CANVAS_SIZE} y2={CANVAS_SIZE / 2} stroke="#404040" strokeWidth="0.5" strokeDasharray="4 4" />
            <Line x1="0" y1="0" x2={CANVAS_SIZE} y2={CANVAS_SIZE} stroke="#404040" strokeWidth="0.5" strokeDasharray="4 4" />
            <Line x1={CANVAS_SIZE} y1="0" x2="0" y2={CANVAS_SIZE} stroke="#404040" strokeWidth="0.5" strokeDasharray="4 4" />
          </Svg>

          {/* The Hint Ghost Character */}
          {characterData && characterData.strokes && (
            <Svg height={CANVAS_SIZE} width={CANVAS_SIZE} style={styles.absolute} viewBox="0 0 1024 1024">
              <View style={{ transform: [{ scaleY: -1 }] }}>
                {characterData.strokes.map((strokePath: string, index: number) => (
                  <Path key={index} d={strokePath} fill="#FFFFFF" opacity={0.15} />
                ))}
              </View>
            </Svg>
          )}

          {/* Correct Strokes (Rendered from DB SVG paths if completed) */}
          {characterData && characterData.strokes && (
            <Svg height={CANVAS_SIZE} width={CANVAS_SIZE} style={styles.absolute} viewBox="0 0 1024 1024">
              <View style={{ transform: [{ scaleY: -1 }] }}>
                {characterData.strokes.slice(0, currentStrokeIndex).map((strokePath: string, index: number) => (
                   <Path key={index} d={strokePath} fill="#FFFFFF" />
                ))}
              </View>
            </Svg>
          )}

          {/* The Brush / Drawing Area */}
          <View style={styles.drawingArea} {...panResponder.panHandlers}>
            <Svg height={CANVAS_SIZE} width={CANVAS_SIZE}>
              {currentPath.length > 0 && (
                <Polyline points={currentPath.join(' ')} fill="none" stroke={currentStrokeColor} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </Svg>
          </View>
          
          {/* Stroke Start Dot */}
          {startPoint && strokeFeedback !== 'correct' && (
             <Svg height={CANVAS_SIZE} width={CANVAS_SIZE} style={[styles.absolute, { pointerEvents: 'none' }]}>
               <Circle cx={startPoint.x} cy={startPoint.y} r="6" fill={Colors.correct} />
             </Svg>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={resetCanvas}>
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}}>
            <MaterialIcons name="play-circle-outline" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 16 },
  badgeContainer: { flexDirection: 'row', backgroundColor: Colors.primaryDim, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, marginHorizontal: 4, alignItems: 'center' },
  toneCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  toneText: { fontSize: 11, color: Colors.textPrimary },
  badgeText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  meanings: { fontSize: 17, color: Colors.textSecondary, marginTop: 8 },
  bold: { fontWeight: '700' },
  mascotMessage: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16, textAlign: 'center' },
  canvasWrapper: { backgroundColor: Colors.card, borderRadius: 8, overflow: 'hidden', width: CANVAS_SIZE, padding: 8 },
  canvasHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 8 },
  counterText: { fontSize: 18, color: Colors.textMuted },
  wrongCounterText: { fontSize: 18, color: Colors.wrong },
  canvasContainer: { width: CANVAS_SIZE, height: CANVAS_SIZE, backgroundColor: Colors.card, position: 'relative', borderRadius: 8, overflow: 'hidden' },
  absolute: { position: 'absolute', top: 0, left: 0 },
  drawingArea: { flex: 1, position: 'absolute', top: 0, left: 0, width: CANVAS_SIZE, height: CANVAS_SIZE },
  controls: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, paddingHorizontal: 8 }
});
