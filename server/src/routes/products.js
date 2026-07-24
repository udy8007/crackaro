import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  MEDIA_CLASSES,
  PRODUCT_CATEGORIES,
  PRODUCT_ICONS,
  TAG_CLASSES,
  slugifyProductId,
} from "../constants/catalogMeta.js";
import { storeProductImage } from "../services/productImage.js";
import {
  formatMoney,
  lineProfit,
  normalizeSettings,
  sellFromCost,
  toMoney,
} from "../services/pricing.js";
import { ensureSettings } from "../services/shopSettings.js";
import { notifyNtfy } from "../services/ntfy.js";

const router = Router();

function mapProductPublic(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    price: formatMoney(row.price),
    priceValue: Number(row.price),
    unit: row.unit,
    stock: Number(row.stock) || 0,
    active: Boolean(row.active),
    icon: row.icon,
    mediaClass: row.media_class,
    imageUrl: row.image_url || null,
    tag: row.tag,
    tagClass: row.tag_class,
  };
}

function normalizePackItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => {
    if (item && typeof item === "object") {
      return {
        name: String(item.name || "").trim(),
        contains: String(item.contains || item.qty || "").trim(),
      };
    }
    const text = String(item || "").trim();
    const split = text.split(/\s*[—–-]\s*/);
    if (split.length >= 2) {
      return {
        name: split.slice(0, -1).join(" - ").trim(),
        contains: split[split.length - 1].trim(),
      };
    }
    return { name: text || `Item ${index + 1}`, contains: "" };
  });
}

function mapPackPublic(row) {
  const items = normalizePackItems(row.items);
  const mrp = row.mrp != null ? Number(row.mrp) : null;
  return {
    id: row.id,
    name: row.name,
    price: formatMoney(row.price),
    priceValue: Number(row.price),
    mrp: mrp != null && Number.isFinite(mrp) ? mrp : null,
    mrpLabel: mrp != null && Number.isFinite(mrp) ? formatMoney(mrp) : null,
    unit: row.unit || "/ pack",
    stock: Number(row.stock) || 0,
    active: Boolean(row.active),
    className: row.class_name,
    featured: Boolean(row.featured),
    buttonClass: row.button_class,
    interest: row.interest,
    imageUrl: row.image_url || null,
    itemCount: items.length || Number(row.item_count) || 0,
    tag: row.tag || null,
    tagClass: row.tag_class || "tag-gold",
    items,
  };
}

function mapProductAdmin(row, commissionRate) {
  const cost = toMoney(row.cost_price ?? row.price);
  const sell = toMoney(row.price);
  const suggested = sellFromCost(cost, commissionRate);
  return {
    ...mapProductPublic(row),
    type: "product",
    costPrice: cost,
    sellPrice: sell,
    suggestedSellPrice: suggested,
    unitProfit: lineProfit(sell, cost, 1),
  };
}

function mapPackAdmin(row, commissionRate) {
  const cost = toMoney(row.cost_price ?? row.price);
  const sell = toMoney(row.price);
  const suggested = sellFromCost(cost, commissionRate);
  return {
    ...mapPackPublic(row),
    type: "pack",
    costPrice: cost,
    sellPrice: sell,
    suggestedSellPrice: suggested,
    unitProfit: lineProfit(sell, cost, 1),
  };
}

function categoryDefaults(categoryId) {
  return (
    PRODUCT_CATEGORIES.find((c) => c.id === categoryId) || {
      icon: "fa-bag-shopping",
      mediaClass: "c-orange",
    }
  );
}

