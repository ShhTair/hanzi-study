const fs = require('fs');

let file = fs.readFileSync('app/character/[char].tsx', 'utf8');

// Replace the initFavoriteSchema which is completely wrong and not needed
const oldInit = `  useEffect(() => {
    async function initFavoriteSchema() {
      try {
        await db.execAsync('ALTER TABLE user_progress ADD COLUMN is_favorite INTEGER DEFAULT 0;');
      } catch (e) {}
      try {
        await db.execAsync('ALTER TABLE user_progress ADD COLUMN last_reviewed TEXT;');
      } catch (e) {
        // Column likely already exists
      }
    }
    initFavoriteSchema();
  }, [db]);`;

file = file.replace(oldInit, '');

// Replace load() to use `isFavorite`
const oldLoad = `        try {
          const row = await db.getFirstAsync<{ is_favorite: number }>('SELECT is_favorite FROM user_progress WHERE word_id = ?', [char as string]);
          if (row) {
            setIsFavorite(row.is_favorite === 1);
          }
        } catch (e) {
          // ignore error if not found or column missing yet
        }`;
const newLoad = `        try {
          const fav = await isFavorite(char as string);
          setIsFavorite(fav);
        } catch (e) {
          console.warn("Failed to get favorite status:", e);
        }`;
file = file.replace(oldLoad, newLoad);

// Replace toggleFavorite to use `database.ts`
const oldToggle = `  const toggleFavorite = async () => {
    const newStatus = !isFavorite;
    setIsFavorite(newStatus);
    try {
      const exists = await db.getFirstAsync('SELECT word_id FROM user_progress WHERE word_id = ?', [char as string]);
      if (exists) {
        await db.runAsync('UPDATE user_progress SET is_favorite = ? WHERE word_id = ?', [newStatus ? 1 : 0, char as string]);
      } else {
        await db.runAsync('INSERT INTO user_progress (word_id, is_favorite) VALUES (?, ?)', [char as string, newStatus ? 1 : 0]);
      }
    } catch (e) {
      console.warn("Failed to update favorites:", e);
    }
  };`;
const newToggle = `  const handleToggleFavorite = async () => {
    if (typeof char === 'string') {
      const newStatus = await toggleFavorite(char);
      setIsFavorite(newStatus);
    }
  };`;
file = file.replace(oldToggle, newToggle);

// Replace the onPress
file = file.replace("onPress={toggleFavorite}", "onPress={handleToggleFavorite}");
file = file.replace("import { getWordsContaining, getSentencesContaining }", "import { getWordsContaining, getSentencesContaining, toggleFavorite, isFavorite }");

fs.writeFileSync('app/character/[char].tsx', file);

