import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

async function copyDatabase() {
  const dbName = 'hanzi.db';
  const dbAsset = require('../../assets/db/hanzi.db');
  
  if (!(FileSystem as any).documentDirectory) {
    throw new Error('FileSystem.documentDirectory is null');
  }

  const dbUri = Asset.fromModule(dbAsset).uri;
  const dbFilePath = `${(FileSystem as any).documentDirectory}SQLite/${dbName}`;

  const fileInfo = await FileSystem.getInfoAsync(dbFilePath);
  if (!fileInfo.exists) {
    await FileSystem.makeDirectoryAsync(
      `${(FileSystem as any).documentDirectory}SQLite`,
      { intermediates: true }
    );
    await FileSystem.downloadAsync(dbUri, dbFilePath);
  }
}

let _db: SQLite.SQLiteDatabase | null = null;

export async function initDB() {
  if (_db) return _db;
  await copyDatabase();
  _db = await SQLite.openDatabaseAsync('hanzi.db');
  return _db;
}

export async function getCharactersByLevel(level: number) {
  const db = await initDB();
  return db.getAllAsync(
    'SELECT * FROM characters WHERE hsk_level = ? ORDER BY frequency_rank ASC LIMIT 100',
    [level]
  );
}

export async function getCharacterDetail(char: string) {
  const db = await initDB();
  return db.getFirstAsync(
    'SELECT * FROM characters WHERE simplified = ?',
    [char]
  );
}

export async function searchCharacters(query: string) {
  const db = await initDB();
  const wildcard = `%${query}%`;
  return db.getAllAsync(
    'SELECT * FROM characters WHERE simplified LIKE ? OR traditional LIKE ? OR pinyin LIKE ? LIMIT 50',
    [wildcard, wildcard, wildcard]
  );
}
