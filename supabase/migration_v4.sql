alter table public.guests add column if not exists plus_ones int not null default 0 check (plus_ones between 0 and 10);
alter table public.guests add column if not exists diet text check (diet in ('meat', 'veg'));
alter table public.photos drop constraint if exists photos_kind_check;
alter table public.photos add constraint photos_kind_check check (kind in ('banner', 'couple', 'gallery', 'og', 'gift'));
