const fs = require('fs');

function fix(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = dir + '/' + file;
    if (fs.statSync(fullPath).isDirectory()) {
      fix(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const depth = fullPath.split('/').length - 2;
      const relativePath = depth > 0 ? '../'.repeat(depth) + 'src/constants/colors' : './src/constants/colors';
      const wrongImport = `import { Colors } from '${relativePath}';`;
      
      if (content.startsWith(wrongImport)) {
        content = content.replace(wrongImport, '');
        // Calculate correct import
        const pathParts = fullPath.split('/');
        let up = '';
        if (pathParts[0] === 'app') {
            up = '../'.repeat(pathParts.length - 1);
        } else if (pathParts[0] === 'src') {
            up = '../'.repeat(pathParts.length - 1);
        }
        
        let correctImport = `import { Colors } from '${up}src/constants/colors';\n`;
        content = correctImport + content;
      }
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

fix('app');
fix('src');
