import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Colors } from '../../src/constants/colors';

export default function HomeTab() {
  const router = useRouter();
  const db = useSQLiteContext();
  
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dueToday, setDueToday] = useState(0);
  const [hskProgress, setHskProgress] = useState<{ level: number, reviewed: number, total: number }[]>([]);

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

        // Query 1: Cards reviewed today
        const reviewedResult = await tryQuery<{ count: number }>("SELECT count(*) as count FROM user_progress WHERE DATE(last_reviewed) = date('now')");
        if (isMounted && reviewedResult) setCardsReviewed(reviewedResult.count);

        // Query 2: Due for review today (fallback simple logic if next_review is ms timestamp or date string)
        const dueResult = await tryQuery<{ count: number }>("SELECT count(*) as count FROM user_progress WHERE next_review <= strftime('%s', 'now') * 1000 OR next_review <= date('now')");
        if (isMounted && dueResult) setDueToday(dueResult.count);

        // Query 3: Streak (naive based on unique days in last_reviewed)
        const datesResult = await tryAllQuery<{ date: string }>("SELECT DISTINCT DATE(last_reviewed) as date FROM user_progress WHERE last_reviewed IS NOT NULL ORDER BY date DESC");
        // Simple streak calculation
        if (isMounted && datesResult) {
          setStreak(datesResult.length); // Fallback logic
        }

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
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/study')}>
          <Text style={styles.actionBtnText}>Continue Studying</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => router.push('/lists')}>
          <Text style={styles.actionBtnText}>Browse Characters</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    width: 60,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.cardElevated,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    width: 40,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 40,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
