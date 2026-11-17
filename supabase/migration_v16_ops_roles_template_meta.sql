-- V16: phân quyền ops (admin/designer) + title hiển thị cho khách của mẫu designer.
-- Chạy trong Supabase SQL Editor sau migration_v15. An toàn khi chạy lại.

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

-- Title khách hàng thấy khi chọn mẫu (name vẫn là tên thiết kế nội bộ).
alter table public.designer_templates
  add column if not exists display_title text;

alter table public.designer_templates
  drop constraint if exists designer_templates_display_title_check;

alter table public.designer_templates
  add constraint designer_templates_display_title_check
  check (display_title is null or char_length(display_title) between 2 and 80);
