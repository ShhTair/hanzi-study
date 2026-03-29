import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../../src/constants/colors';

export function startRainAnimation() {
  // exported function just for typing consistency if needed
}

export function RainOverlay() {
  const db = useSQLiteContext();
  const [rainChars, setRainChars] = useState<{word: string, x: number, delay: number, anim: Animated.Value}[]>([]);

  useEffect(() => {
    const fetchChars = async () => {
      try {
        const result = await db.getAllAsync<{word: string, level: number}>(
          `SELECT DISTINCT word, level FROM hsk WHERE LENGTH(word) = 1 AND level = 1 ORDER BY level, id LIMIT 200`
        );
        const dbChars = result.map(c => c.word);
        if (dbChars.length === 0) return;
        
        const { width } = Dimensions.get('window');
        const rainDrops = Array.from({length: 20}).map(() => ({
          word: dbChars[Math.floor(Math.random() * dbChars.length)],
          x: Math.random() * (width - 40),
          delay: Math.random() * 600,
          anim: new Animated.Value(0)
        }));
        
        setRainChars(rainDrops);
        
        Animated.parallel(
          rainDrops.map(drop => 
            Animated.sequence([
              Animated.delay(drop.delay),
              Animated.timing(drop.anim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true
              })
            ])
          )
        ).start();
      } catch (e) {
        console.error('Error fetching chars for rain:', e);
      }
    };
    fetchChars();
  }, [db]);

  if (rainChars.length === 0) return null;

  return (
    <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1000}}>
      {rainChars.map((drop, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: drop.x,
            fontSize: 28,
            color: Colors.primary,
            fontWeight: 'bold',
            transform: [
              { translateY: drop.anim.interpolate({ inputRange: [0, 1], outputRange: [-50, Dimensions.get('window').height] }) }
            ],
            opacity: drop.anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] })
          }}
        >
          {drop.word}
        </Animated.Text>
      ))}
    </View>
  );
}
