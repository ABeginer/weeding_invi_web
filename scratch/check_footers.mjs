import fs from "fs";

function findContext(file, str) {
  const c = fs.readFileSync(file, "utf-8");
  const idx = c.indexOf(str);
  if (idx !== -1) {
    console.log(file, "===\n", c.substring(Math.max(0, idx - 100), idx + 200));
  }
}

findContext("templates/basic-2/index.tsx", "<footer");
findContext("templates/basic-3/index.tsx", "<footer");
findContext("templates/pro-1/index.tsx", "<footer");

