const fs = require('fs');

let dbFile = fs.readFileSync('src/db/database.ts', 'utf8');
if (!dbFile.includes('last_reviewed')) {
  dbFile = dbFile.replace(
    "INSERT OR REPLACE INTO user_progress (word_id, srs_interval, next_review, ease_factor, correct, incorrect)",
    "INSERT OR REPLACE INTO user_progress (word_id, srs_interval, next_review, ease_factor, correct, incorrect, last_reviewed)"
  );
  dbFile = dbFile.replace(
    "VALUES (?, ?, ?, ?, ?, ?)",
    "VALUES (?, ?, ?, ?, ?, ?, datetime('now'))"
  );
  dbFile = dbFile.replace(
    "[word_id, interval, next_review, ease, correct, incorrect]",
    "[word_id, interval, next_review, ease, correct, incorrect]"
  ); // The 7th param is hardcoded in the query as `datetime('now')`
  fs.writeFileSync('src/db/database.ts', dbFile);
}

let layoutFile = fs.readFileSync('app/_layout.tsx', 'utf8');
if (!layoutFile.includes('last_reviewed')) {
  layoutFile = layoutFile.replace(
    "CREATE TABLE IF NOT EXISTS user_progress (word_id TEXT PRIMARY KEY, srs_interval INTEGER DEFAULT 0, next_review INTEGER DEFAULT 0, ease_factor REAL DEFAULT 2.5, correct INTEGER DEFAULT 0, incorrect INTEGER DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS user_progress (word_id TEXT PRIMARY KEY, srs_interval INTEGER DEFAULT 0, next_review INTEGER DEFAULT 0, ease_factor REAL DEFAULT 2.5, correct INTEGER DEFAULT 0, incorrect INTEGER DEFAULT 0, last_reviewed TEXT)"
  );
  fs.writeFileSync('app/_layout.tsx', layoutFile);
}

let charFile = fs.readFileSync('app/character/[char].tsx', 'utf8');
if (!charFile.includes('ALTER TABLE user_progress ADD COLUMN last_reviewed')) {
  charFile = charFile.replace(
    "await db.execAsync('ALTER TABLE user_progress ADD COLUMN is_favorite INTEGER DEFAULT 0;');",
    "await db.execAsync('ALTER TABLE user_progress ADD COLUMN is_favorite INTEGER DEFAULT 0;');\n      } catch (e) {}\n      try {\n        await db.execAsync('ALTER TABLE user_progress ADD COLUMN last_reviewed TEXT;');"
  );
  fs.writeFileSync('app/character/[char].tsx', charFile);
}

