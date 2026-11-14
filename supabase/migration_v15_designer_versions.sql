-- Version-pinned designer templates cho thiệp cưới.
-- Chạy trong Supabase SQL Editor. An toàn khi chạy lại.

alter table public.weddings
  add column if not exists designer_template_id uuid
    references public.designer_templates(id) on delete set null;

alter table public.weddings
  add column if not exists designer_template_version integer;

create index if not exists weddings_designer_template_idx
  on public.weddings (designer_template_id);
