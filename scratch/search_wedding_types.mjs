import fs from "fs";

const content = fs.readFileSync("lib/wedding-types.ts", "utf-8");
const lines = content.split("\n");
lines.forEach((l, i) => {
  if (l.includes("PhotoKind") || l.includes('"gallery"') || l.includes('"banner"')) {
    console.log(`line ${i+1}: ${l}`);
  }
});

