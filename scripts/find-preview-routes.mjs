import fs from "node:fs";
import path from "node:path";

function findFiles(dir, filter) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(full, filter));
    } else if (filter(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const previewFiles = findFiles("app", (name) => name.includes("preview") || name.includes("page.tsx"));
console.log("=== APP ROUTES / PREVIEW FILES ===");
for (const f of previewFiles) {
  if (f.includes("preview") || f.includes("mau") || f.includes("thiep")) {
    console.log("-", f);
  }
}
