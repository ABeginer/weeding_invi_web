import fs from "fs";

function search(file) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, "utf-8");
    console.log(file, "contains PhotoKind:", content.includes("PhotoKind"));
    console.log(file, "contains kind:", content.includes("kind"));
  }
}

search("lib/wedding-types.ts");
search("lib/api.ts");
search("lib/wedding-draft.ts");

