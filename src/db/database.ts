import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const dbName = 'hanzi.db';
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

  // Check if DB exists locally
  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  if (!fileInfo.exists) {
    // Make sure SQLite directory exists
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`, {
      intermediates: true,
    });
    
    // Copy bundled DB
    const asset = await Asset.loadAsync(require('../../assets/db/hanzi.db'));
    if (!asset[0].localUri) {
      throw new Error("Unable to locate bundled database asset");
    }
    await FileSystem.copyAsync({
      from: asset[0].localUri,
      to: dbPath,
    });
  }

  // Open DB
  return SQLite.openDatabaseAsync(dbName);
}

// Queries
export async function getCharactersByHSKLevel(db: SQLite.SQLiteDatabase, level: number) {
  const rows = await db.getAllAsync(
    'SELECT * FROM characters WHERE hsk_level = ? ORDER BY frequency_rank ASC LIMIT 100',
    [level]
  );
  return rows;
}

export async function getCharacterDetail(db: SQLite.SQLiteDatabase, simplified: string) {
  const row = await db.getFirstAsync(
    'SELECT * FROM characters WHERE simplified = ?',
    [simplified]
  );
  return row;
}

export async function searchCharacters(db: SQLite.SQLiteDatabase, query: string) {
  const searchTerm = `%${query}%`;
  const rows = await db.getAllAsync(
    'SELECT * FROM characters WHERE simplified LIKE ? OR traditional LIKE ? OR pinyin LIKE ? LIMIT 50',
    [searchTerm, searchTerm, searchTerm]
  );
  return rows;
}

export async function updateProgress(db: SQLite.SQLiteDatabase, characterId: number, rating: number) {
  // Check if exists
  const exists = await db.getFirstAsync(
    'SELECT character_id FROM user_progress WHERE character_id = ?',
    [characterId]
  );
  
  const now = new Date().toISOString();
  
  if (exists) {
    await db.runAsync(
      'UPDATE user_progress SET rating = ?, last_reviewed = ?, review_count = review_count + 1 WHERE character_id = ?',
      [rating, now, characterId]
    );
  } else {
    await db.runAsync(
      'INSERT INTO user_progress (character_id, rating, last_reviewed, review_count) VALUES (?, ?, ?, 1)',
      [characterId, rating, now]
    );
  }
}
