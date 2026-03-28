const fs = require('fs');

function fix(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = dir + '/' + file;
    if (fs.statSync(fullPath).isDirectory()) {
      fix(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/([a-zA-Z]+)=Colors\.([a-zA-Z]+)/g, '$1={Colors.$2}');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

fix('app');
fix('src');
