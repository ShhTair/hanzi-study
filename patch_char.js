const fs = require('fs');

let file = fs.readFileSync('app/character/[char].tsx', 'utf8');

file = file.replace(
  "['Meanings', 'Strokes', 'Components', 'Details'].map",
  "['Meanings', 'Strokes', 'Vocab', 'Sentences'].map"
);

// We need to render the content for Vocab and Sentences
const componentsContainer = `{activeTab === 'Components' && (
          <View style={styles.componentsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{characterData.components || 'N/A'}</Text>
              <Text style={styles.statLabel}>Components</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{characterData.radical || 'N/A'}</Text>
              <Text style={styles.statLabel}>Radical</Text>
            </View>
          </View>
        )}`;

const vocabContainer = `{activeTab === 'Vocab' && (
          <View style={styles.vocabContainer}>
            {words.length === 0 ? (
              <Text style={{color: '#888'}}>No compound words found.</Text>
            ) : (
              words.map((w: any, idx: number) => (
                <TouchableOpacity key={idx} style={{backgroundColor: '#2C2C2E', padding: 12, marginBottom: 8, borderRadius: 8}} onPress={() => router.push(\`/word/\${w.id || w.rowid || w.simplified}\` as any)}>
                  <Text style={{color: '#FFF', fontSize: 18}}>{w.simplified}</Text>
                  <Text style={{color: '#888'}}>{w.pinyin}</Text>
                  <Text style={{color: '#ccc'}}>{w.meanings.split('/')[0]}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}`;

file = file.replace(componentsContainer, vocabContainer);

const detailsContainer = `{activeTab === 'Details' && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{characterData.hsk_level || '-'}</Text>
              <Text style={styles.statLabel}>HSK</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{characterData.frequency || '-'}</Text>
              <Text style={styles.statLabel}>Freq Rank</Text>
            </View>
          </View>
        )}`;

const sentencesContainer = `{activeTab === 'Sentences' && (
          <View style={styles.sentencesContainer}>
            {sentences.length === 0 ? (
              <Text style={{color: '#888'}}>No sentences found.</Text>
            ) : (
              sentences.map((s: any, idx: number) => (
                <View key={idx} style={{backgroundColor: '#2C2C2E', padding: 12, marginBottom: 8, borderRadius: 8}}>
                  <Text style={{color: '#FFF', fontSize: 16}}>{s.simplified}</Text>
                  <Text style={{color: '#888', marginVertical: 4}}>{s.pinyin}</Text>
                  <Text style={{color: '#ccc'}}>{s.meanings.split('/')[0]}</Text>
                </View>
              ))
            )}
          </View>
        )}`;

file = file.replace(detailsContainer, sentencesContainer);

if (!file.includes('router = useRouter()')) {
  file = file.replace("export default function CharacterDetail() {", "import { useRouter } from 'expo-router';\n\nexport default function CharacterDetail() {\n  const router = useRouter();");
}

fs.writeFileSync('app/character/[char].tsx', file);
