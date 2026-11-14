-- Migration v12: Sổ mừng cưới (gifts)
-- Chạy trong Supabase Studio -> SQL Editor. An toàn khi chạy lại.
create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_id uuid references public.guests (id) on delete set null,
  giver_name text not null check (char_length(btrim(giver_name)) between 1 and 100),
  amount_vnd bigint not null check (amount_vnd >= 0 and amount_vnd <= 1000000000),
  method text not null check (method in ('cash', 'bank', 'other')),
  note text check (note is null or char_length(note) <= 300),
  thanked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists gifts_wedding_idx
  on public.gifts (wedding_id, created_at desc);

alter table public.gifts enable row level security;
revoke all on table public.gifts from anon, authenticated;
