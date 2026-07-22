import { supabase } from "../db/supabase.js";
import {
  DEFAULT_COMMISSION_RATE,
  DEFAULT_MIN_ORDER,
  DEFAULT_SUPPLIER_MIN_ORDER,
  normalizeSettings,
} from "./pricing.js";

export async function loadSettingsRow() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("shop_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("[shopSettings]", error);
    return null;
  }
  return data;
}

export async function ensureSettings() {
  const existing = await loadSettingsRow();
  if (existing) return existing;

  const seed = {
    id: 1,
    commission_rate: DEFAULT_COMMISSION_RATE,
    min_order_amount: DEFAULT_MIN_ORDER,
    supplier_min_order: DEFAULT_SUPPLIER_MIN_ORDER,
    updated_at: new Date().toISOString(),
  };

  if (!supabase) return seed;

  const { data, error } = await supabase
    .from("shop_settings")
    .upsert(seed, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    console.error("[shopSettings] seed", error);
    return seed;
  }
  return data;
}

export { normalizeSettings };
