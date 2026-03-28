import { Colors } from '../../../src/constants/colors';

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Path, Line, Polyline } from 'react-native-svg';
import * as SQLite from 'expo-sqlite';

const { width } = Dimensions.get('window');
const CANVAS_SIZE = width * 0.9;

export default function WriteCanvasScreen() {
  const { char } = useLocalSearchParams();
  const [paths, setPaths] = useState<string[][]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [characterData, setCharacterData] = useState<any>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Fetch character's SVG strokes and medians from hanzi.db (which holds hanzi_graphics.json data)
    const fetchCharData = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        const result = await db.getFirstAsync<{ graphics: string }>(
          'SELECT graphics FROM hanzi_graphics WHERE character = ?',
          [char as string]
        );
        if (result && result.graphics) {
          setCharacterData(JSON.parse(result.graphics));
        }
      } catch (e) {
        console.error('Error fetching char graphics:', e);
      }
    };
    if (char) fetchCharData();
  }, [char as string]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath([`${locationX},${locationY}`]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => [...prev, `${locationX},${locationY}`]);
      },
      onPanResponderRelease: () => {
        setPaths((prev) => [...prev, currentPath]);
        setCurrentPath([]);
      },
    })
  ).current;

  const handleRating = async (rating: string) => {
    // Save rating to progress DB
    try {
      const db = await SQLite.openDatabaseAsync('hanzi.db');
      await db.runAsync(
        'INSERT OR REPLACE INTO progress (character, rating, last_reviewed) VALUES (?, ?, datetime("now"))',
        [char as string, rating]
      );
      // Navigate back or reset
      setPaths([]);
    } catch (e) {
      console.error('Error saving rating:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Practice: {char}</Text>

      <View style={styles.canvasContainer}>
        {/* The Grid */}
        <Svg height={CANVAS_SIZE} width={CANVAS_SIZE} style={styles.grid}>
          <Line x1={CANVAS_SIZE / 2} y1="0" x2={CANVAS_SIZE / 2} y2={CANVAS_SIZE} stroke="#333333" strokeWidth="2" strokeDasharray="5, 5" />
          <Line x1="0" y1={CANVAS_SIZE / 2} x2={CANVAS_SIZE} y2={CANVAS_SIZE / 2} stroke="#333333" strokeWidth="2" strokeDasharray="5, 5" />
          <Line x1="0" y1="0" x2={CANVAS_SIZE} y2={CANVAS_SIZE} stroke="#333333" strokeWidth="2" strokeDasharray="5, 5" />
          <Line x1={CANVAS_SIZE} y1="0" x2="0" y2={CANVAS_SIZE} stroke="#333333" strokeWidth="2" strokeDasharray="5, 5" />
        </Svg>

        {/* The Hint */}
        {characterData && (
          <Svg height={CANVAS_SIZE} width={CANVAS_SIZE} style={styles.hint} viewBox="0 0 1024 1024" transform={[{ scaleY: -1 }, { translateY: -CANVAS_SIZE }]}>
            {characterData.strokes.map((strokePath: string, index: number) => (
              <Path key={index} d={strokePath} fill="#FFFFFF" opacity={0.15} />
            ))}
          </Svg>
        )}

        {/* The Brush / Drawing Area */}
        <View style={styles.drawingArea} {...panResponder.panHandlers}>
          <Svg height={CANVAS_SIZE} width={CANVAS_SIZE}>
            {paths.map((p, i) => (
              <Polyline key={`path-${i}`} points={p.join(' ')} fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {currentPath.length > 0 && (
              <Polyline points={currentPath.join(' ')} fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </Svg>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.animButton} onPress={() => setShowAnimation(!showAnimation)}>
          <Text style={styles.buttonText}>Show Correct Animation</Text>
        </TouchableOpacity>

        <View style={styles.ratingRow}>
          <TouchableOpacity style={[styles.rateButton, { backgroundColor: Colors.wrong }]} onPress={() => handleRating('wrong')}>
            <Text style={styles.buttonText}>I wrote it wrong</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rateButton, { backgroundColor: Colors.correct }]} onPress={() => handleRating('perfect')}>
            <Text style={styles.buttonText}>I wrote it perfectly</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.textPrimary, fontSize: 24, marginBottom: 20 },
  canvasContainer: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: Colors.card,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#555',
  },
  grid: { position: 'absolute', top: 0, left: 0 },
  hint: { position: 'absolute', top: 0, left: 0, pointerEvents: 'none' },
  drawingArea: { flex: 1, position: 'absolute', top: 0, left: 0, width: CANVAS_SIZE, height: CANVAS_SIZE },
  controls: { marginTop: 30, width: CANVAS_SIZE, alignItems: 'center' },
  animButton: { padding: 12, backgroundColor: '#333', borderRadius: 8, marginBottom: 20, width: '100%', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  rateButton: { padding: 15, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  buttonText: { color: Colors.textPrimary, fontWeight: 'bold' },
});
