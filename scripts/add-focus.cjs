const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Find inputs, textareas, selects and add focus:border-primary
  content = content.replace(/<(input|textarea|select)([^>]+?)className=["']([^"']+)["']/g, (match, tag, before, cls) => {
    if (!cls.includes('focus:border-primary') && !cls.includes('focus:border-') && !cls.includes('focus:outline-')) {
      return `<${tag}${before}className="${cls} focus:border-primary"`;
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated focus styles in: ${filePath}`);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  for (let file of list) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file);
    } else {
      if (file.endsWith('.tsx')) {
        processFile(file);
      }
    }
  }
}

walk(srcDir);
console.log('Focus styles updated.');
