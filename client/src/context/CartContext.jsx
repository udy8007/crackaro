import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchCatalog } from "../api/products";
import { notifyNtfy } from "../utils/ntfy";

const CartContext = createContext(null);
const STORAGE_KEY = "crackaro_cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parsePrice(price) {
  return Number(String(price).replace(/[^\d]/g, "")) || 0;
}

export function formatPrice(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function buildCatalogMap(catalog) {
  const map = new Map();
  for (const product of catalog.products || []) {
    map.set(`product-${product.id}`, product);
  }
  for (const pack of catalog.packs || []) {
    map.set(`pack-${pack.id}`, pack);
  }
  return map;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCart());
  const [toast, setToast] = useState("");
  const [pricesSynced, setPricesSynced] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  /** Refresh cart line prices from live catalog (server is source of truth). */
  const syncPricesFromCatalog = useCallback(async ({ force = false } = {}) => {
    try {
      const catalog = await fetchCatalog({ force });
      const map = buildCatalogMap(catalog);
      let changed = false;
      let nextItems = [];

      setItems((prev) => {
        const next = [];
        for (const row of prev) {
          const key = `${row.type || "product"}-${row.id}`;
          const live = map.get(key);
          if (!live || live.active === false || Number(live.stock) <= 0) {
            changed = true;
            continue; // drop unavailable items
          }
          const priceValue = Number(live.priceValue) || parsePrice(live.price);
          const maxStock = Number(live.stock);
          const qty = Math.min(row.qty, maxStock);
          if (
            priceValue !== row.priceValue ||
            live.price !== row.price ||
            qty !== row.qty ||
            maxStock !== row.maxStock ||
            live.name !== row.name
          ) {
            changed = true;
          }
          next.push({
            ...row,
            name: live.name,
            price: live.price,
            priceValue,
            unit: live.unit || row.unit || "",
            icon: live.icon || row.icon,
            mediaClass: live.mediaClass || row.mediaClass,
            imageUrl: live.imageUrl || row.imageUrl || null,
            maxStock,
            qty,
          });
        }
        nextItems = next;
        return changed ? next : prev;
      });

      if (changed) {
        setToast("Cart prices updated to latest rates.");
      }
      setPricesSynced(true);
      return { ok: true, changed, items: nextItems };
    } catch {
      setPricesSynced(true);
      return { ok: false, changed: false, items: null };
    }
  }, []);

  useEffect(() => {
    syncPricesFromCatalog();
  }, [syncPricesFromCatalog]);

  const addItem = useCallback((item) => {
    const cartId = item.cartId || `${item.type}-${item.id}`;
    const maxStock =
      Number.isFinite(Number(item.maxStock)) ? Number(item.maxStock) : Infinity;
    const addQty = Math.max(1, Math.floor(Number(item.qty) || 1));

    if (maxStock <= 0) return;

    const prev = itemsRef.current;
    const existing = prev.find((row) => row.cartId === cartId);
    if (existing) {
      const nextQty = Math.min(existing.qty + addQty, maxStock);
      if (nextQty === existing.qty) return;
      setItems(
        prev.map((row) =>
          row.cartId === cartId ? { ...row, qty: nextQty, maxStock } : row
        )
      );
    } else {
      setItems([
        ...prev,
        {
          cartId,
          id: String(item.id),
          type: item.type,
          name: item.name,
          price: item.price,
          priceValue: item.priceValue ?? parsePrice(item.price),
          unit: item.unit || "",
          icon: item.icon || "fa-bag-shopping",
          mediaClass: item.mediaClass || "c-orange",
          imageUrl: item.imageUrl || null,
          maxStock,
          qty: Math.min(addQty, maxStock),
        },
      ]);
    }

    notifyNtfy({
      title: "Cart — added",
      message: `${item.name || "Item"} ×${addQty} added to cart`,
      tags: ["shopping_cart", "+1"],
    });
  }, []);

  const removeItem = useCallback((cartId) => {
    const row = itemsRef.current.find((item) => item.cartId === cartId);
    if (!row) return;
    setItems(itemsRef.current.filter((item) => item.cartId !== cartId));
    notifyNtfy({
      title: "Cart — removed",
      message: `${row.name} removed from cart`,
      tags: ["wastebasket"],
    });
  }, []);

  const updateQty = useCallback((cartId, qty) => {
    const next = Number(qty);
    const row = itemsRef.current.find((item) => item.cartId === cartId);
    if (!row) return;

    if (!Number.isFinite(next) || next < 1) {
      setItems(itemsRef.current.filter((item) => item.cartId !== cartId));
      notifyNtfy({
        title: "Cart — removed",
        message: `${row.name} removed from cart`,
        tags: ["wastebasket"],
      });
      return;
    }

    const max = Number.isFinite(Number(row.maxStock))
      ? Number(row.maxStock)
      : Infinity;
    const nextQty = Math.min(next, max);
    if (nextQty === row.qty) return;

    setItems(
      itemsRef.current.map((item) =>
        item.cartId === cartId ? { ...item, qty: nextQty } : item
      )
    );
    notifyNtfy({
      title: "Cart — qty updated",
      message: `${row.name} quantity → ${nextQty}`,
      tags: ["arrows_counterclockwise"],
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const clearToast = useCallback(() => setToast(""), []);

  const count = useMemo(
    () => items.reduce((sum, row) => sum + row.qty, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, row) => sum + row.priceValue * row.qty, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      count,
      total,
      toast,
      pricesSynced,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      clearToast,
      syncPricesFromCatalog,
    }),
    [
      items,
      count,
      total,
      toast,
      pricesSynced,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      clearToast,
      syncPricesFromCatalog,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
