const fs = require('fs');
let file = fs.readFileSync('app/character/[char].tsx', 'utf8');

file = file.replace(/        \n        \{activeTab === 'Sentences'/g, "        )}\n\n        {activeTab === 'Sentences'");

// Let's just fix it manually by loading it into memory and adjusting
let lines = file.split('\n');
let fixed = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</View>') && lines[i-1] && lines[i-1].includes('</View>')) {
     // I need to add )}
  }
}
