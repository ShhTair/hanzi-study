const fs = require('fs');

let file = fs.readFileSync('app/character/[char].tsx', 'utf8');

const compRegex = /\{activeTab === 'Components' && \([\s\S]*?\n        \}\)/;
const detRegex = /\{activeTab === 'Details' && \([\s\S]*?\n        \}\)/;

const vocabNew = `{activeTab === 'Vocab' && (
          <View style={styles.componentsContainer}>
            {words.length === 0 ? (
              <Text style={{color: Colors.textMuted}}>No compound words found.</Text>
            ) : (
              words.map((w: any, idx: number) => (
                <TouchableOpacity key={idx} style={{backgroundColor: Colors.card, padding: 12, marginBottom: 8, borderRadius: 8}} onPress={() => router.push(\`/word/\${w.id || w.rowid || w.simplified}\` as any)}>
                  <Text style={{color: Colors.textPrimary, fontSize: 18}}>{w.simplified}</Text>
                  <Text style={{color: Colors.textMuted}}>{w.pinyin}</Text>
                  <Text style={{color: Colors.textSecondary}}>{w.meanings.split('/')[0]}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}`;

const sentsNew = `{activeTab === 'Sentences' && (
          <View style={styles.statsContainer}>
            {sentences.length === 0 ? (
              <Text style={{color: Colors.textMuted}}>No sentences found.</Text>
            ) : (
              sentences.map((s: any, idx: number) => (
                <View key={idx} style={{backgroundColor: Colors.card, padding: 12, marginBottom: 8, borderRadius: 8}}>
                  <Text style={{color: Colors.textPrimary, fontSize: 16}}>{s.simplified}</Text>
                  <Text style={{color: Colors.textMuted, marginVertical: 4}}>{s.pinyin}</Text>
                  <Text style={{color: Colors.textSecondary}}>{s.meanings.split('/')[0]}</Text>
                </View>
              ))
            )}
          </View>
        )}`;

file = file.replace(compRegex, vocabNew);
file = file.replace(detRegex, sentsNew);

file = file.replace(
  "['Meanings', 'Strokes', 'Components', 'Details'].map",
  "['Meanings', 'Strokes', 'Vocab', 'Sentences'].map"
);

fs.writeFileSync('app/character/[char].tsx', file);
