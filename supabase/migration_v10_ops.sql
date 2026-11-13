-- Migration v10: Ops Admin tables and columns
alter table public.weddings add column if not exists suspended boolean not null default false;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  reason text not null check (char_length(btrim(reason)) >= 5),
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;
revoke all on table public.audit_logs from anon, authenticated;

