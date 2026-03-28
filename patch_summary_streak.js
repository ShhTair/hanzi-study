const fs = require('fs');
let file = fs.readFileSync('app/study/summary.tsx', 'utf8');

if (!file.includes('updateStreak')) {
  file = file.replace(
    "import { PinyinText } from '../../src/components/PinyinText';",
    "import { PinyinText } from '../../src/components/PinyinText';\nimport { updateStreak } from '../../src/hooks/useStreak';"
  );
  
  file = file.replace(
    "setAccuracy(acc);",
    "setAccuracy(acc);\n        updateStreak();"
  );
}

fs.writeFileSync('app/study/summary.tsx', file);
