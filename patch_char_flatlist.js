const fs = require('fs');

let file = fs.readFileSync('app/character/[char].tsx', 'utf8');

// Replace map with FlatList for Vocab
const vocabRegex = /\{words\.length === 0 \? \([\s\S]*?\}\)/;
const newVocab = `{words.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No vocabulary found</Text>
              </View>
            ) : (
              <FlatList
                data={words}
                keyExtractor={(_, idx) => idx.toString()}
                renderItem={({item, index: idx}) => (
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
                )}
              />
            )}`;
file = file.replace(vocabRegex, newVocab);

// Replace map with FlatList for Sentences
const sentRegex = /\{sentences\.length === 0 \? \([\s\S]*?\}\)/;
const newSents = `{sentences.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No sentences found</Text>
              </View>
            ) : (
              <FlatList
                data={sentences}
                keyExtractor={(_, idx) => idx.toString()}
                renderItem={({item, index: idx}) => {
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
                }}
              />
            )}`;
file = file.replace(sentRegex, newSents);

if (!file.includes('FlatList')) {
  file = file.replace(
    "import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';",
    "import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';"
  );
}

fs.writeFileSync('app/character/[char].tsx', file);
