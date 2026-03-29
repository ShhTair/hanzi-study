import { Colors } from '../src/constants/colors';
import { Stack, useRouter, SplashScreen } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet } from 'react-native';
import { DrawerProvider } from '../src/context/DrawerContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { SideDrawer } from '../src/components/SideDrawer';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const migrateDbIfNeeded = async (db: SQLiteDatabase) => {
    try {
      await db.execAsync(`
CREATE TABLE IF NOT EXISTS favorites (word TEXT PRIMARY KEY, added_at INTEGER);
CREATE TABLE IF NOT EXISTS user_progress (word_id TEXT PRIMARY KEY, srs_interval INTEGER DEFAULT 0, next_review INTEGER DEFAULT 0, ease_factor REAL DEFAULT 2.5, correct INTEGER DEFAULT 0, incorrect INTEGER DEFAULT 0, last_reviewed TEXT);
CREATE TABLE IF NOT EXISTS custom_sets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at INTEGER NOT NULL, last_studied INTEGER);
CREATE TABLE IF NOT EXISTS custom_set_chars (set_id INTEGER NOT NULL, word TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (set_id, word), FOREIGN KEY (set_id) REFERENCES custom_sets(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS tone_errors (word TEXT, wrong_tone INTEGER, correct_tone INTEGER, count INTEGER DEFAULT 1);
      `);
    } catch (e) {
      console.error("DB Migration error", e);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem('@hanzi_onboarding_complete')
      .then(val => {
        setIsCompleted(val === 'true');
        setIsReady(true);
        SplashScreen.hideAsync();
      })
      .catch(() => {
        setIsCompleted(false);
        setIsReady(true);
        SplashScreen.hideAsync();
      });
  }, []);

  useEffect(() => {
    if (isReady && !hasNavigated) {
      if (isCompleted) {
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/onboarding' as any);
      }
      setHasNavigated(true);
    }
  }, [isReady, isCompleted, hasNavigated, router]);

  if (!isReady) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="hanzi.db" assetSource={{ assetId: require('../assets/db/hanzi.db') }} onInit={migrateDbIfNeeded}>
      <ThemeProvider>
        <DrawerProvider>
          <ErrorBoundary>
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
          </ErrorBoundary>
        </DrawerProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
