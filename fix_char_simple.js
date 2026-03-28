const fs = require('fs');
let file = fs.readFileSync('app/character/[char].tsx', 'utf8');

// I will use regex to find and replace the block for Vocab and Sentences
const vocabRegex = /\{activeTab === 'Vocab' && \([\s\S]*?\n        \}\)/;
const sentencesRegex = /\{activeTab === 'Sentences' && \([\s\S]*?\n        \}\)/;

const newVocab = `{activeTab === 'Vocab' && (
          <View style={styles.vocabContainer}>
            {words.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No vocabulary found</Text>
              </View>
            ) : (
              words.map((item: any, idx: number) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.wordRow}
                  onPress={() => router.push({ pathname: '/word/[id]', params: { id: item.id?.toString() || item.rowid?.toString() || item.simplified } } as any)}
                >
                  <View style={styles.wordLeft}>
                    <Text style={styles.wordSimplified}>{item.simplified}</Text>
                  </View>
                  <View style={styles.wordCenter}>
                    <Text style={styles.wordPinyin}>{item.pinyin}</Text>
                    <Text style={styles.wordMeaning} numberOfLines={1}>{item.meanings ? item.meanings.split('/')[0] : ''}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}`;

const newSentences = `{activeTab === 'Sentences' && (
          <View style={styles.sentencesContainer}>
            {sentences.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No sentences found</Text>
              </View>
            ) : (
              sentences.map((item: any, idx: number) => {
                const parts = item.simplified.split(char as string);
                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.sentenceRow}
                    onPress={() => {
                      const newSentences = [...sentences];
                      newSentences[idx].expanded = !newSentences[idx].expanded;
                      setSentences(newSentences);
                    }}
                  >
                    <Text style={styles.sentenceText}>
                      {parts.map((part: string, pIdx: number) => (
                        <React.Fragment key={pIdx}>
                          {part}
                          {pIdx < parts.length - 1 && (
                            <Text style={styles.sentenceHighlight}>{char}</Text>
                          )}
                        </React.Fragment>
                      ))}
                    </Text>
                    {item.expanded && (
                      <View style={styles.sentenceExpanded}>
                        <PinyinText pinyin={item.pinyin} size={14} style={{marginBottom: 4, justifyContent: 'flex-start'}} />
                        <Text style={styles.sentenceTranslation}>{item.meanings ? item.meanings.split('/')[0] : ''}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}`;

file = file.replace(vocabRegex, newVocab);
file = file.replace(sentencesRegex, newSentences);

const newStyles = `  vocabContainer: { flex: 1, marginTop: 16 },
  wordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  wordLeft: { width: 60 },
  wordSimplified: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
  wordCenter: { flex: 1, paddingHorizontal: 12 },
  wordPinyin: { fontSize: 14, color: Colors.textMuted, marginBottom: 4 },
  wordMeaning: { fontSize: 14, color: Colors.textSecondary },
  sentencesContainer: { flex: 1, marginTop: 16 },
  sentenceRow: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  sentenceText: { fontSize: 16, color: Colors.textPrimary, lineHeight: 24 },
  sentenceHighlight: { color: Colors.primary, fontWeight: 'bold' },
  sentenceExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  sentenceTranslation: { fontSize: 14, color: Colors.textSecondary },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyStateText: { color: Colors.textMuted, fontSize: 16 },
});`;

file = file.replace("});", newStyles);

fs.writeFileSync('app/character/[char].tsx', file);
