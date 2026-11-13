import fs from "fs";
import path from "path";

function search(file) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, "utf-8");
    const mains = content.match(/<main/g) || [];
    const h1s = content.match(/<h1/g) || [];
    const footers = content.match(/<footer/g) || [];
    console.log(`${file}: mains=${mains.length}, h1s=${h1s.length}, footers=${footers.length}`);
    if (content.includes("hidden") && content.includes("basic-1")) {
      console.log(`Found hidden basic-1 in ${file}`);
    }
  }
}

search("app/page.tsx");
search("app/layout.tsx");
search("components/landing/landing-page-client.tsx");
search("components/landing/hero.tsx");
search("components/landing/phone-frame.tsx");
search("templates/TemplatePreviewRenderer.tsx");
search("templates/basic-1/index.tsx");
search("templates/basic-2/index.tsx");
search("templates/basic-3/index.tsx");
search("templates/pro-1/index.tsx");

