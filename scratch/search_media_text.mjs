import fs from 'node:fs';
import path from 'node:path';

function findMediaText(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === '.open-next' || entry.name === '.wrangler') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findMediaText(fullPath);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('[/media') || content.includes('/media/wedding.mp3')) {
        console.log(`File: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes('[/media') || l.includes('/media/wedding.mp3')) {
            console.log(`  Line ${idx+1}: ${l}`);
          }
        });
      }
    }
  }
}

findMediaText(process.cwd());

