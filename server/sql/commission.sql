-- Middleman commission: cost (SRK) vs sell (Crackaro) + shop settings

create table if not exists public.shop_settings (
  id int primary key default 1 check (id = 1),
  commission_rate numeric(6, 4) not null default 0.20
    check (commission_rate >= 0 and commission_rate <= 2),
  min_order_amount numeric(12, 2) not null default 3000
    check (min_order_amount >= 0),
  supplier_min_order numeric(12, 2) not null default 2500
    check (supplier_min_order >= 0),
  updated_at timestamptz not null default now()
);

insert into public.shop_settings (id, commission_rate, min_order_amount, supplier_min_order)
values (1, 0.20, 3000, 2500)
on conflict (id) do nothing;

alter table public.products
  add column if not exists cost_price numeric(12, 2);

alter table public.packs
  add column if not exists cost_price numeric(12, 2);

-- Backfill cost from current price only when missing (safe to re-run)
update public.products
set cost_price = price
where cost_price is null;

update public.packs
set cost_price = price
where cost_price is null;

alter table public.products
  alter column cost_price set default 0;

alter table public.packs
  alter column cost_price set default 0;

alter table public.orders
  add column if not exists cost_subtotal numeric(12, 2);

alter table public.orders
  add column if not exists profit numeric(12, 2);

alter table public.shop_settings enable row level security;

drop policy if exists "Allow select shop_settings" on public.shop_settings;
create policy "Allow select shop_settings"
  on public.shop_settings for select
  to anon, authenticated
  using (true);
