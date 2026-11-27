-- Migration v11: lưu nguyện vọng của khách (bài hát, phương tiện đi lại)
-- Chạy trong Supabase Studio -> SQL Editor. An toàn khi chạy lại.
alter table public.guests
  add column if not exists song_request text
    check (song_request is null or char_length(song_request) <= 200);

alter table public.guests
  add column if not exists ride_needed boolean not null default false;
