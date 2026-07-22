import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

const backupPath =
  process.argv[2] ||
  "c:/Users/mohankumar.r.DC/Downloads/srkcrackers-db-20260722-1200-ist.json/srkcrackers-db-20260722-1200-ist.json";

const META = {
  sparklers: {
    icon: "fa-wand-magic-sparkles",
    mediaClass: "c-gold",
    tagClass: "tag-gold",
    title: "Sparklers",
    short: "Sparklers",
    desc: "Kids & family handheld sparklers",
  },
  ground: {
    icon: "fa-circle-dot",
    mediaClass: "c-pink",
    tagClass: "tag-pink",
    title: "Ground Fancy",
    short: "Ground",
    desc: "Chakkars, swirls & ground shots",
  },
  fancy: {
    icon: "fa-cloud-moon",
    mediaClass: "c-teal",
    tagClass: "tag-teal",
    title: "Fancy Sky Shots",
    short: "Sky Shots",
    desc: "Aerial fancy & multi-shot cakes",
  },
  rockets: {
    icon: "fa-rocket",
    mediaClass: "c-blue",
    tagClass: "tag-blue",
    title: "Rockets",
    short: "Rockets",
    desc: "Whistling & sky rockets",
  },
  fountain: {
    icon: "fa-seedling",
    mediaClass: "c-green",
    tagClass: "tag-green",
    title: "Flower Pots & Fountains",
    short: "Fountains",
    desc: "Color fountains & peacock pots",
  },
  bombs: {
    icon: "fa-bomb",
    mediaClass: "c-red",
    tagClass: "tag-red",
    title: "Bombs",
    short: "Bombs",
    desc: "Paper bombs & sound specials",
  },
  lakshmi: {
    icon: "fa-bolt",
    mediaClass: "c-orange",
    tagClass: "tag-orange",
    title: "Sound Crackers",
    short: "Sound",
    desc: "Lakshmi, bijili & two-sound",
  },
  kids: {
    icon: "fa-children",
    mediaClass: "c-purple",
    tagClass: "tag-purple",
    title: "Kids Special",
    short: "Kids",
    desc: "Low-noise fun for children",
  },
  wala: {
    icon: "fa-link",
    mediaClass: "c-orange",
    tagClass: "tag-orange",
    title: "Garland (Wala)",
    short: "Wala",
    desc: "Garland crackers from 28 to 10000",
  },
};

