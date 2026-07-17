-- Run in Supabase SQL Editor (Vercel Storage → crackro)

-- Contact enquiries (no cart)
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  interest text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;

drop policy if exists "Allow insert enquiries" on public.enquiries;
create policy "Allow insert enquiries"
  on public.enquiries
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow select enquiries for authenticated" on public.enquiries;
create policy "Allow select enquiries for authenticated"
  on public.enquiries
  for select
  to authenticated
  using (true);

-- Ecommerce orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  name text not null,
  phone text not null,
  email text,
  address text not null,
  city text,
  state text,
  pincode text not null,
  items jsonb not null,
  total numeric(12, 2) not null default 0,
  utr text not null,
  payment_status text not null default 'submitted',
  status text not null default 'payment_submitted',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade older orders table if it already exists
alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists address text;
alter table public.orders add column if not exists city text;
alter table public.orders add column if not exists state text;
alter table public.orders add column if not exists pincode text;
alter table public.orders add column if not exists utr text;
alter table public.orders add column if not exists payment_status text default 'submitted';
alter table public.orders add column if not exists admin_note text;
alter table public.orders add column if not exists updated_at timestamptz default now();

create unique index if not exists orders_order_number_uidx on public.orders (order_number);

alter table public.orders enable row level security;

drop policy if exists "Allow insert orders" on public.orders;
create policy "Allow insert orders"
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow select orders for authenticated" on public.orders;
create policy "Allow select orders for authenticated"
  on public.orders
  for select
  to authenticated
  using (true);
