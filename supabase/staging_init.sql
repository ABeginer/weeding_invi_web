-- ==============================================================================
-- INVIWEDD — STAGING & FRESH DATABASE INITIALIZATION SCRIPT (staging_init.sql)
-- ==============================================================================
-- Tổng hợp toàn bộ các bảng, index, constraints, functions, triggers và RLS
-- từ các migration:
--   - supabase/migration_v2.sql (Base schema: users, weddings, guests, wishes, photos)
--   - supabase/migration_v3.sql (events, guest_events)
--   - supabase/migration_v4.sql (plus_ones, diet, photos.kind)
--   - supabase/migration_v5.sql (users.theme)
--   - supabase/migration_v10_ops.sql (weddings.suspended, audit_logs)
--   - supabase/migration_v11_guest_preferences.sql (song_request, ride_needed)
--   - supabase/migration_v12_gifts.sql (gifts - Sổ mừng cưới)
--   - supabase/migration_v13_album_kind.sql (photos.kind 'album')
--   - supabase/migration_v14_designer.sql (designer_templates, versions, assets)
--   - supabase/migration_v15_designer_versions.sql (weddings designer pinning)
--   - supabase/migration_v16_ops_roles_template_meta.sql (ops_members, display_title)
--   - supabase/migration_v17_invite_limits.sql (name changes, view_count, track_guest_view_open)
--   - supabase/migration_v18_wish_once.sql (author_key, approved, one wish per author)
--   - supabase/migrations/20261114_strategic_upgrade.sql (pronouns, table_number, dietary_preference)
--   - supabase/migrations/20261119_guest_check_in.sql (checked_in_at, checked_in_count)
--   - Production orders & bank_transactions tables (VietQR & Bank Webhook)
--
-- Đặc điểm:
--   1. Sử dụng IF NOT EXISTS cho tất cả các bảng, cột, index để chạy an toàn
--      trên cả cơ sở dữ liệu Supabase hoàn toàn mới và DB hiện hữu.
--   2. Thứ tự khởi tạo tuân thủ chặt chẽ quan hệ Foreign Key (không bị lỗi dependency).
--   3. Bật RLS và thu hồi quyền từ anon/authenticated (Zero Trust model - Backend service-role).
-- ==============================================================================

-- 0. EXTENSIONS
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. USERS (Tài khoản người dùng liên kết Auth0 sub)
-- ==============================================================================
create table if not exists public.users (
  id text primary key,
  email text,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  created_at timestamptz not null default now()
);

alter table public.users add column if not exists email text;
alter table public.users add column if not exists theme text not null default 'light' check (theme in ('light', 'dark'));
alter table public.users add column if not exists created_at timestamptz not null default now();

alter table public.users enable row level security;
revoke all on table public.users from anon, authenticated;

-- ==============================================================================
-- 2. DESIGNER TEMPLATES & ASSETS (Hệ thống thiết kế mẫu thiệp)
-- ==============================================================================
create table if not exists public.designer_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  display_title text check (display_title is null or char_length(display_title) between 2 and 80),
  plan text not null default 'free' check (plan in ('free', 'pro', 'vip')),
  ritual text check (ritual is null or char_length(ritual) <= 40),
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  version integer not null default 1,
  canvas_json jsonb not null default '{}'::jsonb,
  background_key text,
  snapshot_key text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.designer_templates add column if not exists display_title text;
alter table public.designer_templates drop constraint if exists designer_templates_display_title_check;
alter table public.designer_templates add constraint designer_templates_display_title_check
  check (display_title is null or char_length(display_title) between 2 and 80);

create index if not exists designer_templates_status_idx
  on public.designer_templates (status, updated_at desc);

alter table public.designer_templates enable row level security;
revoke all on public.designer_templates from anon, authenticated;

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

alter table public.designer_template_versions enable row level security;
revoke all on public.designer_template_versions from anon, authenticated;

create table if not exists public.designer_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('photo', 'png', 'svg', 'background', 'snapshot')),
  r2_key text not null unique,
  width integer,
  height integer,
  uploaded_by text,
  created_at timestamptz not null default now()
);

alter table public.designer_assets enable row level security;
revoke all on public.designer_assets from anon, authenticated;

-- ==============================================================================
-- 3. OPS MEMBERS & AUDIT LOGS (Phân quyền quản trị nội bộ & Nhật ký audit)
-- ==============================================================================
create table if not exists public.ops_members (
  email text primary key,
  role text not null check (role in ('admin', 'designer')),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ops_members_email_lowercase check (email = lower(email)),
  constraint ops_members_email_length check (char_length(email) between 3 and 254)
);

comment on table public.ops_members is
  'Vai trò ops theo email. Email nằm trong ADMIN_EMAIL/ADMIN_EMAILS luôn là admin (không thể hạ quyền).';

