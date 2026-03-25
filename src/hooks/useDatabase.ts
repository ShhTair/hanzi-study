import { SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

export function useDatabase() {
  const db = useSQLiteContext();

  const getCharactersByHSKLevel = useCallback(async (level: number) => {
    return await db.getAllAsync('SELECT * FROM characters WHERE hsk_level = ? ORDER BY frequency_rank ASC LIMIT 100', [level]);
  }, [db]);

  const searchCharacters = useCallback(async (query: string) => {
    const term = `%${query}%`;
    return await db.getAllAsync(
      'SELECT * FROM characters WHERE simplified LIKE ? OR traditional LIKE ? OR pinyin LIKE ? OR meanings LIKE ? LIMIT 50',
      [term, term, term, term]
    );
  }, [db]);

  const getCharacterDetail = useCallback(async (simplified: string) => {
    return await db.getFirstAsync('SELECT * FROM characters WHERE simplified = ?', [simplified]);
  }, [db]);

  const updateProgress = useCallback(async (characterId: number, rating: number) => {
    const exists = await db.getFirstAsync('SELECT character_id FROM user_progress WHERE character_id = ?', [characterId]);
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
  }, [db]);

  return {
    db,
    getCharactersByHSKLevel,
    searchCharacters,
    getCharacterDetail,
    updateProgress,
  };
}
