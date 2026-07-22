# Crackaro
Full-stack ecommerce:1

- **client/** — React shop + checkout + admin
- **server/** — Node/Express API
- **Database** — Supabase (Vercel Storage `crackro`)

## Customer flow

1. Add products / packs to cart  
2. **Place order** → enter name, mobile, address, city, state, pincode  
3. test
3. Scan **UPI QR**, pay total, enter **UTR**  
4. Order saved as `payment_submitted`  
5. Admin verifies UTR and updates status  

## Admin (email OTP only)

Open http://localhost:5173/admin  

1. Enter authorized `ADMIN_EMAIL`  
2. Receive OTP by Nodemailer (SMTP)  
3. Verify OTP → orders dashboard  

Other emails are rejected. Mobile/SMS login is disabled.

```env
ADMIN_EMAIL=mr.mit97@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mr.mit97@gmail.com
SMTP_PASS=your_gmail_app_password
```

Run admin tables once: `npm run setup:db --prefix server`

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
UPI_NAME=Crackaro
```

```bash
npm run dev
```

- Shop: http://localhost:5173  
- Admin: http://localhost:5173/admin  
- API: http://localhost:5000  

## Production

- Site: https://crackaro.vercel.app/  
- API base: https://crackaro.vercel.app/api  
- Health: https://crackaro.vercel.app/api/health  

Set the same `server/.env` keys in the Vercel project **Environment Variables** (Production). The frontend uses relative `/api` on this origin, so `VITE_API_URL` can stay empty.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | API + DB config check |
| GET | `/api/orders/payment-config` | UPI ID for QR |
| POST | `/api/orders` | Place order (details + UTR + items) |
| GET | `/api/orders/track/:orderNumber` | Public order status |
| GET | `/api/orders` | Admin list (`x-admin-key`) |
| PATCH | `/api/orders/:id/status` | Admin update status |
| POST | `/api/enquiries` | General contact form |
