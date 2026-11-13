import fs from 'node:fs';
import path from 'node:path';

function searchFiles(dir, term) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === '.open-next' || entry.name === '.wrangler') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchFiles(fullPath, term);
    } else if (/\.(tsx|ts|js|mjs|json|css|md)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(term)) {
        console.log(`Found "${term}" in: ${fullPath}`);
      }
    }
  }
}

searchFiles(process.cwd(), 'Minh Khôi');
searchFiles(process.cwd(), 'wedding.mp3');
searchFiles(process.cwd(), '2.jpg');

