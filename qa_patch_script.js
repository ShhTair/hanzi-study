const fs = require('fs');

function patchChar() {
  let file = fs.readFileSync('app/character/[char].tsx', 'utf8');
  if (!file.includes('displayScript')) {
    file = file.replace(
      "const [isFavorite, setIsFavorite] = useState(false);",
      "const [isFavorite, setIsFavorite] = useState(false);\n  const [displayScript, setDisplayScript] = useState<'simplified'|'traditional'>('simplified');"
    );
    file = file.replace(
      "import { getWordsContaining, getSentencesContaining } from '../../src/db/database';",
      "import { getWordsContaining, getSentencesContaining } from '../../src/db/database';\nimport AsyncStorage from '@react-native-async-storage/async-storage';"
    );
    file = file.replace(
      "setCharacterData(data);",
      "setCharacterData(data);\n        AsyncStorage.getItem('@hanzi_display_script').then(val => { if (val === 'traditional') setDisplayScript('traditional'); });"
    );
    
    // The instruction says: "const displayChar = displayScript === 'traditional' && variants?.traditional ? variants.traditional : char"
    file = file.replace(
      "return null;\n  }, [characterData]);",
      "return null;\n  }, [characterData]);\n\n  const displayChar = displayScript === 'traditional' && characterData?.traditional ? characterData.traditional : char;"
    );
    
    // Replace the main header character display:
    file = file.replace(
      "<Text style={styles.headerTitle}>{char}</Text>",
      "<Text style={styles.headerTitle}>{displayChar}</Text>"
    );
    
    fs.writeFileSync('app/character/[char].tsx', file);
  }
}

function patchHome() {
  let file = fs.readFileSync('app/(tabs)/index.tsx', 'utf8');
  if (!file.includes('displayScript')) {
    file = file.replace(
      "const [streak, setStreak] = useState(0);",
      "const [streak, setStreak] = useState(0);\n  const [displayScript, setDisplayScript] = useState<'simplified'|'traditional'>('simplified');"
    );
    file = file.replace(
      "const streakVal = await AsyncStorage.getItem('@hanzi_streak');",
      "AsyncStorage.getItem('@hanzi_display_script').then(val => { if (val === 'traditional') setDisplayScript('traditional'); });\n      const streakVal = await AsyncStorage.getItem('@hanzi_streak');"
    );
    fs.writeFileSync('app/(tabs)/index.tsx', file);
  }
}

patchChar();
patchHome();
