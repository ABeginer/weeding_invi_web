-- Migration v13: cho phép kind 'album' trong bảng photos (Album cho khách)
-- Chạy trong Supabase Studio -> SQL Editor. An toàn khi chạy lại.
alter table public.photos drop constraint if exists photos_kind_check;

alter table public.photos
  add constraint photos_kind_check
  check (kind in ('banner', 'couple', 'gallery', 'og', 'gift', 'album'));
