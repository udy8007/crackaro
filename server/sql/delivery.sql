-- Delivery charge config (admin-managed)
-- Default: ₹250 if order below ₹6,000; free at/above ₹6,000

alter table public.shop_settings
  add column if not exists delivery_fee numeric(12, 2) not null default 250
    check (delivery_fee >= 0);

alter table public.shop_settings
  add column if not exists free_delivery_above numeric(12, 2) not null default 6000
    check (free_delivery_above >= 0);

update public.shop_settings
set
  delivery_fee = coalesce(delivery_fee, 250),
  free_delivery_above = coalesce(free_delivery_above, 6000)
where id = 1;
