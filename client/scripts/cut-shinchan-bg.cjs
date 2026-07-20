const path = require("path");
const { Jimp } = require("jimp");

/**
 * Flood-fill cream/white/magenta → true alpha, then hard-clear leftover
 * pale fringe and crop tight to the cast (no empty square “card”).
 */
function isBgPixel(r, g, b) {
  const maxc = Math.max(r, g, b);
  const minc = Math.min(r, g, b);
  const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
  if (r > 200 && g < 60 && b > 200) return true;
  if (maxc > 200 && sat < 0.16) return true;
  if (r > 230 && g > 215 && b > 190 && sat < 0.24) return true;
  if (r > 245 && g > 235 && b > 220) return true;
  return false;
}

function knockOutBg(img) {
  const { data, width, height } = img.bitmap;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const idx = (x, y) => (y * width + x) * 4;

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    const i = p * 4;
    if (!isBgPixel(data[i], data[i + 1], data[i + 2])) return;
    visited[p] = 1;
    queue.push(p);
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  while (queue.length) {
    const p = queue.pop();
    const x = p % width;
    const y = (p / width) | 0;
    data[p * 4 + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Kill soft pale fringe + any leftover cream islands near transparent
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = idx(x, y);
      if (data[i + 3] === 0) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (isBgPixel(r, g, b)) {
        data[i + 3] = 0;
        continue;
      }
      let near = 0;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
          near += 1;
          continue;
        }
        if (data[idx(nx, ny) + 3] === 0) near += 1;
      }
      if (near >= 3) {
        const maxc = Math.max(r, g, b);
        const minc = Math.min(r, g, b);
        const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
        if (sat < 0.28 && maxc > 185) data[i + 3] = 0;
        else if (near >= 5) data[i + 3] = Math.min(data[i + 3], 160);
      }
    }
  }

  return img;
}

function cropToContent(img, pad = 8) {
  const { data, width, height } = img.bitmap;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < 12) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX) return img;

  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  return img.crop({
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  });
}

async function main() {
  const dir = path.join(__dirname, "..", "public", "images");
  const frames = [
    "shinchan-frame-1.png",
    "shinchan-frame-2.png",
    "shinchan-frame-3.png",
    "shinchan-frame-4.png",
  ];

  for (let n = 0; n < frames.length; n += 1) {
    let img = await Jimp.read(path.join(dir, frames[n]));
    img.resize({ w: 560, h: 560 });
    knockOutBg(img);
    img = cropToContent(img, 10);
    // Normalize height so flipbook doesn’t jump size
    const targetH = 480;
    const scale = targetH / img.bitmap.height;
    img.resize({
      w: Math.round(img.bitmap.width * scale),
      h: targetH,
    });
    const out = path.join(dir, `shinchan-cut-${n + 1}.png`);
    await img.write(out);
    console.log(
      "wrote",
      out,
      `${img.bitmap.width}x${img.bitmap.height}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
