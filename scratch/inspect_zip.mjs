import fs from 'node:fs';
import path from 'node:path';

// Let's check if there are files or if we can inspect using standard node or command
const zipPath = 'C:/Users/thuan.ton/.gemini/antigravity/brain/7db10900-12c2-407b-992c-781c44f39459/.user_uploaded/media_1794544416520_a0a9733d.zip';
console.log('Zip exists:', fs.existsSync(zipPath));
if (fs.existsSync(zipPath)) {
  console.log('Zip size:', fs.statSync(zipPath).size);
}

