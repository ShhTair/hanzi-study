const fs = require('fs');

const dbTs = fs.readFileSync(__dirname + '/src/db/database.ts', 'utf-8');
const layoutTs = fs.readFileSync(__dirname + '/app/_layout.tsx', 'utf-8');
console.log('Check 1:', layoutTs.includes('assets/db/hanzi.db'));

