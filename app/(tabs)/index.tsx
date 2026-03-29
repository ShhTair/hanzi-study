import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/context/ThemeContext';

export default function HomeTab() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();
  const db = useSQLiteContext();
  
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [displayScript, setDisplayScript] = useState<'simplified'|'traditional'>('simplified');
  const [dueToday, setDueToday] = useState(0);
  const [totalStudyTimeStr, setTotalStudyTimeStr] = useState('0m');
  const [hskProgress, setHskProgress] = useState<{ level: number, reviewed: number, total: number }[]>([]);
  const [savedSession, setSavedSession] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<{study_date: string, review_count: number}[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        // Safe query execution
        const tryQuery = async <T,>(sql: string): Promise<T | null> => {
          try {
            return await db.getFirstAsync<T>(sql);
          } catch (e) {
            console.warn('Query failed:', sql, e);
            return null;
          }
        };

        const tryAllQuery = async <T,>(sql: string): Promise<T[]> => {
          try {
            return await db.getAllAsync<T>(sql);
          } catch (e) {
            console.warn('Query failed:', sql, e);
            return [];
          }
        };

        
        const timeResult = await tryQuery<{ sum: number }>("SELECT SUM(studied_seconds) as sum FROM user_progress");
        if (isMounted && timeResult && timeResult.sum) {
          const hours = Math.floor(timeResult.sum / 3600);
          const minutes = Math.floor((timeResult.sum % 3600) / 60);
          setTotalStudyTimeStr(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
        }

        // Query 1: Cards reviewed today
        const reviewedResult = await tryQuery<{ count: number }>("SELECT count(*) as count FROM user_progress WHERE DATE(last_reviewed) = date('now')");
        if (isMounted && reviewedResult) setCardsReviewed(reviewedResult.count);

        // Query 2: Due for review today (fallback simple logic if next_review is ms timestamp or date string)
        const dueResult = await tryQuery<{ count: number }>("SELECT count(*) as count FROM user_progress WHERE next_review <= strftime('%s', 'now')");
        if (isMounted && dueResult) setDueToday(dueResult.count);

        // Query 3: Streak (naive based on unique days in last_reviewed)
        const streakVal = await AsyncStorage.getItem('@hanzi_streak');
        if (isMounted && streakVal) setStreak(parseInt(streakVal, 10));

        const sessionStr = await AsyncStorage.getItem('@hanzi_saved_session');
        if (isMounted && sessionStr) {
          const s = JSON.parse(sessionStr);
          if (Date.now() - s.savedAt < 86400000) setSavedSession(s);
        }

        const hm = await tryAllQuery<{ study_date: string, review_count: number }>(`
          SELECT DATE(last_reviewed) as study_date, COUNT(*) as review_count
          FROM user_progress
          WHERE last_reviewed >= DATE('now', '-84 days') AND last_reviewed IS NOT NULL
          GROUP BY study_date
        `);
        if (isMounted && hm) setHeatmap(hm);

        // Query 4: HSK Progress
        const progressResult = await tryAllQuery<{ level: number, reviewed: number, total: number }>(`
          SELECT 
            hsk.level, 
            COUNT(user_progress.word_id) as reviewed,
            COUNT(hsk.word) as total
          FROM hsk
          LEFT JOIN user_progress ON hsk.word = user_progress.word_id
          GROUP BY hsk.level
          ORDER BY hsk.level ASC
        `);
        
        if (isMounted && progressResult.length > 0) {
          setHskProgress(progressResult);
        } else {
          // If DB is empty or query fails, mock 9 levels so UI doesn't look broken
          if (isMounted) {
            setHskProgress(Array.from({length: 9}, (_, i) => ({
              level: i + 1, reviewed: 0, total: 300
            })));
          }
        }

      } catch (err) {
        console.error("Home screen db error", err);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [db]);

  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Section 1: Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hanzi Study</Text>
        <Text style={styles.subtitle}>{dateStr}</Text>
      </View>

      {/* Section 2: Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{cardsReviewed}</Text>
          <Text style={styles.statLabel}>Reviewed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{dueToday}</Text>
          <Text style={styles.statLabel}>Due Today</Text>
        </View>
      </View>

      
      {savedSession && (
        <View style={styles.savedSessionCard}>
          <View style={{flex: 1}}>
            <Text style={styles.savedSessionTitle}>Resume {savedSession.mode} session</Text>
            <Text style={styles.savedSessionSubtitle}>{savedSession.currentIndex} / {savedSession.totalCards} cards</Text>
          </View>
          <TouchableOpacity 
            style={styles.continueBtn}
            onPress={() => router.push({ pathname: '/study/' + savedSession.mode, params: { ...savedSession, resume: 'true' } } as any)}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSavedSession(null); AsyncStorage.removeItem('@hanzi_saved_session'); }} style={{marginLeft: 12}}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Heatmap */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Study History</Text>
        <View style={styles.heatmapCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.heatmapGrid}>
              {Array.from({ length: 12 }).map((_, col) => (
                <View key={col} style={styles.heatmapCol}>
                  {Array.from({ length: 7 }).map((_, row) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (83 - (col * 7 + row)));
                    const dateStr = date.toISOString().split('T')[0];
                    const count = heatmap.find(h => h.study_date === dateStr)?.review_count || 0;
                    
                    let bg = colors.cardElevated;
                    let opacity = 1;
                    if (count > 0) {
                      bg = colors.primary;
                      opacity = count < 6 ? 0.4 : count < 16 ? 0.7 : 1;
                    }
                    const isToday = row === 6 && col === 11;
                    return (
                      <View 
                        key={row} 
                        style={[
                          styles.heatmapDot, 
                          { backgroundColor: bg, opacity },
                          isToday && { borderWidth: 2, borderColor: colors.primary }
                        ]} 
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Section 3: HSK Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HSK Progress</Text>
        {hskProgress.map((hsk) => (
          <View key={hsk.level} style={styles.progressRow}>
            <Text style={styles.progressLabel}>HSK {hsk.level}</Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${hsk.total > 0 ? (hsk.reviewed / hsk.total) * 100 : 0}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {hsk.total > 0 ? Math.round((hsk.reviewed / hsk.total) * 100) : 0}%
            </Text>
          </View>
        ))}
      </View>

      {/* Section 4: Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/study/flashcard', params: { mode: 'due', level: 'all' } } as any)}>
          <Text style={styles.actionBtnText}>Continue Studying</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => router.push('/lists')}>
          <Text style={styles.actionBtnText}>Browse Characters</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  savedSessionCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  savedSessionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  savedSessionSubtitle: { fontSize: 14, color: colors.textSecondary },
  continueBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  continueBtnText: { color: '#FFF', fontWeight: 'bold' },
  heatmapCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, alignItems: 'center' },
  heatmapGrid: { flexDirection: 'row', gap: 4 },
  heatmapCol: { flexDirection: 'column', gap: 4 },
  heatmapDot: { width: 12, height: 12, borderRadius: 6 },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    width: 60,
    color: colors.textPrimary,
    fontSize: 14,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.cardElevated,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    width: 40,
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 40,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
