const fs = require('fs');
let file = fs.readFileSync('app/(tabs)/index.tsx', 'utf8');

// Fix Due Today query
file = file.replace(
  "SELECT count(*) as count FROM user_progress WHERE next_review <= strftime('%s', 'now') * 1000 OR next_review <= date('now')",
  "SELECT count(*) as count FROM user_progress WHERE next_review <= strftime('%s', 'now')"
);

// Fix Streak to read from AsyncStorage
if (!file.includes("AsyncStorage.getItem('@hanzi_streak')")) {
  file = file.replace(
    "import { Colors } from '../../src/constants/colors';",
    "import { Colors } from '../../src/constants/colors';\nimport AsyncStorage from '@react-native-async-storage/async-storage';"
  );
  
  file = file.replace(
    "const datesResult = await tryAllQuery<{ date: string }>(\"SELECT DISTINCT DATE(last_reviewed) as date FROM user_progress WHERE last_reviewed IS NOT NULL ORDER BY date DESC\");\n        // Simple streak calculation\n        if (isMounted && datesResult) {\n          setStreak(datesResult.length); // Fallback logic\n        }",
    "const streakVal = await AsyncStorage.getItem('@hanzi_streak');\n        if (isMounted && streakVal) setStreak(parseInt(streakVal, 10));"
  );
}

fs.writeFileSync('app/(tabs)/index.tsx', file);
