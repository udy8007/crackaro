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

export function quoteShipping({ pincode, subtotal = 0, state = "" }) {
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

  const freeAbove = Number(process.env.SHIP_FREE_ABOVE) || 3000;
  const flatFee = Number(process.env.SHIP_FLAT_FEE) || 99;
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
        : `Flat shipping ₹${flatFee}. Free above ₹${freeAbove.toLocaleString("en-IN")}.`,
  };
}
