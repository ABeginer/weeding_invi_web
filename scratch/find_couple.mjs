import fs from 'node:fs';
import path from 'node:path';

function findGroom(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === '.open-next') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findGroom(fullPath);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('CoupleDisplayName') || content.includes('groomName') || content.includes('Minh Khôi')) {
        console.log(`File: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes('CoupleDisplayName') || l.includes('Minh Khôi') || l.includes('groom') && l.includes('bride')) {
            console.log(`  L${idx+1}: ${l.trim()}`);
          }
        });
      }
    }
  }
}

findGroom(process.cwd());

