/**
 * Download product photos from srkcrackers.in and fit them to Crackaro card
 * canvases (landscape 4:3 with warm festival pad + centered product).
 *
 * Usage:
 *   node scripts/prepare-product-images.mjs [backup.json]
 */
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const outDir = path.join(root, "client/public/images/products");
const backupPath =
  process.argv[2] ||
  "c:/Users/mohankumar.r.DC/Downloads/srkcrackers-db-20260722-1200-ist.json/srkcrackers-db-20260722-1200-ist.json";

const SITE = "https://www.srkcrackers.in";
const CARD_W = 800;
const CARD_H = 600;

fs.mkdirSync(outDir, { recursive: true });

const db = JSON.parse(fs.readFileSync(backupPath, "utf8"));
const products = db.data.products.filter((p) => p.active !== false);

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      {
        timeout: 30000,
        headers: {
          "User-Agent": "CrackaroImageSync/1.0",
          Accept: "image/*,*/*",
        },
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const next = new URL(res.headers.location, url).href;
          res.resume();
          fetchBuffer(next).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout ${url}`));
    });
  });
}

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || "").match(/^data:image\/\w+;base64,(.+)$/s);
  if (!match) return null;
  return Buffer.from(match[1], "base64");
}

function candidateUrls(product) {
  const urls = [];
  const imageUrl = String(product.imageUrl || "");
  if (imageUrl.startsWith("/")) urls.push(`${SITE}${imageUrl}`);
  if (product.slug) {
    urls.push(`${SITE}/products/photos/${product.slug}.png`);
    urls.push(`${SITE}/products/photos/${product.slug}.jpg`);
    urls.push(`${SITE}/products/photos/${product.slug}.jpeg`);
  }
  // backup path filename may differ from slug (e.g. 120shots → 12-shots.png)
  if (imageUrl.startsWith("/products/photos/")) {
    const base = path.basename(imageUrl, path.extname(imageUrl));
    if (base && base !== product.slug) {
      urls.push(`${SITE}/products/photos/${base}.png`);
      urls.push(`${SITE}/products/photos/${base}.jpg`);
    }
  }
  return [...new Set(urls)];
}

async function loadSourceBuffer(product) {
  for (const url of candidateUrls(product)) {
    try {
      const buf = await fetchBuffer(url);
      if (buf?.length > 1000) return { buf, source: url };
    } catch {
      /* try next */
    }
  }
  const embedded = dataUrlToBuffer(product.imageUrl);
  if (embedded?.length > 1000) return { buf: embedded, source: "backup-base64" };

  const localJpg = path.join(outDir, `${product.slug}.jpg`);
  if (fs.existsSync(localJpg)) {
    return { buf: fs.readFileSync(localJpg), source: "local-jpg" };
  }
  return null;
}

/** Soft studio card backdrop — fills the frame while product stays fully visible. */
async function makeBackdrop() {
  const svg = `
  <svg width="${CARD_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fffaf5"/>
        <stop offset="55%" stop-color="#fff1e6"/>
        <stop offset="100%" stop-color="#ffe0d2"/>
      </linearGradient>
      <radialGradient id="spot" cx="50%" cy="42%" r="58%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" fill="url(#spot)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Strip light studio margins when possible (white / near-white / pale grey). */
async function trimProduct(sourceBuf) {
  const rotated = await sharp(sourceBuf).rotate().toBuffer();
  const attempts = ["#ffffff", "#f5f5f5", "#eeeeee", "#e8e8e8", "#fff7ed"];
  let best = rotated;
  let bestArea = Number.POSITIVE_INFINITY;

  for (const background of attempts) {
    try {
      const { data, info } = await sharp(rotated)
        .trim({ background, threshold: 36 })
        .toBuffer({ resolveWithObject: true });
      const area = info.width * info.height;
      if (area > 20_000 && area < bestArea) {
        best = data;
        bestArea = area;
      }
    } catch {
      /* try next */
    }
  }
  return best;
}

/**
 * Professional card frame: FULL product visible (no cover-crop),
 * centered on a warm studio background that fills the media area.
 */
async function fitToCard(sourceBuf) {
  const trimmed = await trimProduct(sourceBuf);
  const pad = 0.08; // keep artwork clear of edges
  const maxW = Math.round(CARD_W * (1 - pad * 2));
  const maxH = Math.round(CARD_H * (1 - pad * 2));

  const product = await sharp(trimmed)
    .resize(maxW, maxH, {
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  const left = Math.round((CARD_W - product.info.width) / 2);
  const top = Math.round((CARD_H - product.info.height) / 2);

  const shadow = Buffer.from(`
    <svg width="${CARD_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${CARD_W / 2}" cy="${Math.min(CARD_H - 28, top + product.info.height + 2)}"
        rx="${Math.max(40, Math.round(product.info.width * 0.38))}" ry="16"
        fill="#9a3412" fill-opacity="0.12"/>
    </svg>`);

  return sharp(await makeBackdrop())
    .composite([
      { input: await sharp(shadow).png().toBuffer(), top: 0, left: 0 },
      { input: product.data, top, left },
    ])
    .sharpen({ sigma: 0.45 })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

const results = { ok: 0, fail: [], sources: {} };

for (const product of products) {
  const id = product.slug || product.id;
  process.stdout.write(`• ${id} … `);
  try {
    const loaded = await loadSourceBuffer(product);
    if (!loaded) {
      console.log("MISSING");
      results.fail.push(id);
      continue;
    }
    const fitted = await fitToCard(loaded.buf);
    const outPath = path.join(outDir, `${id}.jpg`);
    fs.writeFileSync(outPath, fitted);
    results.ok += 1;
    results.sources[loaded.source] = (results.sources[loaded.source] || 0) + 1;
    console.log(`ok (${loaded.source})`);
  } catch (err) {
    console.log(`FAIL ${err.message}`);
    results.fail.push(id);
  }
}

console.log(
  JSON.stringify(
    {
      wrote: results.ok,
      failed: results.fail,
      sources: results.sources,
      outDir: path.relative(root, outDir),
      canvas: `${CARD_W}x${CARD_H}`,
    },
    null,
    2
  )
);

if (results.fail.length) process.exitCode = 1;
