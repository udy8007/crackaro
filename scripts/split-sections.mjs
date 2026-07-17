import fs from "fs";
import path from "path";

const body = fs.readFileSync("client/src/_generated/body.jsx", "utf8");

function wrap(name, content) {
  return `export default function ${name}() {\n  return (\n    <>\n${content.trim()}\n    </>\n  );\n}\n`;
}

const markers = {
  Hero: ['<section className="hero"', '{/* Trust Strip */}'],
  Trust: ['<section className="trust">', '{/* Categories */}'],
  About: ['{/* About */}', '{/* Safety */}'],
  Safety: ['{/* Safety */}', '{/* Testimonials */}'],
  Testimonials: ['{/* Testimonials */}', '{/* Contact */}'],
};

const dir = "client/src/components/sections";
fs.mkdirSync(dir, { recursive: true });

for (const [name, [startTok, endTok]] of Object.entries(markers)) {
  const start = body.indexOf(startTok);
  const end = body.indexOf(endTok);
  if (start < 0 || end < 0) {
    console.error("missing markers for", name, start, end);
    continue;
  }
  let content = body.slice(start, end);
  // drop leading comment-only lines for non-hero
  content = content.replace(/^\{\/\*[\s\S]*?\*\/\}\s*/, "");
  const file = path.join(dir, `${name}.jsx`);
  fs.writeFileSync(file, wrap(name, content));
  console.log("wrote", file, content.length);
}
