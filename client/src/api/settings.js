const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function fetchPublicSettings() {
  try {
    const response = await fetch(`${API_BASE}/settings`);
    return parseJson(response);
  } catch {
    return {
      minOrderAmount: 3000,
      deliveryFee: 250,
      freeDeliveryAbove: 6000,
    };
  }
}
