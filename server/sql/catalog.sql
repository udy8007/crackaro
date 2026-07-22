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

-- Seed catalog (idempotent) — synced from SRK Crackers backup 2026-07-22
alter table public.products add column if not exists image_url text;

insert into public.products (
  id, category, name, description, price, unit, stock, active,
  icon, media_class, tag, tag_class, image_url
) values
  ('7-cm-electric-sparklers', 'sparklers', '7 cm Electric Sparklers',
   'Classic 7 cm electric sparklers with bright golden sparks. Safe for children under adult supervision.',
   12, '/ 1 box (10 pcs)', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/7-cm-electric-sparklers.jpg?v=8'),
  ('7-cm-colour-sparklers', 'sparklers', '7 cm Colour Sparklers',
   '7 cm colour sparklers — multi-colour sparks. Popular for kids and family celebrations.',
   15, '/ 1 box (10 pcs)', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/7-cm-colour-sparklers.jpg?v=8'),
  ('10-cm-electric-sparklers', 'sparklers', '10 cm Electric Sparklers',
   '10 cm electric sparklers with longer burn time and brighter golden display.',
   18, '/ 1 box (10 pcs)', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/10-cm-electric-sparklers.jpg?v=8'),
  ('10-cm-colour-sparklers', 'sparklers', '10 cm Colour Sparklers',
   '10 cm colour sparklers — vibrant mixed-colour sparks.',
   22, '/ 1 box (10 pcs)', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/10-cm-colour-sparklers.jpg?v=8'),
  ('15-cm-electric-sparklers', 'sparklers', '15 cm Electric Sparklers',
   '15 cm electric sparklers — tall golden fountain effect on a stick.',
   30, '/ 1 box (10 pcs)', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/15-cm-electric-sparklers.jpg?v=8'),
  ('15-cm-green-sparklers', 'sparklers', '15 cm Green Sparklers',
   '15 cm green-colour sparklers with rich emerald-gold sparks.',
   48, '/ 1 box (10 pcs)', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/15-cm-green-sparklers.jpg?v=8'),
  ('15-cm-red-sparklers', 'sparklers', '15 cm Red Sparklers',
   '15 cm red sparklers — deep red and gold sparks.',
   55, '/ 1 box (10 pcs)', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/15-cm-red-sparklers.jpg?v=8'),
  ('30-cm-electric-sparklers', 'sparklers', '30 cm Electric Sparklers',
   '30 cm mega electric sparklers — extra-long burn with shower of golden sparks.',
   45, '/ 1 box (5 pcs)', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/30-cm-electric-sparklers.jpg?v=8'),
  ('30-cm-colour-sparklers', 'sparklers', '30 cm Colour Sparklers',
   '30 cm colour sparklers — spectacular multi-colour shower effect.',
   50, '/ 1 box (5 pcs)', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/30-cm-colour-sparklers.jpg?v=8'),
  ('50-cm-electric-sparklers', 'sparklers', '50 cm Electric Sparklers',
   '50 cm jumbo electric sparklers — longest sparkler in our range.',
   180, '/ 1 box (5 pcs)', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/50-cm-electric-sparklers.jpg?v=8'),
  ('1-twinkling-star', 'sparklers', '1½ Twinkling Star',
   '1½ twinkling star sparklers — crackling / twinkling effect. 10 pcs per box.',
   30, '/ 1 box (10 pcs)', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/1-twinkling-star.jpg?v=8'),
  ('twinkling-star-deluxe', 'sparklers', 'Twinkling Star Deluxe',
   'A long metal sparkler stick covered in premium pyrotechnic composition. Upon lighting, it crackles gently while casting a continuous, bright series of flashing silver and golden "twinkling star" spark bursts along its length.',
   80, '/ 1 box', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/twinkling-star-deluxe.jpg?v=8'),
  ('green-colour-torch', 'sparklers', 'Green Colour (Torch)',
   'An elite novelty firework designed like a thick wand. Upon lighting, it doesn''t crackle or make loud bangs; instead, it shoots a continuous, brilliant, fountain-like vertical stream of multi-colored sparks (Red, Green, Blue, and Gold). It offers an extended burn time of 20 to 40 seconds per pencil, creating a dramatic, smoke-controlled glowing shield that is highly favored for festive entries, celebrations, and photography backdrop illumination.',
   70, '/ 1 box', 100, true, 'fa-wand-magic-sparkles', 'c-gold', '80% Off', 'tag-gold', '/images/products/green-colour-torch.jpg?v=8'),
  ('deluxe-chakkar', 'ground', 'Deluxe Chakkar',
   'A classic festival favorite that spins rapidly on flat ground when ignited. It creates a beautiful, wide, circular wheel of vibrant colored sparks and concentric fiery rings, bringing bright illumination directly to the floor.

Based on the Sri Meena Kumari Deluxe Chakkar shown in your image, here are the short listing details calculated with your standard Sivakasi 80% wholesale discount for your catalog layout at SRK Crackers.',
   170, '/ 1 box', 100, true, 'fa-circle-dot', 'c-pink', '80% Off', 'tag-pink', '/images/products/deluxe-chakkar.jpg?v=8'),
  ('special-chakkar', 'ground', 'Special Chakkar',
   'High-performance ground wheel that ignites smoothly to spin rapidly on flat surfaces. It casts a wide, dazzling circular shield of golden sparks, multi-colored light rings, and star effects without any loud or irritating noises.',
   110, '/ 1 box', 100, true, 'fa-circle-dot', 'c-pink', '80% Off', 'tag-pink', '/images/products/special-chakkar.jpg?v=8'),
  ('colour-swirls-special', 'ground', 'Colour Swirls (Special)',
   'An upgraded, premium variant of the classic ground spinner. Upon ignition, it spins rapidly on flat ground, emitting intense concentric circles of multi-colored changing flames and sparkling patterns rather than standard single-color sparks.',
   150, '/ 1 box', 100, true, 'fa-circle-dot', 'c-pink', '80% Off', 'tag-pink', '/images/products/colour-swirls-special.jpg?v=8'),
  ('kurkure-crackling-12-shot', 'ground', 'Kurkure Crackling 12 Shot',
   'Shoots 12 continuous aerial shells into the sky one after another. Each shot bursts at a spectacular height into a massive cluster of golden glittering stars accompanied by a loud, crisp "Kurkure" crackling sound effect.

Based on the Sky King Kurkure Crackling 12 Shot multi-shot aerial cake box shown in your image, here is the official short listing details calculated with your Sivakasi 80% wholesale discount for SRK Crackers.',
   250, '/ 1 box', 100, true, 'fa-circle-dot', 'c-pink', '80% Off', 'tag-pink', '/images/products/kurkure-crackling-12-shot.jpg?v=8'),
  ('60-multi-colour-shot', 'ground', '60 Multi Colour Shot',
   'A magnificent aerial showstopper that launches 60 continuous rapid-fire shots into the sky. It fills the night air with massive, sky-wide bursts of vibrant multi-colored stars, palms, and crackling flower effects.',
   1100, '/ 1 box', 100, true, 'fa-circle-dot', 'c-pink', '80% Off', 'tag-pink', '/images/products/60-multi-colour-shot.jpg?v=8'),
  ('bambaram', 'ground', 'Bambaram',
   'Bambaram (Spinner) is a colorful ground spinner firework that rotates rapidly on the ground, creating vibrant sparks and dazzling circular effects. Safe, fun, and perfect for kids and family celebrations under adult supervision. Each box contains 10 pieces.',
   160, '/ 10 pcs', 100, true, 'fa-circle-dot', 'c-pink', '80% Off', 'tag-pink', '/images/products/bambaram.jpg?v=8'),
  ('chota-fancy-1pcs', 'fancy', 'Chota fancy (1pcs)',
   'Long, rigid pyrotechnic tubes that launch a consecutive series of multi-colored stars high into the night sky. Each tube shoots out a rapid sequence of vibrant red, green, and golden glowing balls that burst gently into bright points of light with a pleasing visual effect.',
   50, '/ 1 box', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/chota-fancy-1pcs.jpg?v=8'),
  ('2in-fancy', 'fancy', '2" Fancy',
   '2 inch aerial fancy — shoots skyward and bursts with colourful stars.',
   120, '/ 1 pc', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/2in-fancy.jpg?v=8'),
  ('2in-fancy-3-pcs', 'fancy', '2" Fancy (3 Pcs)',
   '2 inch fancy sky shots — box of 3 aerial bursts.',
   280, '/ 1 box (3 pcs)', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/2in-fancy-3-pcs.jpg?v=8'),
  ('2-inch-double-ball-1pcs', 'fancy', '2 inch Double Ball (1pcs)',
   '2 inch Double Ball aerial — dual-burst sky shot. Single piece.',
   260, '/ 1 pc', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/2-inch-double-ball-1pcs.jpg?v=8'),
  ('2in-pipe-1-piece', 'fancy', '2" Pipe (1 Piece)',
   '2 inch pipe sky shot — cylindrical aerial cracker with sharp burst.',
   150, '/ 1 pc', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/2in-pipe-1-piece.jpg?v=8'),
  ('3in-fancy', 'fancy', '3" Fancy',
   '3 inch aerial fancy — rich colour mix sky shot.',
   280, '/ 1 pc', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/3in-fancy.jpg?v=8'),
  ('3-5in-fancy-1-piece', 'fancy', '3½" Fancy (1 Piece)',
   'Premium 3.5 inch single-piece fancy — maximum height and brightest colour burst.',
   320, '/ 1 pc', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/3-5in-fancy-1-piece.jpg?v=8'),
  ('4in-fancy-2-pcs', 'fancy', '4" Fancy (2 pcs)',
   '4 inch fancy twin pack — two premium aerial bursts.',
   650, '/ 1 box (2 pcs)', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/4in-fancy-2-pcs.jpg?v=8'),
  ('5-inch-fancy-2-in-1', 'fancy', '5 inch Fancy 2 in 1',
   '5 inch Fancy 2-in-1 combo pack — premium dual-effect aerial fancy.',
   790, '/ 1 box', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/5-inch-fancy-2-in-1.jpg?v=8'),
  ('3-pcs-sky-shot-2pcs', 'fancy', '3 Pcs Sky Shot (2pcs)',
   'Triple 2 inch sky shot pack — three consecutive aerial bursts.',
   580, '/ 1 box (3 pcs)', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/3-pcs-sky-shot-2pcs.jpg?v=8'),
  ('7-shots', 'fancy', '7 Shots',
   '7-shot multi-burst aerial display — sequential sky shots in one compact set.',
   140, '/ 1 box (1 set)', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/7-shots.jpg?v=8'),
  ('30-shots-multi-colour', 'fancy', '30 Shots Multi Colour',
   '30-shot multi-colour aerial display — continuous sky shots.',
   480, '/ 1 box (1 set)', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/30-shots-multi-colour.jpg?v=8'),
  ('120shots', 'fancy', '120Shots',
   '12-shot multi-burst aerial set — sequential sky shots.',
   1900, '/ 1 box (5 pcs)', 100, true, 'fa-cloud-moon', 'c-teal', '80% Off', 'tag-teal', '/images/products/120shots.jpg?v=8'),
  ('helicopter-5pcs', 'rockets', 'Helicopter (5pcs)',
   'Sky Scrapper rocket-style aerial — high altitude burst with trailing sparks.',
   160, '/ 1 pc', 100, true, 'fa-rocket', 'c-blue', '77% Off', 'tag-blue', '/images/products/helicopter-5pcs.jpg?v=8'),
  ('rocket-bomb', 'rockets', 'Rocket Bomb',
   'Rocket bomb crackers — launches with whistle and bursts in the sky.',
   120, '/ 1 box (10 pcs)', 100, true, 'fa-rocket', 'c-blue', '80% Off', 'tag-blue', '/images/products/rocket-bomb.jpg?v=8'),
  ('whistling-rocket', 'rockets', 'Whistling Rocket',
   'Whistling rockets — loud whistle on ascent followed by aerial burst.',
   240, '/ 1 box (10 pcs)', 100, true, 'fa-rocket', 'c-blue', '80% Off', 'tag-blue', '/images/products/whistling-rocket.jpg?v=8'),
  ('flower-pot-asoka', 'fountain', 'Flower Pot Asoka',
   'Flower Pot Asoka — classic cone flower-pot fountains. 10 pcs.',
   170, '/ 10 pcs', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/flower-pot-asoka.jpg?v=8'),
  ('flower-pots-special', 'fountain', 'Flower Pots Special',
   'A festive favorite that shoots a beautiful, thick vertical fountain of vibrant multi-colored sparks mixed with a brilliant golden shower. It produces a wide-reaching light display with minimal sound, lighting up your courtyard safely.',
   130, '/ 1 box', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/flower-pots-special.jpg?v=8'),
  ('flower-pots-deluxe-5pcs', 'fountain', 'Flower Pots Deluxe (5pcs)',
   'A classic festival essential that stands firmly on the ground when lit. It shoots a magnificent, tall fountain of bright golden crackling sparks mixed with multiple colorful changing streams, illuminating the entire surroundings beautifully.',
   240, '/ 1 box', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/flower-pots-deluxe-5pcs.jpg?v=8'),
  ('colour-koti', 'fountain', 'Colour Koti',
   'Colour Koti 3-colour fountain — red, green and gold spray effect.',
   240, '/ 1 box (10 pcs)', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/colour-koti.jpg?v=8'),
  ('colour-koti-deluxe', 'fountain', 'Colour koti Deluxe',
   'A spectacular, large-sized cone fountain that erupts into a dense, towering shower of vivid multicolor sparks. Unlike standard single-color pots, it changes hues dynamically as it burns, casting bright, multi-layered streams of green, red, and golden crackling stars high into the air.',
   380, '/ 1 box', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/colour-koti-deluxe.jpg?v=8'),
  ('butterfly', 'fountain', 'Butterfly',
   'Butterfly colour-changing fountain — sparks change colour during burn.',
   120, '/ 1 box (10 pcs)', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/butterfly.jpg?v=8'),
  ('rotate-sparklers', 'fountain', 'Rotate Sparklers',
   'Rotating sparkler / dancing umbrella — spins on ground while emitting sparks.',
   240, '/ 1 box (10 pcs)', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/rotate-sparklers.jpg?v=8'),
  ('mini-siren', 'fountain', 'Mini Siren',
   'Experience a magnificent fountain show paired with a loud, attention-grabbing whistling siren effect! Kids and adults alike love this fancy novelty cracker.',
   170, '/ 1 box', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/mini-siren.jpg?v=8'),
  ('mega-siren-3pcs', 'fountain', 'Mega Siren (3pcs)',
   'Mega Siren fountain — loud siren sound with colour fountain effect.',
   230, '/ 1 box (3 pcs)', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/mega-siren-3pcs.jpg?v=8'),
  ('magic-peacock', 'fountain', 'Magic Peacock',
   'Magic Peacock fountain — rotating colour fountain with peacock-tail effect.',
   180, '/ 1 box (5 pcs)', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/magic-peacock.jpg?v=8'),
  ('bada-peacock-5-face', 'fountain', 'Bada Peacock (5 Face)',
   'Bada Peacock 5-face fountain — five-way colour spray.',
   460, '/ 1 box (5 pcs)', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/bada-peacock-5-face.jpg?v=8'),
  ('naya-falls', 'fountain', 'Naya Falls (1pcs)',
   'Naya Falls waterfall fountain — cascading golden sparks like a waterfall.',
   380, '/ 1 box (5 pcs)', 100, true, 'fa-seedling', 'c-green', '80% Off', 'tag-green', '/images/products/naya-falls.jpg?v=8'),
  ('hitler-kg-paper-bomb', 'bombs', 'Hitler (¼ Kg) paper Bomb',
   'Hitler ¼ kg sound bomb — loud single blast. Use only in wide open ground.',
   60, '/ 1 pc', 100, true, 'fa-bomb', 'c-red', '80% Off', 'tag-red', '/images/products/hitler-kg-paper-bomb.jpg?v=8'),
  ('kaki-ola-vedi-10pcs', 'bombs', 'Kaki ola vedi (10pcs)',
   'Bullet Bomb — loud single blast. Use only in wide open ground.',
   65, '/ 1 pc', 100, true, 'fa-bomb', 'c-red', '80% Off', 'tag-red', '/images/products/kaki-ola-vedi-10pcs.jpg?v=8'),
  ('hydro-bomb', 'bombs', 'Hydro Bomb',
   'Hydro bomb crackers — deep thunder sound. 10 pcs per box. Open area only.',
   140, '/ 1 box (10 pcs)', 100, true, 'fa-bomb', 'c-red', '80% Off', 'tag-red', '/images/products/hydro-bomb.jpg?v=8'),
  ('classic-bomb', 'bombs', 'Classic Bomb',
   'Classic bomb — extra-loud atom bomb series with sharp report.',
   180, '/ 1 box (10 pcs)', 100, true, 'fa-bomb', 'c-red', '80% Off', 'tag-red', '/images/products/classic-bomb.jpg?v=8'),
  ('digital-bomb', 'bombs', 'Digital Bomb',
   'Digital bomb — loudest in atom bomb range. Deep resonating blast.',
   280, '/ 1 box (10 pcs)', 100, true, 'fa-bomb', 'c-red', '80% Off', 'tag-red', '/images/products/digital-bomb.jpg?v=8'),
  ('paper-bomb-half-kg', 'bombs', 'Paper Bomb (½ Kg)',
   '½ kg paper bomb — heavy single blast for large open areas.',
   120, '/ 1 pc', 100, true, 'fa-bomb', 'c-red', '80% Off', 'tag-red', '/images/products/paper-bomb-half-kg.jpg?v=8'),
  ('paper-bomb-1-kg', 'bombs', 'Paper Bomb (1 Kg)',
   '1 kg mega paper bomb — maximum single-shot sound effect.',
   240, '/ 1 pc', 100, true, 'fa-bomb', 'c-red', '80% Off', 'tag-red', '/images/products/paper-bomb-1-kg.jpg?v=8'),
  ('4in-gun-out', 'bombs', '4" Gun Out',
   'remium quality Sivakasi sound cracker that produces a powerful and loud bursting effect. Manufactured using high-quality materials for festive celebrations. Use only in open areas and under adult supervision.',
   270, '/ 1 box', 100, true, 'fa-bomb', 'c-red', '80% Off', 'tag-red', '/images/products/4in-gun-out.jpg?v=8'),
  ('6in-elephant-bomb', 'bombs', '6" Elephant Bomb',
   '6" Yaanai Vedi is a premium traditional sound cracker that delivers a powerful and loud bursting sound, making it a popular choice for Deepavali celebrations. Each packet contains 10 pieces, offering reliable performance and festive excitement.',
   100, '/ 10 pcs', 100, true, 'fa-bomb', 'c-red', '33% Off', 'tag-red', '/images/products/6in-elephant-bomb.jpg?v=8'),
  ('2-75-kuruvi', 'lakshmi', '2¾ Kuruvi',
   '2.75 inch Kuruvi crackers — classic small sound cracker.',
   8, '/ 1 pkt (5 pcs)', 100, true, 'fa-bolt', 'c-orange', '80% Off', 'tag-orange', '/images/products/2-75-kuruvi.jpg?v=8'),
  ('3-25-lakshmi-1-packet', 'lakshmi', '3¼ Lakshmi (1 Packet)',
   '3.25 inch Lakshmi crackers — traditional sharp sound. 5 pieces per packet.',
   15, '/ 1 pkt (5 pcs)', 100, true, 'fa-bolt', 'c-orange', '80% Off', 'tag-orange', '/images/products/3-25-lakshmi-1-packet.jpg?v=8'),
  ('4-dlx-lakshmi', 'lakshmi', '4 DLX Lakshmi',
   '4 inch deluxe Lakshmi crackers — enhanced sound and longer burn.',
   28, '/ 1 pkt (5 pcs)', 100, true, 'fa-bolt', 'c-orange', '80% Off', 'tag-orange', '/images/products/4-dlx-lakshmi.jpg?v=8'),
  ('gold-lakshmi-1-packet', 'lakshmi', 'Gold Lakshmi (1 Packet)',
   'Gold Lakshmi premium sound crackers — louder burst with gold-label quality.',
   35, '/ 1 pkt (5 pcs)', 100, true, 'fa-bolt', 'c-orange', '80% Off', 'tag-orange', '/images/products/gold-lakshmi-1-packet.jpg?v=8'),
  ('hulk-dlx', 'lakshmi', 'Hulk DLX',
   'Hulk deluxe mega sound crackers — extra loud burst.',
   38, '/ 1 pkt (5 pcs)', 100, true, 'fa-bolt', 'c-orange', '80% Off', 'tag-orange', '/images/products/hulk-dlx.jpg?v=8'),
  ('5in-lion-1-packet', 'lakshmi', '5" Lion (1 Packet)',
   '5 inch Lion brand crackers — deep loud report. Premium sound cracker.',
   44, '/ 1 pkt (5 pcs)', 100, true, 'fa-bolt', 'c-orange', '80% Off', 'tag-orange', '/images/products/5in-lion-1-packet.jpg?v=8'),
  ('red-bijili-100', 'lakshmi', 'Red Bijili (100)',
   'Red bijili — small single-shot crackers, 100 pieces per bag.',
   28, '/ 1 bag (100 pcs)', 100, true, 'fa-bolt', 'c-orange', '80% Off', 'tag-orange', '/images/products/red-bijili-100.jpg?v=8'),
  ('two-sound-1-packet', 'lakshmi', 'Two Sound (1 Packet)',
   'Two-sound crackers — traditional double-report sound. 5 pcs per packet.',
   45, '/ 1 pkt (5 pcs)', 100, true, 'fa-bolt', 'c-orange', '80% Off', 'tag-orange', '/images/products/two-sound-1-packet.jpg?v=8'),
  ('jallikattu-dlx-1-packet', 'lakshmi', 'Jallikattu DLX (1 Packet)',
   'Jallikattu deluxe sound crackers — loud burst. 5 pcs per packet.',
   65, '/ 1 pkt (5 pcs)', 100, true, 'fa-bolt', 'c-orange', '80% Off', 'tag-orange', '/images/products/jallikattu-dlx-1-packet.jpg?v=8'),
  ('roll-cap', 'kids', 'Roll Cap',
   'Roll cap strips — safe fun for kids, produces small popping sounds.',
   85, '/ 1 box (10 pcs)', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/roll-cap.jpg?v=8'),
  ('wonder-throw-box-10pcs', 'kids', 'Wonder Throw Box (10pcs)',
   'Wonder throw box — throw-and-pop novelty cracker for kids with supervision.',
   130, '/ 1 box (10 pcs)', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/wonder-throw-box-10pcs.jpg?v=8'),
  ('pop-pop-50-boxes', 'kids', 'Pop Pop (50 Boxes)',
   'Pop Pop snappers — 50 boxes of safe popping fun for kids.',
   400, '/ 1 pack (50 boxes)', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/pop-pop-50-boxes.jpg?v=8'),
  ('beedi-blast-10-boxes', 'kids', 'Beedi Blast (10 Boxes)',
   'Bidi Blast novelty — small crackling pop effect. 10 boxes per pack.',
   150, '/ 1 pack (10 boxes)', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/beedi-blast-10-boxes.jpg?v=8'),
  ('gun-with-3-ring-caps', 'kids', 'Gun with 3 Ring Caps',
   'Toy gun with 3 ring cap rolls — classic kids'' firework toy.',
   100, '/ 1 set', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/gun-with-3-ring-caps.jpg?v=8'),
  ('ring-cap-100-packets', 'kids', 'Ring Cap (100 Packets)',
   'Ring caps bulk pack — 100 packets for toy guns.',
   750, '/ 1 pack (100 pkt)', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/ring-cap-100-packets.jpg?v=8'),
  ('anaconda-10-boxes', 'kids', 'Anaconda (10 Boxes)',
   'Anaconda snake novelty — expanding snake effect on ignition.',
   50, '/ 1 pack (10 boxes)', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/anaconda-10-boxes.jpg?v=8'),
  ('selfie-stick-5pcs', 'kids', 'Selfie Stick (5pcs)',
   'Selfie Stick photo flash — bright white flash effect for photos.',
   180, '/ 1 box (5 pcs)', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/selfie-stick-5pcs.jpg?v=8'),
  ('colour-smoke', 'kids', 'Colour Smoke',
   'Colour smoke fountain — coloured smoke plume. Daytime-friendly.',
   180, '/ 1 box (5 pcs)', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/colour-smoke.jpg?v=8'),
  ('photo-flash', 'kids', 'Photo Flash',
   'Photo flash crackers — bright white strobe flash for night celebrations.',
   90, '/ 1 box (10 pcs)', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/photo-flash.jpg?v=8'),
  ('sky-lander-6-piece', 'kids', 'Sky Lander (6 Piece)',
   'Sky Lander helicopter novelty — spins up into the air with sparks.',
   240, '/ 1 pc', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/sky-lander-6-piece.jpg?v=8'),
  ('kitkat', 'kids', 'Kitkat',
   'Kitkat is a fun kids'' novelty cracker designed for safe entertainment during festive celebrations. It produces a light popping effect and is suitable for children under adult supervision. Premium quality fireworks from Sivakasi.',
   40, '/ 1 box', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/kitkat.jpg?v=8'),
  ('guitar', 'kids', 'Guitar',
   'A colorful guitar-shaped novelty firework designed for children. Premium quality fireworks from Sivakasi. Ideal for festive celebrations. Use only under adult supervision.',
   240, '/ 1 box', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/guitar.jpg?v=8'),
  ('lighter-stick-2-pcs', 'kids', 'Lighter Stick (2 Pcs)',
   'Easy-to-use lighting sticks for safely igniting sparklers and fireworks. Long-burning design for convenient and controlled lighting. Suitable for festive celebrations. Use under adult supervision.',
   20, '/ 2 Pcs', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/lighter-stick-2-pcs.jpg?v=8'),
  ('drone-show', 'kids', 'Drone Show',
   'Drone Show is an exciting aerial fireworks item that launches colorful flying drones into the sky with bright spinning effects and vibrant lights. A fun and attractive fireworks product for kids and family celebrations. Each box contains 5 pieces.',
   149, '/ 5 pcs', 100, true, 'fa-children', 'c-purple', '80% Off', 'tag-purple', '/images/products/drone-show.jpg?v=8'),
  ('28-wala', 'wala', '28 Wala',
   '28 crackers string (wala) — short garland for quick celebration burst.',
   15, '/ 1 string', 100, true, 'fa-link', 'c-orange', '80% Off', 'tag-orange', '/images/products/28-wala.jpg?v=8'),
  ('100-wala', 'wala', '100 Wala',
   '100 wala cracker garland — continuous chain firing.',
   45, '/ 1 string', 100, true, 'fa-link', 'c-orange', '80% Off', 'tag-orange', '/images/products/100-wala.jpg?v=8'),
  ('200-wala', 'wala', '200 Wala',
   '200 wala garland — longer continuous burst sequence.',
   90, '/ 1 string', 100, true, 'fa-link', 'c-orange', '80% Off', 'tag-orange', '/images/products/200-wala.jpg?v=8'),
  ('1000-wala', 'wala', '1000 Wala',
   '1000 wala garland ladi — extended continuous firing for grand celebrations.',
   220, '/ 1 box', 100, true, 'fa-link', 'c-orange', '80% Off', 'tag-orange', '/images/products/1000-wala.jpg?v=8'),
  ('2000-wala', 'wala', '2000 Wala',
   '2000 wala mega garland — long continuous burst. Ideal for Diwali finale.',
   440, '/ 1 box', 100, true, 'fa-link', 'c-orange', '80% Off', 'tag-orange', '/images/products/2000-wala.jpg?v=8'),
  ('5000-wala', 'wala', '5000 Wala',
   '5000 wala super garland — one of the longest ladi chains.',
   1100, '/ 1 box', 100, true, 'fa-link', 'c-orange', '80% Off', 'tag-orange', '/images/products/5000-wala.jpg?v=8'),
  ('10000-wala', 'wala', '10000 Wala',
   '10000 wala jumbo garland — maximum length continuous cracker chain.',
   2200, '/ 1 box', 100, true, 'fa-link', 'c-orange', '80% Off', 'tag-orange', '/images/products/10000-wala.jpg?v=8')
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
  image_url = excluded.image_url,
  active = true,
  updated_at = now();

-- Hide legacy sample SKUs not in the synced catalog
update public.products
set active = false, updated_at = now()
where id not in ('7-cm-electric-sparklers', '7-cm-colour-sparklers', '10-cm-electric-sparklers', '10-cm-colour-sparklers', '15-cm-electric-sparklers', '15-cm-green-sparklers', '15-cm-red-sparklers', '30-cm-electric-sparklers', '30-cm-colour-sparklers', '50-cm-electric-sparklers', '1-twinkling-star', 'twinkling-star-deluxe', 'green-colour-torch', 'deluxe-chakkar', 'special-chakkar', 'colour-swirls-special', 'kurkure-crackling-12-shot', '60-multi-colour-shot', 'bambaram', 'chota-fancy-1pcs', '2in-fancy', '2in-fancy-3-pcs', '2-inch-double-ball-1pcs', '2in-pipe-1-piece', '3in-fancy', '3-5in-fancy-1-piece', '4in-fancy-2-pcs', '5-inch-fancy-2-in-1', '3-pcs-sky-shot-2pcs', '7-shots', '30-shots-multi-colour', '120shots', 'helicopter-5pcs', 'rocket-bomb', 'whistling-rocket', 'flower-pot-asoka', 'flower-pots-special', 'flower-pots-deluxe-5pcs', 'colour-koti', 'colour-koti-deluxe', 'butterfly', 'rotate-sparklers', 'mini-siren', 'mega-siren-3pcs', 'magic-peacock', 'bada-peacock-5-face', 'naya-falls', 'hitler-kg-paper-bomb', 'kaki-ola-vedi-10pcs', 'hydro-bomb', 'classic-bomb', 'digital-bomb', 'paper-bomb-half-kg', 'paper-bomb-1-kg', '4in-gun-out', '6in-elephant-bomb', '2-75-kuruvi', '3-25-lakshmi-1-packet', '4-dlx-lakshmi', 'gold-lakshmi-1-packet', 'hulk-dlx', '5in-lion-1-packet', 'red-bijili-100', 'two-sound-1-packet', 'jallikattu-dlx-1-packet', 'roll-cap', 'wonder-throw-box-10pcs', 'pop-pop-50-boxes', 'beedi-blast-10-boxes', 'gun-with-3-ring-caps', 'ring-cap-100-packets', 'anaconda-10-boxes', 'selfie-stick-5pcs', 'colour-smoke', 'photo-flash', 'sky-lander-6-piece', 'kitkat', 'guitar', 'lighter-stick-2-pcs', 'drone-show', '28-wala', '100-wala', '200-wala', '1000-wala', '2000-wala', '5000-wala', '10000-wala');

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
