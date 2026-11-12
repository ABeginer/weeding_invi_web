drop table if exists public.wishes cascade;
drop table if exists public.guests cascade;
drop function if exists public.set_responded_at() cascade;

create table public.users (
  id text primary key,
  email text,
  created_at timestamptz not null default now()
);

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  template_id text not null default 'basic-1',
  plan text not null default 'free' check (plan in ('free', 'pro', 'vip')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index weddings_owner_idx on public.weddings (owner_id);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) check (slug ~ '^[a-f0-9]{12}$'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create index guests_wedding_idx on public.guests (wedding_id);

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_id uuid references public.guests (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  message text not null check (char_length(btrim(message)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index wishes_wedding_idx on public.wishes (wedding_id, created_at desc);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  kind text not null check (kind in ('couple', 'gallery', 'banner')),
  storage_key text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index photos_wedding_idx on public.photos (wedding_id, kind, position);

create or replace function public.set_responded_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.responded_at := case when new.status = 'pending' then null else now() end;
  end if;
  return new;
end;
$$;

drop trigger if exists guests_set_responded_at on public.guests;

create trigger guests_set_responded_at
  before update on public.guests
  for each row
  execute function public.set_responded_at();

alter table public.users enable row level security;
alter table public.weddings enable row level security;
alter table public.guests enable row level security;
alter table public.wishes enable row level security;
alter table public.photos enable row level security;

revoke all on table public.users from anon, authenticated;
revoke all on table public.weddings from anon, authenticated;
revoke all on table public.guests from anon, authenticated;
revoke all on table public.wishes from anon, authenticated;
revoke all on table public.photos from anon, authenticated;
