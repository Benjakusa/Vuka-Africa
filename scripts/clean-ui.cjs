const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Apply hardcoded color replacements
  content = content.replace(/text-(blue|indigo|cyan|teal|sky)-[0-9]{2,3}/g, 'text-foreground');
  content = content.replace(/text-(green|emerald|lime)-[0-9]{2,3}/g, 'text-foreground');
  content = content.replace(/text-(red|rose|pink)-[0-9]{2,3}/g, 'text-primary');
  content = content.replace(/text-(yellow|amber|orange)-[0-9]{2,3}/g, 'text-body');
  
  content = content.replace(/bg-(blue|indigo|cyan|teal|sky)-[0-9]{2,3}/g, 'bg-surface');
  content = content.replace(/bg-(green|emerald|lime)-[0-9]{2,3}/g, 'bg-surface');
  content = content.replace(/bg-(red|rose|pink)-[0-9]{2,3}/g, 'bg-primary');
  content = content.replace(/bg-(yellow|amber|orange)-[0-9]{2,3}/g, 'bg-surface');

  content = content.replace(/border-(blue|indigo|cyan|teal|sky)-[0-9]{2,3}/g, 'border-border');
  content = content.replace(/border-(green|emerald|lime)-[0-9]{2,3}/g, 'border-border');
  content = content.replace(/border-(red|rose|pink)-[0-9]{2,3}/g, 'border-primary');
  content = content.replace(/border-(yellow|amber|orange)-[0-9]{2,3}/g, 'border-border');

  // Semantic color replacements
  content = content.replace(/\btext-(success|warning|destructive|info)(-[0-9]{2,3})?\b/g, (match, p1) => {
    if (p1 === 'success') return 'text-foreground';
    if (p1 === 'destructive') return 'text-primary';
    if (p1 === 'warning') return 'text-body';
    if (p1 === 'info') return 'text-foreground';
    return match;
  });

  content = content.replace(/\bbg-(success|warning|destructive|info)(-[0-9]{2,3})?\b/g, (match, p1) => {
    if (p1 === 'success') return 'bg-surface';
    if (p1 === 'destructive') return 'bg-primary text-white';
    if (p1 === 'warning') return 'bg-surface';
    if (p1 === 'info') return 'bg-surface';
    return match;
  });
  
  // Remove shadows (except shadow-card)
  content = content.replace(/\bshadow-(sm|md|lg|xl|2xl|inner|none)\b/g, '');
  content = content.replace(/\bshadow\b(?!-card)/g, '');
  
  // Remove rings and outlines
  content = content.replace(/\bring(-[a-zA-Z0-9]+)?\b/g, '');
  content = content.replace(/\bfocus:ring(-[a-zA-Z0-9]+)?\b/g, '');
  content = content.replace(/\bfocus:outline-none\b/g, '');
  
  content = content.replace(/\btext-muted\b/g, 'text-body');
  content = content.replace(/\bbg-muted\b/g, 'bg-surface');

  // Clean up extra spaces inside class strings
  content = content.replace(/className="([^"]+)"/g, (match, p1) => {
    return `className="${p1.replace(/\s+/g, ' ').trim()}"`;
  });
  content = content.replace(/className=\{`([^`]+)`\}/g, (match, p1) => {
    return `className={\`${p1.replace(/ \s+/g, ' ').trim()}\`}`;
  });
  content = content.replace(/className=\{'([^']+)'\}/g, (match, p1) => {
    return `className={'${p1.replace(/\s+/g, ' ').trim()}'}`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
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
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        processFile(file);
      }
    }
  }
}

walk(srcDir);
console.log('Cleanup completed.');