alter table public.ops_members enable row level security;
revoke all on public.ops_members from anon, authenticated;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  reason text not null check (char_length(btrim(reason)) >= 5),
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx
  on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;
revoke all on table public.audit_logs from anon, authenticated;

-- ==============================================================================
-- 4. WEDDINGS (Thiệp cưới)
-- ==============================================================================
create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  template_id text not null default 'basic-1',
  plan text not null default 'free' check (plan in ('free', 'pro', 'vip')),
  content jsonb not null default '{}'::jsonb,
  suspended boolean not null default false,
  designer_template_id uuid references public.designer_templates(id) on delete set null,
  designer_template_version integer,
  groom_name_changes integer not null default 0,
  bride_name_changes integer not null default 0,
  names_locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.weddings add column if not exists suspended boolean not null default false;
alter table public.weddings add column if not exists designer_template_id uuid references public.designer_templates(id) on delete set null;
alter table public.weddings add column if not exists designer_template_version integer;
alter table public.weddings add column if not exists groom_name_changes integer not null default 0;
alter table public.weddings add column if not exists bride_name_changes integer not null default 0;
alter table public.weddings add column if not exists names_locked_at timestamptz;

create index if not exists weddings_owner_idx
  on public.weddings (owner_id);
create index if not exists weddings_designer_template_idx
  on public.weddings (designer_template_id);

alter table public.weddings enable row level security;
revoke all on table public.weddings from anon, authenticated;

-- ==============================================================================
-- 5. EVENTS & GUEST_EVENTS (Lịch trình tiệc cưới & Phân bổ sự kiện cho khách)
-- ==============================================================================
create table if not exists public.events (
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

create index if not exists events_wedding_idx
  on public.events (wedding_id, position);

alter table public.events enable row level security;
revoke all on table public.events from anon, authenticated;

-- ==============================================================================
-- 6. GUESTS (Danh sách khách mời & Trạng thái phản hồi / Check-in)
-- ==============================================================================
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) check (slug ~ '^[a-f0-9]{12}$'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  responded_at timestamptz,
  plus_ones int not null default 0 check (plus_ones between 0 and 10),
  diet text check (diet in ('meat', 'veg')),
  dietary_preference text check (dietary_preference in ('standard', 'vegetarian')),
  relationship_group text check (relationship_group in ('elder', 'peer_formal', 'close_friend', 'family')),
  custom_pronoun_host text check (custom_pronoun_host is null or char_length(custom_pronoun_host) <= 60),
  custom_pronoun_guest text check (custom_pronoun_guest is null or char_length(custom_pronoun_guest) <= 60),
  table_number text check (table_number is null or char_length(table_number) <= 40),
  song_request text check (song_request is null or char_length(song_request) <= 200),
  ride_needed boolean not null default false,
  view_count integer not null default 0,
  checked_in_at timestamptz,
  checked_in_count integer default 1,
  created_at timestamptz not null default now()
);

alter table public.guests add column if not exists plus_ones int not null default 0 check (plus_ones between 0 and 10);
alter table public.guests add column if not exists diet text check (diet in ('meat', 'veg'));
alter table public.guests add column if not exists dietary_preference text check (dietary_preference in ('standard', 'vegetarian'));
alter table public.guests add column if not exists relationship_group text check (relationship_group in ('elder', 'peer_formal', 'close_friend', 'family'));
alter table public.guests add column if not exists custom_pronoun_host text check (custom_pronoun_host is null or char_length(custom_pronoun_host) <= 60);
alter table public.guests add column if not exists custom_pronoun_guest text check (custom_pronoun_guest is null or char_length(custom_pronoun_guest) <= 60);
alter table public.guests add column if not exists table_number text check (table_number is null or char_length(table_number) <= 40);
alter table public.guests add column if not exists song_request text check (song_request is null or char_length(song_request) <= 200);
alter table public.guests add column if not exists ride_needed boolean not null default false;
alter table public.guests add column if not exists view_count integer not null default 0;
alter table public.guests add column if not exists checked_in_at timestamptz;
alter table public.guests add column if not exists checked_in_count integer default 1;

-- Backfill dietary_preference từ diet nếu đã tồn tại dữ liệu
update public.guests
  set dietary_preference = case when diet = 'veg' then 'vegetarian' else 'standard' end
  where dietary_preference is null and diet is not null;

create index if not exists guests_wedding_idx
  on public.guests (wedding_id);
create index if not exists guests_table_number_idx
  on public.guests (wedding_id, table_number);
create index if not exists guests_checked_in_at_idx
  on public.guests (wedding_id, checked_in_at);

-- Trigger cập nhật responded_at khi khách phản hồi
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

