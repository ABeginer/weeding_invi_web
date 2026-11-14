-- Strategic upgrade (2026-11-14): xưng hô theo vai vế, bàn tiệc, thực đơn.
-- Chạy trong Supabase Studio -> SQL Editor. An toàn khi chạy lại.

alter table public.guests
  add column if not exists relationship_group text
    check (relationship_group in ('elder', 'peer_formal', 'close_friend', 'family'));

alter table public.guests
  add column if not exists custom_pronoun_host text
    check (custom_pronoun_host is null or char_length(custom_pronoun_host) <= 60);

alter table public.guests
  add column if not exists custom_pronoun_guest text
    check (custom_pronoun_guest is null or char_length(custom_pronoun_guest) <= 60);

alter table public.guests
  add column if not exists table_number text
    check (table_number is null or char_length(table_number) <= 40);

alter table public.guests
  add column if not exists dietary_preference text
    check (dietary_preference in ('standard', 'vegetarian'));

-- Backfill từ cột diet cũ để không mất dữ liệu đã có.
update public.guests
  set dietary_preference = case when diet = 'veg' then 'vegetarian' else 'standard' end
  where dietary_preference is null;

create index if not exists guests_table_number_idx
  on public.guests (wedding_id, table_number);
