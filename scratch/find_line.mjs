import fs from "fs";

function findLine(file, str) {
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  lines.forEach((l, i) => {
    if (l.includes(str)) console.log(file, i+1, l);
  });
}

findLine("templates/basic-2/index.tsx", "<footer");
findLine("templates/basic-3/index.tsx", "<footer");
findLine("templates/pro-1/index.tsx", "<footer");

