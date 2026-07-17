# Crackaro (Sparkle Crackers)
Full-stack ecommerce:

- **client/** — React shop + checkout + admin
- **server/** — Node/Express API
- **Database** — Supabase (Vercel Storage `crackro`)

## Customer flow

1. Add products / packs to cart  
2. **Place order** → enter name, mobile, address, city, state, pincode  
3. Scan **UPI QR**, pay total, enter **UTR**  
4. Order saved as `payment_submitted`  
5. Admin verifies UTR and updates status  

## Admin

Open http://localhost:5173/admin  
Login with `ADMIN_SECRET` from `server/.env`.

Statuses: `payment_submitted` → `verified` / `rejected` → `packed` → `shipped` → `delivered`

## Setup

```bash
npm install
npm install --prefix client
npm install --prefix server
copy server\.env.example server\.env
```

1. Run `server/sql/schema.sql` in Supabase SQL Editor  
2. Fill `server/.env`:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_SECRET=your-strong-secret
UPI_ID=yourshop@upi
UPI_NAME=Sparkle Crackers
```

```bash
npm run dev
```

- Shop: http://localhost:5173  
- Admin: http://localhost:5173/admin  
- API: http://localhost:5000  

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/orders/payment-config` | UPI ID for QR |
| POST | `/api/orders` | Place order (details + UTR + items) |
| GET | `/api/orders/track/:orderNumber` | Public order status |
| GET | `/api/orders` | Admin list (`x-admin-key`) |
| PATCH | `/api/orders/:id/status` | Admin update status |
| POST | `/api/enquiries` | General contact form |