const db = JSON.parse(fs.readFileSync(backupPath, "utf8"));
const cats = [...db.data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
const catById = Object.fromEntries(cats.map((c) => [c.id, c]));

function escSql(s) {
  return String(s ?? "").replace(/'/g, "''");
}

function formatInr(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function unitFromPack(pack) {
  if (!pack) return "/ piece";
  return `/ ${pack}`;
}

function discountTag(price, mrp) {
  if (!mrp || mrp <= price) return null;
  return `${Math.round(((mrp - price) / mrp) * 100)}% Off`;
}

const imagesDir = path.join(root, "client/public/images/products");
fs.mkdirSync(imagesDir, { recursive: true });

function writeProductImage(slug, dataUrl) {
  // Prefer card-fitted JPEGs from prepare-product-images.mjs
  const fittedJpg = path.join(imagesDir, `${slug}.jpg`);
  if (fs.existsSync(fittedJpg)) {
    return `/images/products/${slug}.jpg`;
  }

  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/s);
  if (!match) return null;
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const filename = `${slug}.${ext}`;
  fs.writeFileSync(path.join(imagesDir, filename), Buffer.from(match[2], "base64"));
  return `/images/products/${filename}`;
}

const products = [...db.data.products]
  .filter((p) => p.active !== false)
  .map((p) => {
    const cat = catById[p.categoryId];
    if (!cat) throw new Error(`Missing category for ${p.name}`);
    const meta = META[cat.key];
    if (!meta) throw new Error(`Missing meta for ${cat.key}`);
    const tag = discountTag(p.price, p.mrp);
    const id = p.slug || p.id;
    const imageUrl = writeProductImage(id, p.imageUrl);
    return {
      id,
      category: cat.key,
      name: p.name,
      description: p.description || "",
      price: Number(p.price),
      mrp: Number(p.mrp),
      unit: unitFromPack(p.pack),
      sortOrder: Number(p.sortOrder) || 0,
      icon: meta.icon,
      mediaClass: meta.mediaClass,
      imageUrl,
      tag,
      tagClass: tag ? meta.tagClass : null,
      stock: 100,
    };
  })
  .sort((a, b) => {
    const ao = cats.find((c) => c.key === a.category)?.sortOrder ?? 99;
    const bo = cats.find((c) => c.key === b.category)?.sortOrder ?? 99;
    if (ao !== bo) return ao - bo;
    return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  });

const filters = [
  { id: "all", label: "All" },
  ...cats.map((c) => ({ id: c.key, label: META[c.key].short })),
];

const categoriesExport = cats.map((c) => ({
  filter: c.key,
  className: META[c.key].mediaClass,
  icon: META[c.key].icon,
  title: META[c.key].title,
  description: META[c.key].desc,
}));

const productsJs = products.map((p) => {
  const lines = [
    "  {",
    `    id: ${JSON.stringify(p.id)},`,
    `    category: ${JSON.stringify(p.category)},`,
    `    mediaClass: ${JSON.stringify(p.mediaClass)},`,
    `    icon: ${JSON.stringify(p.icon)},`,
  ];
  if (p.imageUrl) {
    lines.push(`    imageUrl: ${JSON.stringify(p.imageUrl)},`);
  }
  if (p.tag) {
    lines.push(`    tag: ${JSON.stringify(p.tag)},`);
    lines.push(`    tagClass: ${JSON.stringify(p.tagClass)},`);
  }
  lines.push(`    name: ${JSON.stringify(p.name)},`);
  lines.push(`    description: ${JSON.stringify(p.description)},`);
  lines.push(`    price: ${JSON.stringify(formatInr(p.price))},`);
  lines.push(`    unit: ${JSON.stringify(p.unit)},`);
  lines.push("  }");
  return lines.join("\n");
});

const packsBlock = `export const PACKS = [
  {
    id: "family",
    name: "Family Delight",
    price: "₹1,999",
    className: "pack-orange",
    featured: false,
    buttonClass: "btn-outline",
    interest: "family",
    items: [
      "Sparklers & chakras",
      "Flower pots (assorted)",
      "Kids combo items",
      "Gift packaging included",
    ],
  },
  {
    id: "diwali",
    name: "Grand Diwali",
    price: "₹4,999",
    className: "pack-magenta featured",
    featured: true,
    buttonClass: "btn-primary",
    interest: "diwali",
    items: [
      "Premium aerial shots",
      "Rockets & fountains",
      "Sound crackers mix",
      "Free delivery above ₹3,000",
    ],
  },
  {
    id: "wedding",
    name: "Wedding Special",
    price: "₹9,999",
    className: "pack-violet",
    featured: false,
    buttonClass: "btn-outline",
    interest: "wedding",
    items: [
      "Multi-shot cakes",
      "Stage entry fountains",
      "Custom quantity support",
      "Event coordination help",
    ],
  },
];
`;

const productsFile = `export const PRODUCT_FILTERS = ${JSON.stringify(filters, null, 2)};

export const PRODUCTS = [
${productsJs.join(",\n")}
];

export const CATEGORIES = ${JSON.stringify(categoriesExport, null, 2)};

${packsBlock}`;

fs.writeFileSync(path.join(root, "client/src/data/products.js"), productsFile);

const sqlPath = path.join(root, "server/sql/catalog.sql");
const sql = fs.readFileSync(sqlPath, "utf8");
const values = products
  .map((p) => {
    const tag = p.tag ? `'${escSql(p.tag)}'` : "null";
    const tagClass = p.tagClass ? `'${escSql(p.tagClass)}'` : "null";
    const imageUrl = p.imageUrl ? `'${escSql(p.imageUrl)}'` : "null";
    return `  ('${escSql(p.id)}', '${escSql(p.category)}', '${escSql(p.name)}',\n   '${escSql(p.description)}',\n   ${p.price}, '${escSql(p.unit)}', ${p.stock}, true, '${escSql(p.icon)}', '${escSql(p.mediaClass)}', ${tag}, ${tagClass}, ${imageUrl})`;
  })
  .join(",\n");

const insertBlock = `-- Seed catalog (idempotent) — synced from SRK Crackers backup 2026-07-22
alter table public.products add column if not exists image_url text;

insert into public.products (
  id, category, name, description, price, unit, stock, active,
  icon, media_class, tag, tag_class, image_url
) values
${values}
on conflict (id) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  unit = excluded.unit,
  icon = excluded.icon,
  media_class = excluded.media_class,
  tag = excluded.tag,
  tag_class = excluded.tag_class,
  image_url = excluded.image_url,
  active = true,
  updated_at = now();

-- Hide legacy sample SKUs not in the synced catalog
update public.products
set active = false, updated_at = now()
where id not in (${products.map((p) => `'${escSql(p.id)}'`).join(", ")});`;

const start = sql.indexOf("-- Seed catalog");
const end = sql.indexOf("\ninsert into public.packs");
if (start < 0 || end < 0) {
  throw new Error("Could not locate seed blocks in catalog.sql");
}
const newSql = sql.slice(0, start) + insertBlock + "\n\n" + sql.slice(end + 1);
fs.writeFileSync(sqlPath, newSql);

console.log(
  JSON.stringify(
    {
      categories: cats.length,
      products: products.length,
      byCat: Object.fromEntries(
        cats.map((c) => [
          c.key,
          products.filter((p) => p.category === c.key).length,
        ])
      ),
      images: products.filter((p) => p.imageUrl).length,
      wrote: [
        "client/public/images/products/",
        "client/src/data/products.js",
        "server/sql/catalog.sql",
      ],
    },
    null,
    2
  )
);
