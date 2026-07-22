export const DEFAULT_COMMISSION_RATE = 0.2;
export const DEFAULT_MIN_ORDER = 3000;
export const DEFAULT_SUPPLIER_MIN_ORDER = 2500;
export const DEFAULT_DELIVERY_FEE = 250;
export const DEFAULT_FREE_DELIVERY_ABOVE = 6000;

export function toMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/** Sell price from supplier cost + commission rate (rupees, rounded up). */
export function sellFromCost(costPrice, commissionRate) {
  const cost = toMoney(costPrice);
  const rate = Number(commissionRate);
  const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 0;
  return Math.ceil(cost * (1 + safeRate));
}

export function lineProfit(sellPrice, costPrice, qty = 1) {
  const q = Math.max(1, Math.floor(Number(qty) || 1));
  return toMoney((toMoney(sellPrice) - toMoney(costPrice)) * q);
}

export function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

/**
 * Customer checkout floor so SRK cost stays coverable:
 * sellMin >= supplierMin × (1 + commission).
 * Uses max(admin setting, that floor).
 */
export function effectiveCustomerMinOrder({
  minOrderAmount,
  supplierMinOrder,
  commissionRate,
} = {}) {
  const configured = Number(minOrderAmount);
  const supplier = Number(supplierMinOrder);
  const rate = Number(commissionRate);
  const safeConfigured =
    Number.isFinite(configured) && configured >= 0
      ? configured
      : DEFAULT_MIN_ORDER;
  const safeSupplier =
    Number.isFinite(supplier) && supplier >= 0
      ? supplier
      : DEFAULT_SUPPLIER_MIN_ORDER;
  const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 0;
  const linkedFloor = Math.ceil(safeSupplier * (1 + safeRate));
  return Math.max(safeConfigured, linkedFloor);
}

export function normalizeSettings(row) {
  const commissionRate = Number(
    row?.commission_rate ?? DEFAULT_COMMISSION_RATE
  );
  const minOrderAmount = Number(row?.min_order_amount ?? DEFAULT_MIN_ORDER);
  const supplierMinOrder = Number(
    row?.supplier_min_order ?? DEFAULT_SUPPLIER_MIN_ORDER
  );
  const deliveryFee = Number(row?.delivery_fee ?? DEFAULT_DELIVERY_FEE);
  const freeDeliveryAbove = Number(
    row?.free_delivery_above ?? DEFAULT_FREE_DELIVERY_ABOVE
  );
  return {
    commissionRate,
    minOrderAmount,
    supplierMinOrder,
    deliveryFee: Number.isFinite(deliveryFee) ? deliveryFee : DEFAULT_DELIVERY_FEE,
    freeDeliveryAbove: Number.isFinite(freeDeliveryAbove)
      ? freeDeliveryAbove
      : DEFAULT_FREE_DELIVERY_ABOVE,
    /** What customers are actually held to */
    effectiveMinOrderAmount: effectiveCustomerMinOrder({
      minOrderAmount,
      supplierMinOrder,
      commissionRate,
    }),
    updatedAt: row?.updated_at || null,
  };
}
