import fs from "fs";

console.log("Checking /mau routes:");
function checkDir(d) {
  if (fs.existsSync(d)) {
    console.log(d, fs.readdirSync(d));
  } else {
    console.log(d, "does not exist");
  }
}
checkDir("app/mau");
checkDir("app/mau/[templateId]");

