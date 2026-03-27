import { Stack, useRouter } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Layout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  const migrateDbIfNeeded = async (db: SQLiteDatabase) => {
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS user_progress (word_id TEXT PRIMARY KEY, srs_interval INTEGER DEFAULT 0, next_review INTEGER DEFAULT 0, ease_factor REAL DEFAULT 2.5);'
    );
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('@hanzi_onboarding_complete');
        if (completed !== 'true') {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      } catch (e) {
        // Fallback to onboarding on error
        router.replace('/onboarding');
      } finally {
        setIsReady(true);
      }
    };
    checkOnboarding();
  }, []);

  return (
    <SQLiteProvider databaseName="hanzi.db" assetSource={{ assetId: require('../assets/db/hanzi.db') }} onInit={migrateDbIfNeeded}>
      {isReady && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      )}
    </SQLiteProvider>
  );
}