router.get("/", async (_req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }

    const [productsRes, packsRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("id", { ascending: true }),
      supabase
        .from("packs")
        .select("*")
        .eq("active", true)
        .order("price", { ascending: true }),
    ]);

    if (productsRes.error) {
      console.error("[products]", productsRes.error);
      return res.status(500).json({ message: "Could not fetch products." });
    }
    if (packsRes.error) {
      console.error("[products]", packsRes.error);
      return res.status(500).json({ message: "Could not fetch packs." });
    }

    return res.json({
      products: (productsRes.data || []).map(mapProductPublic),
      packs: (packsRes.data || []).map(mapPackPublic),
    });
  } catch (error) {
    console.error("[products]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/meta", adminAuth, (_req, res) => {
  return res.json({
    categories: PRODUCT_CATEGORIES,
    mediaClasses: MEDIA_CLASSES,
    tagClasses: TAG_CLASSES,
    icons: PRODUCT_ICONS,
  });
});

router.get("/admin/catalog", adminAuth, async (_req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }

    const settingsRow = await ensureSettings();
    const { commissionRate } = normalizeSettings(settingsRow);

    const [productsRes, packsRes] = await Promise.all([
      supabase.from("products").select("*").order("id", { ascending: true }),
      supabase.from("packs").select("*").order("price", { ascending: true }),
    ]);

    if (productsRes.error || packsRes.error) {
      console.error("[products]", productsRes.error || packsRes.error);
      return res.status(500).json({ message: "Could not fetch catalog." });
    }

    return res.json({
      commissionRate,
      categories: PRODUCT_CATEGORIES,
      mediaClasses: MEDIA_CLASSES,
      tagClasses: TAG_CLASSES,
      icons: PRODUCT_ICONS,
      products: (productsRes.data || []).map((row) =>
        mapProductAdmin(row, commissionRate)
      ),
      packs: (packsRes.data || []).map((row) =>
        mapPackAdmin(row, commissionRate)
      ),
    });
  } catch (error) {
    console.error("[products]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", adminAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }

    const name = String(req.body?.name || "").trim();
    const category = String(req.body?.category || "").trim();
    const description = String(req.body?.description || "").trim();
    const unit = String(req.body?.unit || "").trim() || "/ 1 box";
    const costPrice = Number(req.body?.costPrice);
    let sellPrice = Number(req.body?.sellPrice);
    const stock = Math.max(0, Math.floor(Number(req.body?.stock) || 0));
    const active = req.body?.active !== false;
    const tag = String(req.body?.tag || "").trim() || null;
    const tagClass = String(req.body?.tagClass || "tag-gold").trim();
    const defaults = categoryDefaults(category);
    const icon = String(req.body?.icon || defaults.icon).trim();
    const mediaClass = String(req.body?.mediaClass || defaults.mediaClass).trim();

    if (!name) {
      return res.status(400).json({ message: "Product name is required." });
    }
    if (!PRODUCT_CATEGORIES.some((c) => c.id === category)) {
      return res.status(400).json({ message: "Select a valid category." });
    }
    if (!Number.isFinite(costPrice) || costPrice < 0) {
      return res.status(400).json({ message: "costPrice must be a non-negative number." });
    }

    if (!Number.isFinite(sellPrice) || sellPrice < 0) {
      const settingsRow = await ensureSettings();
      const { commissionRate } = normalizeSettings(settingsRow);
      sellPrice = sellFromCost(costPrice, commissionRate);
    }

    let id = String(req.body?.id || "").trim() || slugifyProductId(name);
    id = slugifyProductId(id);
    if (!id) {
      return res.status(400).json({ message: "Could not build a product id from the name." });
    }

    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (existing) {
      id = `${id}-${Date.now().toString(36).slice(-4)}`;
    }

    let imageUrl = String(req.body?.imageUrl || "").trim() || null;
    try {
      imageUrl = await storeProductImage({
        productId: id,
        imageBase64: req.body?.imageBase64,
        imageUrl,
      });
    } catch (imgErr) {
      return res.status(400).json({ message: imgErr.message || "Image upload failed." });
    }

    const row = {
      id,
      category,
      name,
      description,
      price: sellPrice,
      cost_price: costPrice,
      unit,
      stock,
      active,
      icon,
      media_class: mediaClass,
      tag,
      tag_class: tag ? tagClass : null,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("products")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      console.error("[products] create", error);
      return res.status(500).json({ message: "Could not create product." });
    }

    const settingsRow = await ensureSettings();
    const { commissionRate } = normalizeSettings(settingsRow);

    notifyNtfy({
      title: "Product added",
      message: `${data.name || data.id} created in catalog`,
      tags: ["package"],
    });

    return res.status(201).json({
      message: "Product created",
      item: mapProductAdmin(data, commissionRate),
    });
  } catch (error) {
    console.error("[products]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }

    const id = String(req.params.id);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("[products]", error);
      return res.status(500).json({ message: "Could not fetch product." });
    }
    if (!data) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.json({ product: mapProductPublic(data) });
  } catch (error) {
    console.error("[products]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id", adminAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }

    const id = String(req.params.id);
    const type = req.body?.type === "pack" ? "pack" : "product";
    const table = type === "pack" ? "packs" : "products";
    const patch = { updated_at: new Date().toISOString() };

    if (req.body?.stock !== undefined) {
      const stock = Number(req.body.stock);
      if (!Number.isFinite(stock) || stock < 0) {
        return res.status(400).json({ message: "stock must be a non-negative number." });
      }
      patch.stock = Math.floor(stock);
    }
    if (req.body?.price !== undefined || req.body?.sellPrice !== undefined) {
      const price = Number(
        req.body.sellPrice !== undefined ? req.body.sellPrice : req.body.price
      );
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: "sell price must be a non-negative number." });
      }
      patch.price = price;
    }
    if (req.body?.costPrice !== undefined) {
      const cost = Number(req.body.costPrice);
      if (!Number.isFinite(cost) || cost < 0) {
        return res.status(400).json({ message: "costPrice must be a non-negative number." });
      }
      patch.cost_price = cost;
    }
    if (req.body?.active !== undefined) {
      patch.active = Boolean(req.body.active);
    }

    if (type === "product") {
      if (req.body?.name !== undefined) {
        const name = String(req.body.name).trim();
        if (!name) return res.status(400).json({ message: "name cannot be empty." });
        patch.name = name;
      }
      if (req.body?.description !== undefined) {
        patch.description = String(req.body.description || "").trim();
      }
      if (req.body?.unit !== undefined) {
        patch.unit = String(req.body.unit || "").trim();
      }
      if (req.body?.category !== undefined) {
        const category = String(req.body.category).trim();
        if (!PRODUCT_CATEGORIES.some((c) => c.id === category)) {
          return res.status(400).json({ message: "Invalid category." });
        }
        patch.category = category;
      }
      if (req.body?.icon !== undefined) {
        patch.icon = String(req.body.icon || "fa-bag-shopping").trim();
      }
      if (req.body?.mediaClass !== undefined) {
        patch.media_class = String(req.body.mediaClass || "c-orange").trim();
      }
      if (req.body?.tag !== undefined) {
        const tag = String(req.body.tag || "").trim();
        patch.tag = tag || null;
      }
      if (req.body?.tagClass !== undefined) {
        patch.tag_class = String(req.body.tagClass || "tag-gold").trim();
      }
    }

    if (req.body?.imageUrl !== undefined || req.body?.imageBase64) {
      try {
        patch.image_url = await storeProductImage({
          productId: id,
          imageBase64: req.body?.imageBase64,
          imageUrl: req.body?.imageUrl,
          folder: type === "pack" ? "packs" : "products",
        });
      } catch (imgErr) {
        return res
          .status(400)
          .json({ message: imgErr.message || "Image upload failed." });
      }
    }

    if (req.body?.applyCommission === true) {
      const settingsRow = await ensureSettings();
      const { commissionRate } = normalizeSettings(settingsRow);
      const { data: current, error: curErr } = await supabase
        .from(table)
        .select("cost_price, price")
        .eq("id", id)
        .maybeSingle();
      if (curErr || !current) {
        return res.status(404).json({ message: "Item not found." });
      }
      const cost =
        patch.cost_price !== undefined
          ? patch.cost_price
          : toMoney(current.cost_price ?? current.price);
      patch.cost_price = cost;
      patch.price = sellFromCost(cost, commissionRate);
    }

    if (Object.keys(patch).length === 1) {
      return res.status(400).json({
        message: "Provide fields to update.",
      });
    }

    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[products]", error);
      return res.status(500).json({ message: "Could not update catalog item." });
    }
    if (!data) {
      return res.status(404).json({ message: "Item not found." });
    }

    const settingsRow = await ensureSettings();
    const { commissionRate } = normalizeSettings(settingsRow);

    notifyNtfy({
      title: type === "pack" ? "Pack updated" : "Product updated",
      message: `${data.name || data.id} updated`,
      tags: ["pencil"],
    });

    return res.json({
      message: "Updated",
      item:
        type === "pack"
          ? mapPackAdmin(data, commissionRate)
          : mapProductAdmin(data, commissionRate),
    });
  } catch (error) {
    console.error("[products]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
