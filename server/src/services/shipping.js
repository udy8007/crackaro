import {
  DEFAULT_DELIVERY_FEE,
  DEFAULT_FREE_DELIVERY_ABOVE,
  normalizeSettings,
} from "./pricing.js";
import { ensureSettings } from "./shopSettings.js";

function parseBlockedPins() {
  return String(process.env.SHIP_BLOCKED_PINS || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function parseAllowedStates() {
  return String(process.env.SHIP_ALLOWED_STATES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function quoteShipping({
  pincode,
  subtotal = 0,
  state = "",
  deliveryFee,
  freeDeliveryAbove,
} = {}) {
  const pin = String(pincode || "").trim();
  if (!/^\d{6}$/.test(pin)) {
    return {
      serviceable: false,
      fee: 0,
      zone: null,
      message: "Enter a valid 6-digit Indian pincode.",
    };
  }

  if (parseBlockedPins().includes(pin)) {
    return {
      serviceable: false,
      fee: 0,
      zone: "blocked",
      message: "Sorry, we do not deliver to this pincode yet.",
    };
  }

  const allowedStates = parseAllowedStates();
  if (allowedStates.length && state) {
    const normalized = String(state).trim().toLowerCase();
    if (!allowedStates.includes(normalized)) {
      return {
        serviceable: false,
        fee: 0,
        zone: "state_blocked",
        message: "Delivery is not available in this state.",
      };
    }
  }

  const freeAbove =
    Number(freeDeliveryAbove) ||
    Number(process.env.SHIP_FREE_ABOVE) ||
    DEFAULT_FREE_DELIVERY_ABOVE;
  const flatFee =
    Number(deliveryFee) ||
    Number(process.env.SHIP_FLAT_FEE) ||
    DEFAULT_DELIVERY_FEE;
  const amount = Number(subtotal) || 0;
  const fee = amount >= freeAbove ? 0 : flatFee;

  return {
    serviceable: true,
    fee,
    zone: fee === 0 ? "free" : "standard",
    freeAbove,
    flatFee,
    message:
      fee === 0
        ? `Free delivery (orders ₹${freeAbove.toLocaleString("en-IN")}+).`
        : `Delivery ₹${flatFee.toLocaleString("en-IN")}. Free above ₹${freeAbove.toLocaleString("en-IN")}.`,
  };
}

/** Load delivery rules from shop_settings, then quote. */
export async function quoteShippingWithSettings(args = {}) {
  let deliveryFee = DEFAULT_DELIVERY_FEE;
  let freeDeliveryAbove = DEFAULT_FREE_DELIVERY_ABOVE;
  try {
    const row = await ensureSettings();
    const settings = normalizeSettings(row);
    deliveryFee = settings.deliveryFee;
    freeDeliveryAbove = settings.freeDeliveryAbove;
  } catch (err) {
    console.warn("[shipping] settings fallback", err);
  }
  return quoteShipping({
    ...args,
    deliveryFee,
    freeDeliveryAbove,
  });
}
