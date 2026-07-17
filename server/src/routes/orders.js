import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { adminAuth } from "../middleware/adminAuth.js";

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

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return items.map((item) => ({
    cartId: item.cartId || `${item.type || "item"}-${item.id}`,
    id: item.id,
    type: item.type || "product",
    name: String(item.name || "").trim(),
    price: item.price || null,
    priceValue: Number(item.priceValue) || 0,
    unit: item.unit || "",
    qty: Math.max(1, Number(item.qty) || 1),
  }));
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

router.get("/payment-config", (_req, res) => {
  const upiId = process.env.UPI_ID || "sparklecrackers@upi";
  const payeeName = process.env.UPI_NAME || "Sparkle Crackers";
  res.json({
    upiId,
    payeeName,
    note: "Pay the order total using UPI, then enter the UTR / UPI reference number.",
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
      total,
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
    if (!utr?.trim() || utr.trim().length < 6) {
      return res
        .status(400)
        .json({ message: "Valid UTR / UPI reference number is required." });
    }

    const cartItems = normalizeItems(items);
    if (!cartItems) {
      return res.status(400).json({ message: "Cart items are required." });
    }

    if (!supabase) {
      return res.status(503).json({
        message:
          "Database is not configured. Add Supabase env vars in server/.env",
      });
    }

    const computedTotal = cartItems.reduce(
      (sum, item) => sum + item.priceValue * item.qty,
      0
    );

    const row = {
      order_number: makeOrderNumber(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      address: address.trim(),
      city: city.trim() || null,
      state: state.trim() || null,
      pincode: pincode.trim(),
      items: cartItems,
      total: Number(total) || computedTotal,
      utr: utr.trim(),
      payment_status: "submitted",
      status: "payment_submitted",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(row)
      .select(
        "id, order_number, total, status, payment_status, created_at, utr"
      )
      .single();

    if (error) {
      console.error("[orders]", error);
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

    const { data, error } = await supabase
      .from("orders")
      .select(
        "order_number, status, payment_status, total, created_at, city, pincode"
      )
      .eq("order_number", req.params.orderNumber)
      .maybeSingle();

    if (error) {
      console.error("[orders]", error);
      return res.status(500).json({ message: "Could not track order." });
    }
    if (!data) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.json({ order: data });
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
