const fs = require("fs");
const path = require("path");
const { Jimp } = require("jimp");
const GIFEncoder = require("gif-encoder-2");

/** Hero sky cream — matches .hero / top sky */
const CREAM = { r: 255, g: 247, b: 237 }; // #FFF7ED

function paintBackgroundCream(img) {
  const { data, width, height } = img.bitmap;
  const samples = [
    0,
    (width - 1) * 4,
    (height - 1) * width * 4,
    ((height - 1) * width + (width - 1)) * 4,
    (Math.floor(height * 0.08) * width + Math.floor(width * 0.08)) * 4,
    (Math.floor(height * 0.08) * width + Math.floor(width * 0.92)) * 4,
  ];

  let sr = 0;
  let sg = 0;
  let sb = 0;
  samples.forEach((i) => {
    sr += data[i];
    sg += data[i + 1];
    sb += data[i + 2];
  });
  sr /= samples.length;
  sg /= samples.length;
  sb /= samples.length;

  const threshold = 48;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dr = r - sr;
    const dg = g - sg;
    const db = b - sb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    const maxc = Math.max(r, g, b);
    const minc = Math.min(r, g, b);
    const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;

    // Pale / cream / white / previous magenta key → hero cream
    const isMagentaKey = r > 220 && g < 40 && b > 220;
    if (isMagentaKey || dist < threshold || (maxc > 225 && sat < 0.14)) {
      data[i] = CREAM.r;
      data[i + 1] = CREAM.g;
      data[i + 2] = CREAM.b;
      data[i + 3] = 255;
    }
  }
  return img;
}

async function main() {
  const dir = path.join(__dirname, "..", "public", "images");
  const frames = [
    "shinchan-frame-1.png",
    "shinchan-frame-2.png",
    "shinchan-frame-3.png",
    "shinchan-frame-4.png",
  ].map((f) => path.join(dir, f));

  const size = 480;
  const images = [];
  for (const file of frames) {
    const img = await Jimp.read(file);
    img.resize({ w: size, h: size });
    paintBackgroundCream(img);
    images.push(img);
  }

  const encoder = new GIFEncoder(size, size, "neuquant", true);
  encoder.setDelay(160);
  encoder.setRepeat(0);
  encoder.start();

  for (const img of images) {
    encoder.addFrame(img.bitmap.data);
  }
  for (let i = images.length - 2; i >= 1; i -= 1) {
    encoder.addFrame(images[i].bitmap.data);
  }

  encoder.finish();
  const buffer = encoder.out.getData();
  const out = path.join(dir, "hero-family-anim.gif");
  fs.writeFileSync(out, buffer);
  console.log("wrote", out, buffer.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
