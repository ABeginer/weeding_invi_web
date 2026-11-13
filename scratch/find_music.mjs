import fs from 'node:fs';
import path from 'node:path';

function findMusicFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === '.open-next' || entry.name === '.wrangler') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findMusicFiles(fullPath);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('musicplayer') || content.includes('data.music') || content.includes('music.title') || content.includes('music.src')) {
        console.log(`File: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.toLowerCase().includes('musicplayer') || l.includes('data.music') || l.includes('music.title') || l.includes('music.src')) {
            console.log(`  L${idx+1}: ${l.trim()}`);
          }
        });
      }
    }
  }
}

findMusicFiles(process.cwd());

