import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const version = process.argv[2] || "4";
const productsPath = path.join(root, "client/src/data/products.js");
const sqlPath = path.join(root, "server/sql/catalog.sql");

for (const file of [productsPath, sqlPath]) {
  let text = fs.readFileSync(file, "utf8");
  text = text.replace(
    /(\/images\/products\/[a-zA-Z0-9._-]+\.jpg)(?:\?v=\d+)?/g,
    `$1?v=${version}`
  );
  fs.writeFileSync(file, text);
  console.log(`updated ${path.relative(root, file)} → v=${version}`);
}
