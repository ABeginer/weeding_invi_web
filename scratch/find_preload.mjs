import fs from "fs";
import path from "path";

function searchDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
        searchDir(fullPath);
      }
    } else if (entry.isFile()) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes("hero2.jpg") || content.includes("rel=\"preload\"")) {
        console.log(`Found in: ${fullPath}`);
        let lines = content.split("\n");
        lines.forEach((l, i) => {
          if (l.includes("hero2.jpg") || l.includes("rel=\"preload\"")) {
            console.log(`  Line ${i + 1}: ${l}`);
          }
        });
      }
    }
  }
}

searchDir(".");
