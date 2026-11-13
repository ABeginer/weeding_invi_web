import fs from "fs";
import path from "path";
import sharp from "sharp";

const photosDir = "public/photos";
const files = fs.readdirSync(photosDir);

for (const file of files) {
  if (file.endsWith(".jpg")) {
    const inputPath = path.join(photosDir, file);
    const outputPath = path.join(photosDir, file.replace(/\.jpg$/, ".webp"));
    
    const info = await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
      
    console.log(`Converted ${file} -> ${path.basename(outputPath)} (${info.width}x${info.height}, ${info.size} bytes)`);
  }
}

