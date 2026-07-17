const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function quoteShipping({ pincode, subtotal, state = "" }) {
  const params = new URLSearchParams({
    pincode: String(pincode || ""),
    subtotal: String(subtotal || 0),
  });
  if (state) params.set("state", state);
  const response = await fetch(`${API_BASE}/shipping/quote?${params}`);
  return parseJson(response);
}
