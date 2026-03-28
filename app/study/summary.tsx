import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../src/constants/colors';
import { PinyinText } from '../../src/components/PinyinText';
import { updateStreak } from '../../src/hooks/useStreak';
import { Ionicons } from '@expo/vector-icons';

type ResultItem = {
  word: string;
  pinyin: string;
  meaning: string;
  correct: boolean;
};

export default function SummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [results, setResults] = useState<ResultItem[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [grade, setGrade] = useState('F');
  const [message, setMessage] = useState('继续！Jiìxù!');

  useEffect(() => {
    try {
      if (params.results) {
        const parsed = JSON.parse(params.results as string);
        setResults(parsed);
        
        const correctCount = parsed.filter((r: ResultItem) => r.correct).length;
        const total = parsed.length;
        const acc = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        
        setAccuracy(acc);
        updateStreak();
        
        if (acc >= 90) { setGrade('A'); setMessage('完美！Wánměi!'); }
        else if (acc >= 80) { setGrade('B'); setMessage('不错！Bùcuò!'); }
        else if (acc >= 70) { setGrade('C'); setMessage('继续！Jiìxù!'); }
        else if (acc >= 60) { setGrade('D'); setMessage('继续！Jiìxù!'); }
        else { setGrade('F'); setMessage('继续！Jiìxù!'); }
      }
    } catch (e) {
      console.error('Failed to parse results:', e);
    }
  }, [params.results]);

  const radius = 30;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracy / 100) * circumference;

  const renderItem = ({ item }: { item: ResultItem }) => (
    <TouchableOpacity 
      style={styles.row}
      onPress={() => router.push(`/character/${encodeURIComponent(item.word)}` as any)}
    >
      <View style={[styles.avatar, { backgroundColor: item.correct ? Colors.correct : Colors.wrong }]}>
        <Text style={styles.avatarText}>{item.word}</Text>
      </View>
      <View style={styles.centerCol}>
        <PinyinText pinyin={item.pinyin} size={16} style={{ marginBottom: 4 }} />
        <Text style={styles.meaningText} numberOfLines={1}>{item.meaning}</Text>
      </View>
      <View style={styles.rightCol}>
        {item.correct ? (
          <View style={styles.pandaCircle}>
            <Text style={styles.pandaText}>🐼</Text>
          </View>
        ) : (
          <View style={styles.emptyCircle} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top Card */}
      <View style={styles.topCard}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{results.length}</Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
        
        <View style={styles.donutBox}>
          <Svg width={80} height={80} viewBox="0 0 80 80">
            <Circle
              cx={40} cy={40} r={radius}
              stroke={Colors.wrong}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <Circle
              cx={40} cy={40} r={radius}
              stroke={Colors.correct}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
            />
          </Svg>
          <View style={styles.gradeCenter}>
            <Text style={styles.gradeText}>{grade}</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{accuracy}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
      </View>

      <View style={styles.messagePill}>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      {/* List */}
      <FlatList
        data={results}
        keyExtractor={(item, idx) => `${item.word}-${idx}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => router.back()}>
          <Text style={styles.bottomBtnText}>BACK</Text>
        </TouchableOpacity>
        <View style={styles.vDivider} />
        <TouchableOpacity style={styles.bottomBtn} onPress={() => router.replace('/')}>
          <Text style={styles.bottomBtnText}>FINISH</Text>
        </TouchableOpacity>
        <View style={styles.vDivider} />
        <TouchableOpacity style={styles.bottomBtn} onPress={() => router.back()}>
          <Text style={styles.bottomBtnText}>REPEAT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 24,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingTop: 48, // safe area approx
  },
  statBox: { alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  donutBox: { position: 'relative', width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  gradeCenter: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  gradeText: { color: Colors.textPrimary, fontSize: 32, fontWeight: 'bold' },
  messagePill: {
    alignSelf: 'center',
    backgroundColor: Colors.cardElevated,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: -16,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 10,
  },
  messageText: { color: Colors.textPrimary, fontWeight: '600' },
  listContent: { padding: 16, paddingTop: 32 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  centerCol: { flex: 1 },
  meaningText: { color: Colors.textSecondary, fontSize: 14 },
  rightCol: { width: 40, alignItems: 'flex-end' },
  pandaCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.cardElevated, justifyContent: 'center', alignItems: 'center' },
  pandaText: { fontSize: 16 },
  emptyCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.divider },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 64 },
  bottomBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bottomBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomBtnText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 14 },
  vDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 12 },
});
