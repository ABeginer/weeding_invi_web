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
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".json"))) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes("/photos/")) {
        console.log(`Found /photos/ in: ${fullPath}`);
        content.split("\n").forEach((line, idx) => {
          if (line.includes("/photos/")) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir(".");

