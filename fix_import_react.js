const fs = require('fs');
let file = fs.readFileSync('app/character/[char].tsx', 'utf8');

// Use proper import instead of inline replacement that broke syntax
if (!file.includes("import React")) {
  file = "import React from 'react';\n" + file;
}

fs.writeFileSync('app/character/[char].tsx', file);
