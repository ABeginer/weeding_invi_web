import fs from "node:fs";
import path from "node:path";

const templatesDir = path.join(process.cwd(), "templates");
const entries = fs.readdirSync(templatesDir, { withFileTypes: true });

for (const entry of entries) {
  if (entry.isDirectory() && entry.name !== "shared" && entry.name !== "themed" && entry.name !== "__generated__") {
    const indexPath = path.join(templatesDir, entry.name, "index.tsx");
    if (fs.existsSync(indexPath)) {
      const code = fs.readFileSync(indexPath, "utf-8");
      // Check for contained ? ...
      const containedMatches = [...code.matchAll(/contained\s*\?[^:;\n]+:[^;,\n]+/g)];
      for (const m of containedMatches) {
        if (m[0].includes("overflow-hidden") || m[0].includes("min-h-full") || m[0].includes("h-full")) {
          console.log(`[${entry.name}] -> ${m[0]}`);
        }
      }
    }
  }
}
