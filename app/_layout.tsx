import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export default function Layout() {
  const migrateDbIfNeeded = async (db: SQLiteDatabase) => {
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS user_progress (word_id TEXT PRIMARY KEY, srs_interval INTEGER DEFAULT 0, next_review INTEGER DEFAULT 0, ease_factor REAL DEFAULT 2.5);'
    );
  };

  return (
    <SQLiteProvider databaseName="hanzi.db" assetSource={{ assetId: require('../assets/db/hanzi.db') }} onInit={migrateDbIfNeeded}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SQLiteProvider>
  );
}
