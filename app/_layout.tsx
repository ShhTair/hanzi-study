import { Colors } from '../src/constants/colors';

import { Stack, useRouter, useSegments } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { DrawerProvider } from '../src/context/DrawerContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { SideDrawer } from '../src/components/SideDrawer';

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [hasNavigated, setHasNavigated] = useState(false);

  const migrateDbIfNeeded = async (db: SQLiteDatabase) => {
    try {
      await db.execAsync(
        `
CREATE TABLE IF NOT EXISTS favorites (word TEXT PRIMARY KEY, added_at INTEGER);
CREATE TABLE IF NOT EXISTS user_progress (word_id TEXT PRIMARY KEY, srs_interval INTEGER DEFAULT 0, next_review INTEGER DEFAULT 0, ease_factor REAL DEFAULT 2.5, correct INTEGER DEFAULT 0, incorrect INTEGER DEFAULT 0, last_reviewed TEXT);
CREATE TABLE IF NOT EXISTS custom_sets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at INTEGER NOT NULL, last_studied INTEGER);
CREATE TABLE IF NOT EXISTS custom_set_chars (set_id INTEGER NOT NULL, word TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (set_id, word), FOREIGN KEY (set_id) REFERENCES custom_sets(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS tone_errors (word TEXT, wrong_tone INTEGER, correct_tone INTEGER, count INTEGER DEFAULT 1);
`
      );
    } catch (e) {
      console.error("DB Migration error", e);
    }
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('@hanzi_onboarding_complete');
        setInitialRoute(completed === 'true' ? '(tabs)' : 'onboarding');
      } catch (e) {
        setInitialRoute('onboarding');
      } finally {
        setIsReady(true);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (isReady && initialRoute && !hasNavigated) {
      if (initialRoute === '(tabs)') {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
      setHasNavigated(true);
    }
  }, [isReady, initialRoute, hasNavigated]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  return (
    <SQLiteProvider databaseName="hanzi.db" assetSource={{ assetId: require('../assets/db/hanzi.db') }} onInit={migrateDbIfNeeded}>
      <ThemeProvider>
      <DrawerProvider>
        <View style={styles.container}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="character/[char]" />
            <Stack.Screen name="character/write/[char]" />
            <Stack.Screen name="study-complete" />
            <Stack.Screen name="lists/[level]" />
          </Stack>
          <SideDrawer />
        </View>
      </DrawerProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
});
