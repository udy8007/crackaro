const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function getPaymentConfig() {
  const response = await fetch(`${API_BASE}/orders/payment-config`);
  return parseJson(response);
}

export async function placeOrder(payload) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function trackOrder(orderNumber) {
  const response = await fetch(
    `${API_BASE}/orders/track/${encodeURIComponent(orderNumber)}`
  );
  return parseJson(response);
}

export { fetchAdminOrders, updateOrderStatus } from "./admin.js";
