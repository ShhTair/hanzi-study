const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('mode:')) {
    // Already patched mode in previous run
  }
  
  // Need to pass level and set
  content = content.replace(
    /router\.push\(\{ pathname: '\/study\/summary', params: \{ results: JSON\.stringify\((.*?)\), mode: '(.*?)' \} \} as any\);/,
    "router.push({ pathname: '/study/summary', params: { results: JSON.stringify($1), mode: '$2', level: levelNum, set: setNum } } as any);"
  );
  fs.writeFileSync(file, content);
}

patchFile('app/study/flashcard.tsx');
patchFile('app/study/quiz.tsx');
patchFile('app/study/writing.tsx');

// Now update summary.tsx
let summary = fs.readFileSync('app/study/summary.tsx', 'utf8');
summary = summary.replace(
  "const params = useLocalSearchParams();",
  "const params = useLocalSearchParams<{ results: string; mode: string; level: string; set: string }>();"
);

summary = summary.replace(
  "<TouchableOpacity style={styles.bottomBtn} onPress={() => router.back()}>\n          <Text style={styles.bottomBtnText}>REPEAT</Text>\n        </TouchableOpacity>",
  `<TouchableOpacity style={styles.bottomBtn} onPress={() => router.replace({ pathname: \`/study/\${params.mode || 'flashcard'}\`, params: { level: params.level || '1', set: params.set || '0' } } as any)}>\n          <Text style={styles.bottomBtnText}>REPEAT</Text>\n        </TouchableOpacity>`
);

fs.writeFileSync('app/study/summary.tsx', summary);

