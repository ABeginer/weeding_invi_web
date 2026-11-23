import fs from "node:fs";
import path from "node:path";

function searchDir(dir, extFilter, cb) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDir(fullPath, extFilter, cb);
    } else if (extFilter.some(ext => entry.name.endsWith(ext))) {
      cb(fullPath);
    }
  }
}

console.log("=== ALL MP3 FILES IN PUBLIC ===");
const publicMp3s = [];
searchDir("public", [".mp3"], (filePath) => {
  const rel = path.relative(path.join(process.cwd(), "public"), filePath).replace(/\\/g, "/");
  publicMp3s.push("/" + rel);
});
for (const p of publicMp3s) {
  console.log(" -", p);
}

console.log("\n=== CHECKING TEMPLATE MUSIC PATHS IN TEMPLATES/REGISTRY.TS ===");
const registryContent = fs.readFileSync("templates/registry.ts", "utf-8");
const musicMatches = [...registryContent.matchAll(/src:\s*["'`]([^"'`]+)["'`]/g)];
for (const m of musicMatches) {
  const musicSrc = m[1];
  const diskPath = path.join(process.cwd(), "public", musicSrc.replace(/^\//, ""));
  const exists = fs.existsSync(diskPath);
  console.log(`[${exists ? "OK 200" : "MISSING 404"}] ${musicSrc}`);
}
