import fs from 'node:fs';
import path from 'node:path';

function searchExact(dir, text) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === '.open-next' || entry.name === '.wrangler') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchExact(fullPath, text);
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(text)) {
        console.log(`Matched "${text}" in: ${fullPath}`);
      }
    }
  }
}

searchExact(process.cwd(), '[/media');
searchExact(process.cwd(), 'wedding.mp3');
searchExact(process.cwd(), 'Minh Khôi&Thảo NguyênMinh Khôi&Thảo Nguyên');
searchExact(process.cwd(), 'Minh Khôi & Thảo Nguyên');

