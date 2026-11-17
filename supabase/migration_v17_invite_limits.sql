-- Invite view limits + one-time couple name changes.
-- Run in Supabase SQL Editor (or via migration runner). Safe to re-run.

alter table public.weddings
  add column if not exists groom_name_changes integer not null default 0,
  add column if not exists bride_name_changes integer not null default 0,
  add column if not exists names_locked_at timestamptz;

alter table public.guests
  add column if not exists view_count integer not null default 0;

create table if not exists public.guest_views (
  guest_id uuid not null references public.guests (id) on delete cascade,
  view_key text not null,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (guest_id, view_key)
);

-- This table is written only by the service-role RPC. No client key should
-- read it, so enable RLS with no policies and revoke direct grants.
alter table public.guest_views enable row level security;
revoke all on table public.guest_views from anon, authenticated;
grant all on table public.guest_views to service_role;

create index if not exists guest_views_guest_id_idx
  on public.guest_views (guest_id);

-- Increments one row per browser/device key, then returns total unique views.
create or replace function public.track_guest_view(
  p_guest_id uuid,
  p_view_key text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.guest_views (guest_id, view_key)
  values (p_guest_id, p_view_key)
  on conflict (guest_id, view_key)
  do update set last_seen = now();

  select count(*)::integer
    into v_count
    from public.guest_views
   where guest_id = p_guest_id;

  update public.guests
     set view_count = v_count
   where id = p_guest_id;

  return v_count;
end;
$$;

revoke all on function public.track_guest_view(uuid, text) from public;
grant execute on function public.track_guest_view(uuid, text) to service_role;
