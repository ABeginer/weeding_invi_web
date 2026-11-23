-- Migration: Bảng quản lý đơn hàng nâng cấp (orders) và giao dịch ngân hàng (bank_transactions)
-- Bật RLS và thu hồi quyền từ anon/authenticated để chỉ service-role backend mới có quyền truy cập.

-- 1. Bảng đơn hàng nâng cấp gói (orders)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id text not null references public.users(id) on delete cascade,
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  plan text not null check (plan in ('pro', 'vip')),
  amount_vnd integer not null check (amount_vnd >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_code on public.orders (code);
create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_orders_wedding_id on public.orders (wedding_id);
create index if not exists idx_orders_status on public.orders (status);

alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;

-- 2. Bảng giao dịch biến động số dư ngân hàng (bank_transactions)
create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  amount_vnd integer not null check (amount_vnd >= 0),
  description text not null default '',
  received_at timestamptz not null,
  matched_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_bank_tx_ref on public.bank_transactions (ref);
create index if not exists idx_bank_tx_received_at on public.bank_transactions (received_at);
create index if not exists idx_bank_tx_matched_order on public.bank_transactions (matched_order_id);

alter table public.bank_transactions enable row level security;
revoke all on public.bank_transactions from anon, authenticated;
