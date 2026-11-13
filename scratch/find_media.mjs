import fs from 'node:fs';
import path from 'node:path';

function searchForText(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === '.open-next' || entry.name === '.wrangler') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchForText(fullPath);
    } else if (/\.(tsx|ts|jsx|js|mjs|json)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('wedding.mp3') || content.includes('/media/') || content.includes('.mp3')) {
        console.log(`File: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (l.includes('wedding.mp3') || l.includes('/media/') || l.includes('.mp3')) {
            console.log(`  Line ${i+1}: ${l}`);
          }
        });
      }
    }
  }
}

searchForText(process.cwd());

