import { PACKS, PRODUCTS } from "../data/products";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

function withPriceValue(items) {
  return (items || []).map((item) => {
    const parsed =
      Number(item.priceValue) ||
      Number(String(item.price || "").replace(/[^\d.]/g, "")) ||
      0;
    return {
      ...item,
      id: String(item.id),
      priceValue: parsed,
      stock: Number(item.stock ?? 999),
    };
  });
}

function fallbackCatalog() {
  return {
    products: withPriceValue(
      PRODUCTS.map((p) => ({
        ...p,
        id: String(p.id),
        stock: 99,
        active: true,
      }))
    ),
    packs: withPriceValue(
      PACKS.map((p) => ({
        ...p,
        stock: 99,
        active: true,
        unit: "/ pack",
      }))
    ),
    fromFallback: true,
  };
}

let catalogPromise = null;

export async function fetchCatalog({ force = false } = {}) {
  if (!force && catalogPromise) return catalogPromise;

  catalogPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await parseJson(response);
      return {
        products: withPriceValue(data.products),
        packs: withPriceValue(data.packs),
        fromFallback: false,
      };
    } catch (error) {
      console.warn("[catalog] API unavailable, using local fallback", error);
      return fallbackCatalog();
    }
  })();

  return catalogPromise;
}

export function clearCatalogCache() {
  catalogPromise = null;
}
