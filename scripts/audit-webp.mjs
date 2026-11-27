import fs from "node:fs";
import path from "node:path";

function searchDir(dir, extFilter, cb) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
        searchDir(fullPath, extFilter, cb);
      }
    } else if (extFilter.some(ext => entry.name.endsWith(ext))) {
      cb(fullPath);
    }
  }
}

console.log("=== SCANNING FOR .png REFERENCES IN SOURCE CODE ===");
const targetDirs = ["templates", "components", "app", "lib", "config", "content"];
const pngRefs = [];

for (const dir of targetDirs) {
  searchDir(dir, [".ts", ".tsx", ".js", ".mjs", ".json"], (filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const matches = content.matchAll(/["'`]([^"'`]*\.png)["'`]/g);
    for (const match of matches) {
      const ref = match[1];
      // Check if file exists in public/
      let publicPath = "";
      if (ref.startsWith("/")) {
        publicPath = path.join(process.cwd(), "public", ref.slice(1));
      } else {
        publicPath = path.join(process.cwd(), "public", ref);
      }
      const exists = fs.existsSync(publicPath);
      pngRefs.push({
        file: filePath,
        ref,
        publicPath,
        exists,
      });
    }
  });
}

console.log(`Found ${pngRefs.length} .png references:`);
for (const item of pngRefs) {
  console.log(`- [${item.exists ? "EXISTS" : "404 MISSING"}] ${item.file} -> ${item.ref}`);
}

console.log("\n=== SCANNING public/ FOR .png FILES ===");
const publicPngs = [];
searchDir("public", [".png"], (filePath) => {
  publicPngs.push(filePath);
});
console.log(`Found ${publicPngs.length} .png files in public/:`);
for (const p of publicPngs) {
  console.log(`- ${p}`);
}
