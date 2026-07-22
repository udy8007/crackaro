import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = Router();

function formatMoney(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function mapProduct(row) {
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

function mapPack(row) {
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
      products: (productsRes.data || []).map(mapProduct),
      packs: (packsRes.data || []).map(mapPack),
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

    return res.json({ product: mapProduct(data) });
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
    if (req.body?.price !== undefined) {
      const price = Number(req.body.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: "price must be a non-negative number." });
      }
      patch.price = price;
    }
    if (req.body?.active !== undefined) {
      patch.active = Boolean(req.body.active);
    }

    if (Object.keys(patch).length === 1) {
      return res.status(400).json({ message: "Provide stock, price, and/or active." });
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

    return res.json({
      message: "Updated",
      item: type === "pack" ? mapPack(data) : mapProduct(data),
    });
  } catch (error) {
    console.error("[products]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
