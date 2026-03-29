import { Colors } from '../../src/constants/colors';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

export default function Step7() {
  const db = useSQLiteContext();
  const [chars, setChars] = useState<{word: string, level: number}[]>([]);

  useEffect(() => {
    const fetchChars = async () => {
      try {
        const result = await db.getAllAsync<{word: string, level: number}>(
          `SELECT DISTINCT word, level FROM hsk WHERE LENGTH(word) = 1 ORDER BY level, id LIMIT 200`
        );
        setChars(result);
      } catch (e) {
        console.error('Error fetching chars for done screen:', e);
      }
    };
    fetchChars();
  }, [db]);

  return (
    <View style={styles.container}>
      <View style={styles.ensoCircle} />
      
      <View style={styles.topSection}>
        <Text style={{fontSize: 60, marginBottom: 16}}>🐼</Text>
        <Text style={styles.title}>Good luck with your{'\n'}Hanzi learning journey!</Text>
      </View>

      <ScrollView contentContainerStyle={styles.gridContainer}>
        {chars.map((char, index) => (
          <Text 
            key={`${char.word}-${index}`} 
            style={[styles.charCell, char.level === 1 ? styles.unlocked : styles.locked]}
          >
            {char.word}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  ensoCircle: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    marginLeft: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.textPrimary,
    opacity: 0.08,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 24,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    fontFamily: 'monospace',
    lineHeight: 32,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingBottom: 40,
  },
  charCell: {
    fontSize: 20,
    fontFamily: 'System',
    margin: 2,
  },
  unlocked: {
    color: Colors.primary,
    fontWeight: 'bold'
  },
  locked: {
    color: Colors.textDisabled,
  },
});
