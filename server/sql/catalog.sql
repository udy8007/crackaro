-- Catalog, stock, and order shipping columns

create table if not exists public.products (
  id text primary key,
  category text not null,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null,
  unit text not null default '',
  stock int not null default 0 check (stock >= 0),
  active boolean not null default true,
  icon text not null default 'fa-bag-shopping',
  media_class text not null default 'c-orange',
  tag text,
  tag_class text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packs (
  id text primary key,
  name text not null,
  price numeric(12, 2) not null,
  unit text not null default '/ pack',
  stock int not null default 0 check (stock >= 0),
  active boolean not null default true,
  class_name text not null default 'pack-orange',
  featured boolean not null default false,
  button_class text not null default 'btn-outline',
  interest text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists subtotal numeric(12, 2);
alter table public.orders add column if not exists shipping_fee numeric(12, 2) default 0;
alter table public.orders add column if not exists shipping_zone text;

create index if not exists products_active_idx on public.products (active);
create index if not exists packs_active_idx on public.packs (active);
create index if not exists orders_utr_created_idx on public.orders (utr, created_at);

alter table public.products enable row level security;
alter table public.packs enable row level security;

drop policy if exists "Allow select products" on public.products;
create policy "Allow select products"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow select packs" on public.packs;
create policy "Allow select packs"
  on public.packs for select
  to anon, authenticated
  using (true);

-- Atomic stock decrement (service role / postgres)
create or replace function public.decrement_product_stock(p_id text, p_qty int)
returns boolean
language plpgsql
as $$
declare
  updated int;
begin
  if p_qty is null or p_qty < 1 then
    return false;
  end if;
  update public.products
  set stock = stock - p_qty,
      updated_at = now()
  where id = p_id
    and active = true
    and stock >= p_qty;
  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

create or replace function public.decrement_pack_stock(p_id text, p_qty int)
returns boolean
language plpgsql
as $$
declare
  updated int;
begin
  if p_qty is null or p_qty < 1 then
    return false;
  end if;
  update public.packs
  set stock = stock - p_qty,
      updated_at = now()
  where id = p_id
    and active = true
    and stock >= p_qty;
  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

-- Seed catalog (idempotent)
insert into public.products (
  id, category, name, description, price, unit, stock, active,
  icon, media_class, tag, tag_class
) values
  ('1', 'sparklers', 'Electric Sparklers 12"',
   'Long-lasting sparklers with bright golden sparks. Ideal for kids and family photos.',
   120, '/ pack', 200, true, 'fa-wand-magic-sparkles', 'c-gold', 'Best Seller', 'tag-gold'),
  ('2', 'ground', 'Deluxe Ground Chakra',
   'Smooth spin with vibrant colors. A Diwali tradition for every courtyard.',
   180, '/ box', 150, true, 'fa-circle-dot', 'c-pink', 'Classic', 'tag-pink'),
  ('3', 'flowerpots', 'Color Flower Pot Mega',
   'Tall fountain of multi-color sparks. Perfect for entrances and stage shows.',
   350, '/ piece', 120, true, 'fa-seedling', 'c-green', 'Premium', 'tag-green'),
  ('4', 'rockets', 'Sky Rocket Assorted',
   'High altitude rockets with colorful bursts. Great for open grounds.',
   450, '/ pack', 100, true, 'fa-rocket', 'c-blue', 'Aerial', 'tag-blue'),
  ('5', 'bombs', 'Hydro Bomb Special',
   'High-intensity sound cracker for festive evenings. Adult supervision required.',
   280, '/ pack', 80, true, 'fa-bomb', 'c-red', 'Power', 'tag-red'),
  ('6', 'aerial', '100 Shot Aerial Cake',
   'Continuous multi-shot display for weddings and grand celebrations.',
   2499, '/ piece', 40, true, 'fa-cloud-moon', 'c-teal', 'Show Stopper', 'tag-teal'),
  ('7', 'kids', 'Little Stars Combo',
   'Low-noise assortment with sparklers, snakes, and colorful cones.',
   399, '/ combo', 90, true, 'fa-children', 'c-purple', 'Kids Safe', 'tag-purple'),
  ('8', 'flowerpots', 'Twinkling Star Fountain',
   'Silver and gold fountain with extended burn time and soft crackle.',
   220, '/ piece', 110, true, 'fa-fire', 'c-orange', 'New', 'tag-orange')
on conflict (id) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  unit = excluded.unit,
  icon = excluded.icon,
  media_class = excluded.media_class,
  tag = excluded.tag,
  tag_class = excluded.tag_class,
  updated_at = now();

insert into public.packs (
  id, name, price, unit, stock, active, class_name, featured, button_class, interest, items
) values
  ('family', 'Family Delight', 1999, '/ pack', 50, true, 'pack-orange', false, 'btn-outline', 'family',
   '["Sparklers & chakras","Flower pots (assorted)","Kids combo items","Gift packaging included"]'::jsonb),
  ('diwali', 'Grand Diwali', 4999, '/ pack', 40, true, 'pack-magenta featured', true, 'btn-primary', 'diwali',
   '["Premium aerial shots","Rockets & fountains","Sound crackers mix","Free delivery above ₹3,000"]'::jsonb),
  ('wedding', 'Wedding Special', 9999, '/ pack', 25, true, 'pack-violet', false, 'btn-outline', 'wedding',
   '["Multi-shot cakes","Stage entry fountains","Custom quantity support","Event coordination help"]'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  unit = excluded.unit,
  class_name = excluded.class_name,
  featured = excluded.featured,
  button_class = excluded.button_class,
  interest = excluded.interest,
  items = excluded.items,
  updated_at = now();
