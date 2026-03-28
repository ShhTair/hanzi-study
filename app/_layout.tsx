import { Colors } from '../src/constants/colors';

import { Stack, useRouter, useSegments } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { DrawerProvider } from '../src/context/DrawerContext';
import { SideDrawer } from '../src/components/SideDrawer';

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  const migrateDbIfNeeded = async (db: SQLiteDatabase) => {
    try {
      await db.execAsync(
        'CREATE TABLE IF NOT EXISTS favorites (word TEXT PRIMARY KEY, added_at INTEGER); CREATE TABLE IF NOT EXISTS user_progress (word_id TEXT PRIMARY KEY, srs_interval INTEGER DEFAULT 0, next_review INTEGER DEFAULT 0, ease_factor REAL DEFAULT 2.5, correct INTEGER DEFAULT 0, incorrect INTEGER DEFAULT 0);'
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
    if (isReady && initialRoute) {
      const inTabsGroup = segments[0] === '(tabs)';
      const inOnboardingGroup = segments[0] === 'onboarding';
      
      if (initialRoute === '(tabs)' && !inTabsGroup) {
        router.replace('/(tabs)');
      } else if (initialRoute === 'onboarding' && !inOnboardingGroup) {
        router.replace('/onboarding');
      }
    }
  }, [isReady, initialRoute, segments]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  return (
    <SQLiteProvider databaseName="hanzi.db" assetSource={{ assetId: require('../assets/db/hanzi.db') }} onInit={migrateDbIfNeeded}>
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
