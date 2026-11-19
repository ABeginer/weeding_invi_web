-- Invite view limits + one-time couple name changes.
-- Run in Supabase SQL Editor (or via migration runner). Safe to re-run.
--
-- Bản rev 2 (2026-11-18): đếm MỖI LƯỢT MỞ, không còn đếm unique theo cookie.
-- Mỗi lần khách mở link cá nhân /m/<slug> là +1, bất kể cùng máy hay khác máy.

alter table public.weddings
  add column if not exists groom_name_changes integer not null default 0,
  add column if not exists bride_name_changes integer not null default 0,
  add column if not exists names_locked_at timestamptz;

alter table public.guests
  add column if not exists view_count integer not null default 0;

-- +1 mỗi lượt mở và trả về tổng số lượt của khách đó.
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

-- Dọn hàm đếm unique của bản cũ nếu trước đó đã chạy (không xoá dữ liệu).
drop function if exists public.track_guest_view(uuid, text);

-- Bảng guest_views của bản cũ (nếu đã tạo) không còn được ghi; để nguyên,
-- không xoá để tránh mất dữ liệu ngoài ý muốn.
