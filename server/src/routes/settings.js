import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { sellFromCost } from "../services/pricing.js";
import {
  ensureSettings,
  normalizeSettings,
} from "../services/shopSettings.js";

const router = Router();

/** Public: customer-facing checkout rules only (no commission internals). */
router.get("/", async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({
        minOrderAmount: 3000,
      });
    }
    const row = await ensureSettings();
    const settings = normalizeSettings(row);
    return res.json({
      // Always the effective floor (covers SRK min + commission)
      minOrderAmount: settings.effectiveMinOrderAmount,
    });
  } catch (error) {
    console.error("[settings]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin", adminAuth, async (_req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }
    const row = await ensureSettings();
    return res.json({ settings: normalizeSettings(row) });
  } catch (error) {
    console.error("[settings]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/", adminAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }

    await ensureSettings();
    const patch = { updated_at: new Date().toISOString() };

    if (req.body?.commissionRate !== undefined) {
      const rate = Number(req.body.commissionRate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 2) {
        return res.status(400).json({
          message: "commissionRate must be between 0 and 2 (e.g. 0.2 = 20%).",
        });
      }
      patch.commission_rate = rate;
    }

    if (req.body?.minOrderAmount !== undefined) {
      const min = Number(req.body.minOrderAmount);
      if (!Number.isFinite(min) || min < 0) {
        return res.status(400).json({
          message: "minOrderAmount must be a non-negative number.",
        });
      }
      patch.min_order_amount = min;
    }

    if (req.body?.supplierMinOrder !== undefined) {
      const min = Number(req.body.supplierMinOrder);
      if (!Number.isFinite(min) || min < 0) {
        return res.status(400).json({
          message: "supplierMinOrder must be a non-negative number.",
        });
      }
      patch.supplier_min_order = min;
    }

    if (Object.keys(patch).length === 1) {
      return res.status(400).json({
        message: "Provide commissionRate, minOrderAmount, and/or supplierMinOrder.",
      });
    }

    const { data, error } = await supabase
      .from("shop_settings")
      .update(patch)
      .eq("id", 1)
      .select("*")
      .single();

    if (error) {
      console.error("[settings]", error);
      return res.status(500).json({ message: "Could not update settings." });
    }

    return res.json({
      message: "Settings updated",
      settings: normalizeSettings(data),
    });
  } catch (error) {
    console.error("[settings]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/** Recalculate sell price = ceil(cost × (1 + commission)) for all catalog rows. */
router.post("/apply-commission", adminAuth, async (_req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }

    const row = await ensureSettings();
    const { commissionRate } = normalizeSettings(row);

    const [productsRes, packsRes] = await Promise.all([
      supabase.from("products").select("id, cost_price, price"),
      supabase.from("packs").select("id, cost_price, price"),
    ]);

    if (productsRes.error || packsRes.error) {
      console.error("[settings] apply", productsRes.error || packsRes.error);
      return res.status(500).json({ message: "Could not load catalog." });
    }

    let updatedProducts = 0;
    let updatedPacks = 0;
    const now = new Date().toISOString();

    for (const product of productsRes.data || []) {
      const cost = Number(product.cost_price ?? product.price) || 0;
      const sell = sellFromCost(cost, commissionRate);
      const { error } = await supabase
        .from("products")
        .update({
          cost_price: cost,
          price: sell,
          updated_at: now,
        })
        .eq("id", product.id);
      if (!error) updatedProducts += 1;
    }

    for (const pack of packsRes.data || []) {
      const cost = Number(pack.cost_price ?? pack.price) || 0;
      const sell = sellFromCost(cost, commissionRate);
      const { error } = await supabase
        .from("packs")
        .update({
          cost_price: cost,
          price: sell,
          updated_at: now,
        })
        .eq("id", pack.id);
      if (!error) updatedPacks += 1;
    }

    return res.json({
      message: `Applied ${(commissionRate * 100).toFixed(1)}% commission to catalog.`,
      commissionRate,
      updatedProducts,
      updatedPacks,
    });
  } catch (error) {
    console.error("[settings]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
