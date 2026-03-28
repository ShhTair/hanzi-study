import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';

type ProgressRow = {
  word: string;
  correct: number;
  incorrect: number;
  next_review: number;
  ease_factor: number;
};

type Bucket = {
  label: string;
  min: number;
  max: number;
  chars: ProgressRow[];
  expanded: boolean;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProgressRing({ item }: { item: ProgressRow }) {
  const router = useRouter();
  const total = item.correct + item.incorrect;
  const accuracy = total > 0 ? Math.round((item.correct / total) * 100) : 0;
  
  const radius = 28;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: accuracy,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [accuracy]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const now = Math.floor(Date.now() / 1000);
  const diffDays = Math.ceil((item.next_review - now) / 86400);
  const dueText = diffDays <= 0 ? 'Due' : `+${diffDays}d`;

  return (
    <TouchableOpacity 
      style={styles.ringContainer}
      onPress={() => router.push(`/character/${encodeURIComponent(item.word)}` as any)}
    >
      <View style={styles.ringWrapper}>
        <Svg width={64} height={64} viewBox="0 0 64 64">
          <Circle
            cx={32} cy={32} r={radius}
            stroke="#3A3A3C"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx={32} cy={32} r={radius}
            stroke={Colors.primary}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.accText}>{accuracy}%</Text>
        </View>
      </View>
      <Text style={styles.charText}>{item.word}</Text>
      <Text style={[styles.dueText, diffDays <= 0 && { color: Colors.warning }]}>{dueText}</Text>
    </TouchableOpacity>
  );
}

export default function ProgressScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dueTodayCount, setDueTodayCount] = useState(0);
  
  const [buckets, setBuckets] = useState<Bucket[]>([
    { label: 'Mastered (75-100%)', min: 75, max: 100, chars: [], expanded: true },
    { label: 'Learning (50-74%)', min: 50, max: 74, chars: [], expanded: true },
    { label: 'Struggling (25-49%)', min: 25, max: 49, chars: [], expanded: true },
    { label: 'New/Failing (0-24%)', min: 0, max: 24, chars: [], expanded: true },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = await SQLite.openDatabaseAsync('hanzi.db');
        const rows = await db.getAllAsync<ProgressRow>(
          `SELECT hp.word, up.correct, up.incorrect, up.next_review, up.ease_factor 
           FROM user_progress up 
           JOIN hsk hp ON hp.word = up.word_id`
        );
        
        let due = 0;
        const now = Math.floor(Date.now() / 1000);

        const newBuckets = [...buckets].map(b => ({ ...b, chars: [] as ProgressRow[] }));

        rows.forEach(row => {
          if (row.next_review <= now) due++;
          
          const total = row.correct + row.incorrect;
          const acc = total > 0 ? Math.round((row.correct / total) * 100) : 0;
          
          for (const b of newBuckets) {
            if (acc >= b.min && acc <= b.max) {
              b.chars.push(row);
              break;
            }
          }
        });

        // Sort chars within buckets by accuracy descending
        newBuckets.forEach(b => {
          b.chars.sort((a, c) => {
            const accA = (a.correct / (a.correct + a.incorrect)) || 0;
            const accC = (c.correct / (c.correct + c.incorrect)) || 0;
            return accC - accA;
          });
        });

        setDueTodayCount(due);
        setBuckets(newBuckets);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleBucket = (index: number) => {
    setBuckets(prev => {
      const next = [...prev];
      next[index].expanded = !next[index].expanded;
      return next;
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ title: 'My Progress', headerStyle: { backgroundColor: Colors.background }, headerTintColor: '#FFF' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Progress', headerStyle: { backgroundColor: Colors.background }, headerTintColor: '#FFF' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {buckets.map((bucket, i) => (
          <View key={i} style={styles.bucketSection}>
            <TouchableOpacity style={styles.bucketHeader} onPress={() => toggleBucket(i)}>
              <Text style={styles.bucketTitle}>{bucket.label} ({bucket.chars.length})</Text>
              <Ionicons name={bucket.expanded ? "chevron-up" : "chevron-down"} size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            {bucket.expanded && (
              bucket.chars.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                  {bucket.chars.map((char, j) => (
                    <ProgressRing key={j} item={char} />
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyBucket}>
                  <Text style={styles.emptyText}>No characters in this range.</Text>
                </View>
              )
            )}
          </View>
        ))}
        
        {/* Extra padding for bottom pill */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Bottom Pill */}
      {dueTodayCount > 0 && (
        <TouchableOpacity style={styles.bottomPill} onPress={() => router.push('/(tabs)/study')}>
          <Text style={styles.pillText}>{dueTodayCount} due today</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingVertical: 16 },
  bucketSection: { marginBottom: 24 },
  bucketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.cardElevated,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  bucketTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  horizontalScroll: { paddingHorizontal: 16, paddingVertical: 16 },
  emptyBucket: { padding: 24, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontStyle: 'italic' },
  ringContainer: { alignItems: 'center', marginRight: 24 },
  ringWrapper: { position: 'relative', width: 64, height: 64, marginBottom: 8 },
  ringCenter: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  accText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600' },
  charText: { color: Colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  dueText: { color: Colors.textSecondary, fontSize: 12 },
  bottomPill: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pillText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
