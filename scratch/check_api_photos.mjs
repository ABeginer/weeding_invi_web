import fs from "fs";

const content = fs.readFileSync("lib/api.ts", "utf-8");
const lines = content.split("\n");
lines.forEach((l, i) => {
  if (l.includes("Photo") || l.includes("photos") || l.includes("upload")) {
    console.log(`line ${i+1}: ${l}`);
  }
});

