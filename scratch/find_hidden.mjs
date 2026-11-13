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
    } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes("hidden") && (content.includes("<main") || content.includes("<footer") || content.includes("<h1"))) {
        console.log(`Found hidden with main/footer/h1 in: ${fullPath}`);
      }
      if (content.includes("<main")) {
        console.log(`Found <main in: ${fullPath}`);
      }
      if (content.includes("<h1")) {
        console.log(`Found <h1 in: ${fullPath}`);
      }
    }
  }
}

searchDir(".");

