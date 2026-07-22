import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  formatMoney,
  lineProfit,
  normalizeSettings,
  sellFromCost,
  toMoney,
} from "../services/pricing.js";
import { ensureSettings } from "../services/shopSettings.js";

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

function mapPackPublic(row) {
  return {
    id: row.id,
    name: row.name,
    price: formatMoney(row.price),
    priceValue: Number(row.price),
    unit: row.unit || "/ pack",
    stock: Number(row.stock) || 0,
    active: Boolean(row.active),
    className: row.class_name,
    featured: Boolean(row.featured),
    buttonClass: row.button_class,
    interest: row.interest,
    items: Array.isArray(row.items) ? row.items : [],
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

    // Optional: set sell from cost using current global rate
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
        message: "Provide stock, costPrice, sellPrice/price, active, and/or applyCommission.",
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
