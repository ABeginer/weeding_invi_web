create table public.events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  starts_at timestamptz not null,
  lunar_date text check (char_length(lunar_date) <= 60),
  venue_name text not null check (char_length(btrim(venue_name)) between 1 and 120),
  venue_address text not null check (char_length(venue_address) <= 300),
  map_embed_url text check (char_length(map_embed_url) <= 2000),
  map_directions_url text check (char_length(map_directions_url) <= 2000),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index events_wedding_idx on public.events (wedding_id, position);

create table public.guest_events (
  guest_id uuid not null references public.guests (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  primary key (guest_id, event_id)
);

alter table public.events enable row level security;
alter table public.guest_events enable row level security;
revoke all on table public.events from anon, authenticated;
revoke all on table public.guest_events from anon, authenticated;

