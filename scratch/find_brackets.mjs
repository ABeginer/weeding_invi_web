import fs from 'node:fs';
import path from 'node:path';

function findBrackets(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === '.open-next' || entry.name === '.wrangler') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findBrackets(fullPath);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('[/media') || content.includes('[') && content.includes('.mp3')) {
        console.log(`Hit in: ${fullPath}`);
      }
    }
  }
}

findBrackets(process.cwd());

