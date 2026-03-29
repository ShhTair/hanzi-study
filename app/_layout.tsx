// app/_layout.tsx
import "../global.css";
import { Stack, useRouter, SplashScreen } from "expo-router";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { useEffect, useState, Suspense } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";
import { DrawerProvider } from "../src/context/DrawerContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { SideDrawer } from "../src/components/SideDrawer";
import { ErrorBoundary } from "../src/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const migrateDbIfNeeded = async (db: SQLiteDatabase) => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS favorites (word TEXT PRIMARY KEY, added_at INTEGER);
      CREATE TABLE IF NOT EXISTS user_progress (
        word_id TEXT PRIMARY KEY,
        srs_interval INTEGER DEFAULT 0,
        next_review INTEGER DEFAULT 0,
        ease_factor REAL DEFAULT 2.5,
        correct INTEGER DEFAULT 0,
        incorrect INTEGER DEFAULT 0,
        studied_seconds INTEGER DEFAULT 0,
        is_favorite INTEGER DEFAULT 0,
        last_reviewed TEXT
      );
      CREATE TABLE IF NOT EXISTS custom_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_studied INTEGER
      );
      CREATE TABLE IF NOT EXISTS custom_set_chars (
        set_id INTEGER NOT NULL,
        word TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (set_id, word),
        FOREIGN KEY (set_id) REFERENCES custom_sets(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS tone_errors (
        word TEXT,
        wrong_tone INTEGER,
        correct_tone INTEGER,
        count INTEGER DEFAULT 1
      );
    `);
    // Safe column additions (idempotent)
    const cols = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(user_progress)"
    );
    const colNames = cols.map((c) => c.name);
    if (!colNames.includes("studied_seconds")) {
      await db.execAsync(
        "ALTER TABLE user_progress ADD COLUMN studied_seconds INTEGER DEFAULT 0;"
      );
    }
    if (!colNames.includes("is_favorite")) {
      await db.execAsync(
        "ALTER TABLE user_progress ADD COLUMN is_favorite INTEGER DEFAULT 0;"
      );
    }
  } catch (e) {
    console.error("DB Migration error", e);
    throw e; // Re-throw so SQLiteProvider surfaces the error
  }
};

function LoadingScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#0D9488" />
    </View>
  );
}

export default function Layout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@hanzi_onboarding_complete")
      .then((val) => {
        setIsCompleted(val === "true");
      })
      .catch(() => {
        setIsCompleted(false);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  useEffect(() => {
    if (!isReady) return;
    SplashScreen.hideAsync();
    if (isCompleted) {
      router.replace("/(tabs)" as any);
    } else {
      router.replace("/onboarding" as any);
    }
  }, [isReady, isCompleted]);

  return (
    <SQLiteProvider
      databaseName="hanzi.db"
      assetSource={{ assetId: require("../assets/db/hanzi.db") }}
      onInit={migrateDbIfNeeded}
      useSuspense
    >
      <ThemeProvider>
        <DrawerProvider>
          <ErrorBoundary>
            <View className="flex-1">
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="character/[char]" />
                <Stack.Screen name="character/write/[char]" />
                <Stack.Screen name="study-complete" />
                <Stack.Screen name="lists/[level]" />
                <Stack.Screen name="study/flashcard" />
                <Stack.Screen name="study/quiz" />
                <Stack.Screen name="study/writing" />
                <Stack.Screen name="study/tone-quiz" />
                <Stack.Screen name="study/summary" />
                <Stack.Screen name="sentence/[id]" />
                <Stack.Screen name="word/[id]" />
                <Stack.Screen name="custom-sets/index" />
                <Stack.Screen name="custom-sets/[id]" />
                <Stack.Screen name="favorites" />
                <Stack.Screen name="progress" />
                <Stack.Screen name="settings" />
              </Stack>
              <SideDrawer />
            </View>
          </ErrorBoundary>
        </DrawerProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
