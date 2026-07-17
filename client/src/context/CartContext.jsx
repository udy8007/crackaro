import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCart());
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const addItem = useCallback((item) => {
    const cartId = item.cartId || `${item.type}-${item.id}`;
    const maxStock =
      Number.isFinite(Number(item.maxStock)) ? Number(item.maxStock) : Infinity;
    const addQty = Math.max(1, Math.floor(Number(item.qty) || 1));

    if (maxStock <= 0) return;

    setItems((prev) => {
      const existing = prev.find((row) => row.cartId === cartId);
      if (existing) {
        const nextQty = Math.min(existing.qty + addQty, maxStock);
        if (nextQty === existing.qty) return prev;
        return prev.map((row) =>
          row.cartId === cartId
            ? { ...row, qty: nextQty, maxStock }
            : row
        );
      }
      return [
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
          maxStock,
          qty: Math.min(addQty, maxStock),
        },
      ];
    });
  }, []);

  const removeItem = useCallback((cartId) => {
    setItems((prev) => prev.filter((row) => row.cartId !== cartId));
  }, []);

  const updateQty = useCallback((cartId, qty) => {
    const next = Number(qty);
    if (!Number.isFinite(next) || next < 1) {
      setItems((prev) => prev.filter((row) => row.cartId !== cartId));
      return;
    }
    setItems((prev) =>
      prev.map((row) => {
        if (row.cartId !== cartId) return row;
        const max = Number.isFinite(Number(row.maxStock))
          ? Number(row.maxStock)
          : Infinity;
        return { ...row, qty: Math.min(next, max) };
      })
    );
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
      addItem,
      removeItem,
      updateQty,
      clearCart,
      clearToast,
    }),
    [
      items,
      count,
      total,
      toast,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      clearToast,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
