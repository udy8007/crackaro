-- Admin OTP auth tables (run in Supabase SQL Editor or via setup-db)

create table if not exists public.admin_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_otps_phone_idx on public.admin_otps (phone);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_sessions_phone_idx on public.admin_sessions (phone);
