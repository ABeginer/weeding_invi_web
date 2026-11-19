-- v18: mỗi người chỉ có MỘT lời chúc cho mỗi thiệp + duyệt lời chúc lên thiệp
--
-- author_key:
--   'guest:<guest_id>'  → khách có link riêng
--   'anon:<uuid>'       → khách vào bằng link chung (uuid lưu ở localStorage)
--
-- approved: lời chúc đã được chủ thiệp duyệt để hiện lên thiệp chưa.

alter table public.wishes
  add column if not exists author_key text,
  add column if not exists approved boolean not null default false;

-- Gộp dữ liệu cũ: giữ lại lời chúc MỚI NHẤT của mỗi tác giả.
with ranked as (
  select
    id,
    row_number() over (
      partition by wedding_id, coalesce('guest:' || guest_id::text, 'anon:' || id::text)
      order by created_at desc
    ) as rn
  from public.wishes
)
delete from public.wishes w
using ranked r
where w.id = r.id and r.rn > 1;

update public.wishes
set author_key = 'guest:' || guest_id::text
where author_key is null and guest_id is not null;

update public.wishes
set author_key = 'anon:' || id::text
where author_key is null;

create unique index if not exists wishes_one_per_author_idx
  on public.wishes (wedding_id, author_key);

create index if not exists wishes_wedding_approved_idx
  on public.wishes (wedding_id, approved, created_at desc);
