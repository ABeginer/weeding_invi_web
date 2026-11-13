import fs from "fs";

["templates/basic-2/index.tsx", "templates/basic-3/index.tsx", "templates/pro-1/index.tsx"].forEach(f => {
  const c = fs.readFileSync(f, "utf-8");
  console.log(f, "h1 matches:", c.match(/<h1/g));
  console.log(f, "main matches:", c.match(/<main/g));
});

