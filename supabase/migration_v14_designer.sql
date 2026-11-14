-- Designer templates (P1): layout JSON + ảnh nền webp, chạy trong Supabase SQL Editor.
-- An toàn khi chạy lại.

create table if not exists public.designer_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  plan text not null default 'free' check (plan in ('free', 'pro', 'vip')),
  ritual text check (ritual is null or char_length(ritual) <= 40),
  status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'archived')),
  version integer not null default 1,
  canvas_json jsonb not null default '{}'::jsonb,
  background_key text,
  snapshot_key text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.designer_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.designer_templates(id) on delete cascade,
  version integer not null,
  canvas_json jsonb not null,
  background_key text,
  snapshot_key text,
  published_at timestamptz not null default now(),
  unique (template_id, version)
);

create table if not exists public.designer_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('photo', 'png', 'svg', 'background', 'snapshot')),
  r2_key text not null unique,
  width integer,
  height integer,
  uploaded_by text,
  created_at timestamptz not null default now()
);

create index if not exists designer_templates_status_idx
  on public.designer_templates (status, updated_at desc);

alter table public.designer_templates enable row level security;
alter table public.designer_template_versions enable row level security;
alter table public.designer_assets enable row level security;

revoke all on public.designer_templates from anon, authenticated;
revoke all on public.designer_template_versions from anon, authenticated;
revoke all on public.designer_assets from anon, authenticated;
