import { Colors } from '../src/constants/colors';

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function StudyCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const total = Number(params.total || 0);
  const correct = Number(params.correct || 0);
  const timeSpent = Number(params.timeSpent || 0);
  const rate1 = Number(params.rate1 || 0);
  const rate2 = Number(params.rate2 || 0);
  const rate3 = Number(params.rate3 || 0);
  const rate4 = Number(params.rate4 || 0);
  const rate5 = Number(params.rate5 || 0);

  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Complete!</Text>
      
      <View style={styles.statsCard}>
        <Text style={styles.statText}>Cards Reviewed: {total}</Text>
        <Text style={styles.statText}>Correct (≥3): {correct}</Text>
        <Text style={styles.statText}>Time Spent: {minutes}m {seconds}s</Text>
      </View>

      <Text style={styles.subtitle}>Ratings Breakdown</Text>
      <View style={styles.breakdownRow}>
        <Text style={[styles.breakdownText, { color: Colors.primary }]}>1: {rate1}</Text>
        <Text style={[styles.breakdownText, { color: Colors.primary }]}>2: {rate2}</Text>
        <Text style={[styles.breakdownText, { color: Colors.primary }]}>3: {rate3}</Text>
        <Text style={[styles.breakdownText, { color: Colors.primary }]}>4: {rate4}</Text>
        <Text style={[styles.breakdownText, { color: Colors.primary }]}>5: {rate5}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/study')}>
          <Text style={styles.buttonText}>Study Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.homeButton]} onPress={() => router.replace('/')}>
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 30 },
  subtitle: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginTop: 20, marginBottom: 15 },
  statsCard: { backgroundColor: Colors.card, padding: 20, borderRadius: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: Colors.divider },
  statText: { fontSize: 18, color: Colors.textSecondary, marginVertical: 5 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 40 },
  breakdownText: { fontSize: 18, fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: 15, width: '100%' },
  button: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  homeButton: { backgroundColor: Colors.divider },
  buttonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
});