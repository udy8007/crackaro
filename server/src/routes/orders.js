import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { quoteShipping } from "../services/shipping.js";

const router = Router();

const ADMIN_STATUSES = [
  "payment_submitted",
  "verified",
  "rejected",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

const UTR_PATTERN = /^[A-Z0-9]{8,22}$/;

function formatMoney(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function normalizeUtr(utr) {
  return String(utr || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function makeOrderNumber() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join("");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SCR-${stamp}-${rand}`;
}

async function resolveTrustedItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "Cart items are required." };
  }

  const lines = [];
  for (const raw of rawItems) {
    const type = raw?.type === "pack" ? "pack" : "product";
    const id = String(raw?.id ?? "").trim();
    const qty = Math.max(1, Math.floor(Number(raw?.qty) || 1));
    if (!id) {
      return { error: "Each cart item must include an id." };
    }

    const table = type === "pack" ? "packs" : "products";
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[orders] catalog lookup", error);
      return { error: "Could not validate cart items." };
    }
    if (!data || !data.active) {
      return { error: `Item "${id}" is unavailable.` };
    }
    if (Number(data.stock) < qty) {
      return {
        error: `"${data.name}" has only ${data.stock} in stock (requested ${qty}).`,
      };
    }

    const priceValue = Number(data.price) || 0;
    lines.push({
      cartId: `${type}-${id}`,
      id,
      type,
      name: data.name,
      price: formatMoney(priceValue),
      priceValue,
      unit: data.unit || (type === "pack" ? "/ pack" : ""),
      qty,
      icon: type === "product" ? data.icon : "fa-gift",
      mediaClass: type === "product" ? data.media_class : "c-orange",
    });
  }

  return { lines };
}

async function restoreStock(lines) {
  for (const line of lines) {
    const table = line.type === "pack" ? "packs" : "products";
    const { data: row } = await supabase
      .from(table)
      .select("stock")
      .eq("id", line.id)
      .maybeSingle();
    if (!row) continue;
    await supabase
      .from(table)
      .update({
        stock: Number(row.stock) + line.qty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", line.id);
  }
}

async function decrementStock(lines) {
  const decremented = [];
  for (const line of lines) {
    const fn =
      line.type === "pack" ? "decrement_pack_stock" : "decrement_product_stock";
    const { data, error } = await supabase.rpc(fn, {
      p_id: line.id,
      p_qty: line.qty,
    });
    if (error || data !== true) {
      console.error("[orders] stock decrement", error || data);
      await restoreStock(decremented);
      return {
        ok: false,
        message: `Insufficient stock for "${line.name}". Please refresh the cart.`,
      };
    }
    decremented.push(line);
  }
  return { ok: true, decremented };
}

router.get("/payment-config", (_req, res) => {
  const upiId = process.env.UPI_ID || "crackaro@upi";
  const payeeName = process.env.UPI_NAME || "Crackaro";
  res.json({
    upiId,
    payeeName,
    note: "Pay the exact order total via UPI, then paste the UTR from your bank SMS / app.",
    utrHint: "8–22 characters, letters and numbers only (no spaces).",
    utrPattern: "^[A-Za-z0-9]{8,22}$",
  });
});

router.post("/", async (req, res) => {
  try {
    const {
      name,
      phone,
      email = "",
      address,
      city = "",
      state = "",
      pincode,
      utr,
      items,
    } = req.body || {};

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ message: "Name and mobile number are required." });
    }
    if (!address?.trim()) {
      return res.status(400).json({ message: "Address is required." });
    }
    if (!pincode?.trim() || !/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({ message: "Valid 6-digit pincode is required." });
    }

    const cleanUtr = normalizeUtr(utr);
    if (!UTR_PATTERN.test(cleanUtr)) {
      return res.status(400).json({
        message:
          "Valid UTR / UPI reference is required (8–22 alphanumeric characters).",
      });
    }

    if (!supabase) {
      return res.status(503).json({
        message:
          "Database is not configured. Add Supabase env vars in server/.env",
      });
    }

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: dupUtr, error: dupErr } = await supabase
      .from("orders")
      .select("id")
      .eq("utr", cleanUtr)
      .gte("created_at", since)
      .limit(1);

    if (dupErr) {
      console.error("[orders] utr check", dupErr);
      return res.status(500).json({ message: "Could not validate UTR." });
    }
    if (dupUtr?.length) {
      return res.status(409).json({
        message: "This UTR was already used recently. Contact support if this is a mistake.",
      });
    }

    const resolved = await resolveTrustedItems(items);
    if (resolved.error) {
      return res.status(400).json({ message: resolved.error });
    }
    const cartItems = resolved.lines;

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.priceValue * item.qty,
      0
    );

    const shipping = quoteShipping({
      pincode: pincode.trim(),
      subtotal,
      state,
    });
    if (!shipping.serviceable) {
      return res.status(400).json({ message: shipping.message });
    }

    const stockResult = await decrementStock(cartItems);
    if (!stockResult.ok) {
      return res.status(409).json({ message: stockResult.message });
    }

    const grandTotal = subtotal + shipping.fee;
    const row = {
      order_number: makeOrderNumber(),
      name: name.trim(),
      phone: normalizePhone(phone) || phone.trim(),
      email: email.trim() || null,
      address: address.trim(),
      city: city.trim() || null,
      state: state.trim() || null,
      pincode: pincode.trim(),
      items: cartItems,
      subtotal,
      shipping_fee: shipping.fee,
      shipping_zone: shipping.zone,
      total: grandTotal,
      utr: cleanUtr,
      payment_status: "submitted",
      status: "payment_submitted",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(row)
      .select(
        "id, order_number, total, subtotal, shipping_fee, status, payment_status, created_at, utr, phone"
      )
      .single();

    if (error) {
      console.error("[orders]", error);
      await restoreStock(stockResult.decremented || cartItems);
      return res.status(500).json({
        message: "Could not place order. Check Supabase table setup.",
      });
    }

    return res.status(201).json({
      message: "Order placed successfully. Waiting for admin payment verification.",
      order: data,
    });
  } catch (error) {
    console.error("[orders]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/track/:orderNumber", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }

    const phone = normalizePhone(req.query.phone);
    if (!phone || phone.length !== 10) {
      return res.status(400).json({
        message: "Phone number is required to track an order.",
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        "order_number, status, payment_status, total, subtotal, shipping_fee, created_at, city, pincode, phone, items, name"
      )
      .eq("order_number", req.params.orderNumber)
      .maybeSingle();

    if (error) {
      console.error("[orders]", error);
      return res.status(500).json({ message: "Could not track order." });
    }
    if (!data || normalizePhone(data.phone) !== phone) {
      return res.status(404).json({ message: "Order not found." });
    }

    const { phone: _phone, ...safe } = data;
    return res.json({ order: safe });
  } catch (error) {
    console.error("[orders]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", adminAuth, async (_req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[orders]", error);
      return res.status(500).json({ message: "Could not fetch orders." });
    }

    return res.json({ orders: data, statuses: ADMIN_STATUSES });
  } catch (error) {
    console.error("[orders]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ message: "Database is not configured." });
    }

    const { status, admin_note = "" } = req.body || {};
    if (!ADMIN_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Use one of: ${ADMIN_STATUSES.join(", ")}`,
      });
    }

    const payment_status =
      status === "verified"
        ? "verified"
        : status === "rejected"
          ? "rejected"
          : status === "payment_submitted"
            ? "submitted"
            : undefined;

    const patch = {
      status,
      admin_note: admin_note?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (payment_status) patch.payment_status = payment_status;

    const { data, error } = await supabase
      .from("orders")
      .update(patch)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) {
      console.error("[orders]", error);
      return res.status(500).json({ message: "Could not update order status." });
    }

    return res.json({ message: "Order updated", order: data });
  } catch (error) {
    console.error("[orders]", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export { ADMIN_STATUSES };
export default router;
