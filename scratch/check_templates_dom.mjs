import fs from "fs";

function checkFile(file) {
  const content = fs.readFileSync(file, "utf-8");
  ["<h1", "<main", "<footer"].forEach(tag => {
    let pos = 0;
    while ((pos = content.indexOf(tag, pos)) !== -1) {
      console.log(`${file}: found ${tag} at index ${pos}`);
      console.log(content.substring(Math.max(0, pos - 20), pos + 60));
      pos += tag.length;
    }
  });
}

checkFile("templates/basic-2/index.tsx");
checkFile("templates/basic-3/index.tsx");
checkFile("templates/pro-1/index.tsx");

