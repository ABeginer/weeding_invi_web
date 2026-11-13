import fs from "fs";

if (fs.existsSync("public/photos")) {
  console.log(fs.readdirSync("public/photos"));
} else {
  console.log("public/photos does not exist");
}

