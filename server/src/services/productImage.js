import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "../db/supabase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_IMAGES = path.resolve(
  __dirname,
  "../../../client/public/images"
);
const BUCKET = process.env.PRODUCT_IMAGE_BUCKET || "product-images";

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
  );
  if (!match) return null;
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function extFromType(contentType) {
  const map = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[contentType] || "jpg";
}

function normalizeFolder(folder) {
  return folder === "packs" ? "packs" : "products";
}

/** Upload product/pack image to Supabase Storage, or local public folder in dev. */
export async function storeProductImage({
  productId,
  imageBase64,
  imageUrl,
  folder = "products",
} = {}) {
  if (imageUrl && !imageBase64) {
    return String(imageUrl).trim() || null;
  }
  if (!imageBase64) return imageUrl ? String(imageUrl).trim() : null;

  const parsed = parseDataUrl(imageBase64);
  if (!parsed) {
    throw new Error("Invalid image data. Use a JPG/PNG/WebP file.");
  }
  if (parsed.buffer.length > 2.5 * 1024 * 1024) {
    throw new Error("Image must be under 2.5 MB.");
  }

  const subdir = normalizeFolder(folder);
  const ext = extFromType(parsed.contentType);
  const fileName = `${productId}.${ext}`;
  const storagePath = `${subdir}/${fileName}`;

  if (supabase) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, parsed.buffer, {
        contentType: parsed.contentType,
        upsert: true,
      });

    if (!error) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      if (data?.publicUrl) {
        return `${data.publicUrl}?v=${Date.now()}`;
      }
    } else {
      console.warn("[productImage] storage upload failed:", error.message);
    }
  }

  // Local / non-storage fallback (works in npm run dev)
  try {
    const localDir = path.join(PUBLIC_IMAGES, subdir);
    await fs.mkdir(localDir, { recursive: true });
    await fs.writeFile(path.join(localDir, fileName), parsed.buffer);
    return `/images/${subdir}/${fileName}?v=${Date.now()}`;
  } catch (err) {
    console.error("[productImage] local write failed", err);
    throw new Error(
      "Could not store image. Paste an image URL, or create a Supabase Storage bucket named product-images (public)."
    );
  }
}
