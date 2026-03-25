import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export default function Layout() {
  return (
    <SQLiteProvider databaseName="hanzi.db" assetSource={{ assetId: require('../assets/db/hanzi.db') }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SQLiteProvider>
  );
}
