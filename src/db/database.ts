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

export async function updateSRS(word_id: string, performanceRating: number) {
  const db = await initDB();
  const current = await db.getFirstAsync<any>(
    'SELECT * FROM user_progress WHERE word_id = ?',
    [word_id]
  );
  
  let ease = current ? current.ease_factor : 2.5;
  let interval = current ? current.srs_interval : 0;
  let correct = current ? current.correct || 0 : 0;
  let incorrect = current ? current.incorrect || 0 : 0;

  if (performanceRating >= 3) {
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
    correct++;
  } else {
    interval = 1;
    incorrect++;
  }

  ease = ease + (0.1 - (5 - performanceRating) * (0.08 + (5 - performanceRating) * 0.02));
  if (ease < 1.3) ease = 1.3;

  const next_review = Math.floor(Date.now() / 1000) + (interval * 86400);

  await db.runAsync(
    `INSERT OR REPLACE INTO user_progress (word_id, srs_interval, next_review, ease_factor, correct, incorrect, last_reviewed) 
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [word_id, interval, next_review, ease, correct, incorrect]
  );
}

export async function getUserProgress() {
  const db = await initDB();
  return db.getAllAsync('SELECT * FROM user_progress');
}

export async function getHSKLevel(level: string | number) {
  const db = await initDB();
  return db.getAllAsync('SELECT * FROM hsk WHERE level = ? ORDER BY id', [level]);
}

export async function getWordsContaining(char: string) {
  const db = await initDB();
  const result = await db.getAllAsync(
    `SELECT id, simplified, traditional, pinyin, meanings
     FROM dictionary
     WHERE simplified LIKE ? AND LENGTH(simplified) > 1
     ORDER BY LENGTH(simplified) ASC
     LIMIT 30`,
    [`%${char}%`]
  );
  return result as any[];
}

export async function getSentencesContaining(char: string) {
  const db = await initDB();
  const result = await db.getAllAsync(
    `SELECT id, simplified, pinyin, meanings
     FROM dictionary
     WHERE simplified LIKE ? AND LENGTH(simplified) >= 4
     ORDER BY LENGTH(simplified) ASC
     LIMIT 15`,
    [`%${char}%`]
  );
  return result as any[];
}

export async function getCharacterVariants(char: string) {
  const db = await initDB();
  const result = await db.getFirstAsync(
    `SELECT id, simplified, traditional FROM dictionary WHERE simplified = ? OR traditional = ? LIMIT 1`,
    [char, char]
  );
  return result as { simplified: string; traditional: string } | null;
}

export async function toggleFavorite(word: string): Promise<boolean> {
  const db = await initDB();
  const exists = await db.getFirstAsync('SELECT word FROM favorites WHERE word = ?', [word]);
  if (exists) {
    await db.runAsync('DELETE FROM favorites WHERE word = ?', [word]);
    return false;
  } else {
    await db.runAsync('INSERT INTO favorites (word, added_at) VALUES (?, ?)', [word, Math.floor(Date.now()/1000)]);
    return true;
  }
}

export async function isFavorite(word: string): Promise<boolean> {
  const db = await initDB();
  const result = await db.getFirstAsync('SELECT word FROM favorites WHERE word = ?', [word]);
  return !!result;
}

export async function getAllFavorites() {
  const db = await initDB();
  return await db.getAllAsync('SELECT word, added_at FROM favorites ORDER BY added_at DESC');
}
