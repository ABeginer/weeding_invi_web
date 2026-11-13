import fs from "fs";

const content = fs.readFileSync("components/dashboard/WeddingDetailView.tsx", "utf-8");
const lines = content.split("\n");
lines.forEach((l, i) => {
  if (l.includes("PhotosManager") || l.includes("tab") || l.includes("ảnh") || l.includes("photo")) {
    console.log(`line ${i + 1}: ${l}`);
  }
});

