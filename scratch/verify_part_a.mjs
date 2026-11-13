import fs from "fs";

console.log("=== VERIFYING PART A ===");

// 1. Check template-grid cover image loading
const tplGrid = fs.readFileSync("components/landing/template-grid.tsx", "utf-8");
const hasLazy = tplGrid.includes('loading="lazy"');
const hasEager = tplGrid.includes('loading="eager"');
console.log("TemplateGrid has loading='lazy':", hasLazy, "(has eager:", hasEager, ")");

// 2. Check layout preload
const layout = fs.readFileSync("app/layout.tsx", "utf-8");
console.log("Layout has hero2 preload:", layout.includes("hero2"));

// 3. Check demo.ts webp references
const demo = fs.readFileSync("content/demo.ts", "utf-8");
const hasJpgInDemo = demo.includes(".jpg");
console.log("Demo has .jpg left:", hasJpgInDemo);
const webpCount = (demo.match(/\.webp/g) || []).length;
console.log("Demo .webp count:", webpCount);

// 4. Check contained tags in WeddingInvitationContent, Footer, Hero
const wContent = fs.readFileSync("components/invitation/WeddingInvitationContent.tsx", "utf-8");
console.log("WeddingInvitationContent has MainTag:", wContent.includes("const MainTag = isContained ? \"div\" : \"main\""));

const footer = fs.readFileSync("components/invitation/Footer.tsx", "utf-8");
console.log("Footer has FooterTag:", footer.includes("const FooterTag = isContained ? \"div\" : \"footer\""));

const hero = fs.readFileSync("components/invitation/Hero.tsx", "utf-8");
console.log("Hero has p for contained:", hero.includes('as={isContained ? "p" : "h1"}'));

console.log("PART A VERIFICATION COMPLETE.");

