import fs from "fs";
import path from "path";

function searchDir(dir, query) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
        searchDir(fullPath, query);
      }
    } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes(query)) {
        console.log(`Found "${query}" in: ${fullPath}`);
      }
    }
  }
}

searchDir(".", "Đúng tên");
searchDir(".", "tiết kiệm công sức ghi tay");
searchDir(".", "Dashboard chốt bàn");
searchDir(".", "chốt bàn");