-- Hàm RPC tăng lượt mở thiệp cá nhân (+1 view_count)
create or replace function public.track_guest_view_open(p_guest_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.guests
     set view_count = view_count + 1
   where id = p_guest_id
  returning view_count;
$$;

revoke all on function public.track_guest_view_open(uuid) from public;
grant execute on function public.track_guest_view_open(uuid) to service_role;

alter table public.guests enable row level security;
revoke all on table public.guests from anon, authenticated;

-- Bảng liên kết khách - sự kiện
create table if not exists public.guest_events (
  guest_id uuid not null references public.guests (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  primary key (guest_id, event_id)
);

alter table public.guest_events enable row level security;
revoke all on table public.guest_events from anon, authenticated;

-- ==============================================================================
-- 7. WISHES (Lời chúc từ khách mời)
-- ==============================================================================
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_id uuid references public.guests (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  message text not null check (char_length(btrim(message)) between 1 and 500),
  author_key text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.wishes add column if not exists author_key text;
alter table public.wishes add column if not exists approved boolean not null default false;

create index if not exists wishes_wedding_idx
  on public.wishes (wedding_id, created_at desc);
create unique index if not exists wishes_one_per_author_idx
  on public.wishes (wedding_id, author_key);
create index if not exists wishes_wedding_approved_idx
  on public.wishes (wedding_id, approved, created_at desc);

alter table public.wishes enable row level security;
revoke all on table public.wishes from anon, authenticated;

-- ==============================================================================
-- 8. PHOTOS (Ảnh cưới & Album khách chụp)
-- ==============================================================================
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  kind text not null,
  storage_key text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.photos drop constraint if exists photos_kind_check;
alter table public.photos add constraint photos_kind_check
  check (kind in ('banner', 'couple', 'gallery', 'og', 'gift', 'album'));

create index if not exists photos_wedding_idx
  on public.photos (wedding_id, kind, position);

alter table public.photos enable row level security;
revoke all on table public.photos from anon, authenticated;

-- ==============================================================================
-- 9. GIFTS (Sổ mừng cưới)
-- ==============================================================================
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

-- ==============================================================================
-- 10. ORDERS (Đơn nâng cấp gói dịch vụ Pro/VIP)
-- ==============================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6,20}$'),
  user_id text not null references public.users (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  plan text not null check (plan in ('pro', 'vip')),
  amount_vnd bigint not null check (amount_vnd >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  payos_order_code bigint,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists payos_order_code bigint;
create unique index if not exists orders_payos_order_code_idx
  on public.orders (payos_order_code) where payos_order_code is not null;

create index if not exists orders_wedding_idx
  on public.orders (wedding_id, created_at desc);
create index if not exists orders_user_idx
  on public.orders (user_id, created_at desc);
create index if not exists orders_code_idx
  on public.orders (code);
create index if not exists orders_status_idx
  on public.orders (status, created_at desc);

alter table public.orders enable row level security;
revoke all on table public.orders from anon, authenticated;

-- ==============================================================================
-- 11. BANK TRANSACTIONS (Biến động số dư & Webhook thanh toán)
-- ==============================================================================
create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique check (char_length(ref) between 1 and 200),
  amount_vnd bigint not null check (amount_vnd >= 0),
  description text not null default '' check (char_length(description) <= 500),
  received_at timestamptz not null,
  matched_order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists bank_transactions_ref_idx
  on public.bank_transactions (ref);
create index if not exists bank_transactions_received_at_idx
  on public.bank_transactions (received_at desc);
create index if not exists bank_transactions_matched_order_idx
  on public.bank_transactions (matched_order_id);

alter table public.bank_transactions enable row level security;
revoke all on table public.bank_transactions from anon, authenticated;

-- ==============================================================================
-- 12. PERFORMANCE & SCALABILITY INDEXES (2026-11-20)
-- ==============================================================================
create index if not exists guests_wedding_created_idx
  on public.guests (wedding_id, created_at desc);

create index if not exists guests_wedding_status_idx
  on public.guests (wedding_id, status);

create index if not exists wishes_guest_idx
  on public.wishes (guest_id);

create index if not exists wishes_wedding_approved_created_idx
  on public.wishes (wedding_id, approved, created_at desc);

create index if not exists guest_events_event_idx
  on public.guest_events (event_id);

create index if not exists weddings_owner_created_idx
  on public.weddings (owner_id, created_at desc);

create index if not exists photos_wedding_position_idx
  on public.photos (wedding_id, position asc);

create index if not exists orders_wedding_created_idx
  on public.orders (wedding_id, created_at desc);

-- ==============================================================================
-- HOÀN TẤT KHỞI TẠO CƠ SỞ DỮ LIỆU INVIWEDD
-- ==============================================================================
