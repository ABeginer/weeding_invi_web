-- ==============================================================================
-- SYNC STAGING TO PRODUCTION DATABASE MIGRATION
-- Target Database: Production (xklihgeirdxyormuxcoh)
-- Generated: 2026-11-20
-- Mode: Safe, Additive, Idempotent
--
-- [MANUAL REVIEW REQUIRED] DESTRUCTIVE / CLEANUP OPERATIONS (COMMENTED OUT):
-- The following cleanup operations are non-additive or drop legacy artifacts.
-- They have been safely COMMENTED OUT and preserved below for manual DBA review:
--   1. DROP FUNCTION IF EXISTS public.track_guest_view(uuid, text); -- (Superseded by track_guest_view_open)
--   2. DROP TABLE IF EXISTS public.guest_views; -- (Legacy cookie tracking table, kept for historical analytics)
--   3. DROP TABLE IF EXISTS public.gift_entries; -- (Legacy table name, superseded by public.gifts)
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. TABLES & RLS
-- ==============================================================================

-- Bảng audit_logs phục vụ hệ thống quản trị Ops và ghi log bảo mật
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  reason text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated;

-- ==============================================================================
-- 2. ADDITIVE COLUMNS (IDEMPOTENT WITH SAFE DEFAULTS)
-- ==============================================================================

-- Bảng weddings: kiểm soát tên, trạng thái khoá và ghim designer template
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS designer_template_id uuid REFERENCES public.designer_templates(id) ON DELETE SET NULL;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS designer_template_version integer;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS groom_name_changes integer NOT NULL DEFAULT 0;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS bride_name_changes integer NOT NULL DEFAULT 0;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS names_locked_at timestamptz;

-- Bảng guests: xưng hô, nhóm quan hệ, check-in và bộ đếm view
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS plus_ones integer NOT NULL DEFAULT 0;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS diet text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS song_request text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS ride_needed boolean NOT NULL DEFAULT false;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS relationship_group text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS custom_pronoun_host text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS custom_pronoun_guest text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS table_number text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS dietary_preference text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS checked_in_count integer DEFAULT 1;

-- Bảng wishes: chống spam 1 lời chúc/người và trạng thái duyệt
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS author_key text;
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- Bảng designer_templates: tiêu đề hiển thị thân thiện
ALTER TABLE public.designer_templates ADD COLUMN IF NOT EXISTS display_title text;

-- ==============================================================================
-- 3. CHECK CONSTRAINTS
-- ==============================================================================

-- Đảm bảo photos hỗ trợ đầy đủ 6 loại ảnh (bao gồm 'og' và 'album')
ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_kind_check;
ALTER TABLE public.photos ADD CONSTRAINT photos_kind_check
  CHECK (kind IN ('banner', 'gallery', 'couple', 'og', 'gift', 'album'));

-- ==============================================================================
-- 4. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Hàm đếm lượt mở thiệp riêng /m/<slug> phục vụ hạn ngạch gói Free
CREATE OR REPLACE FUNCTION public.track_guest_view_open(p_guest_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.guests
     SET view_count = view_count + 1
   WHERE id = p_guest_id
  RETURNING view_count;
$$;

REVOKE ALL ON FUNCTION public.track_guest_view_open(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_guest_view_open(uuid) TO service_role;

-- Trigger tự động cập nhật thời gian phản hồi (responded_at) của khách mời
CREATE OR REPLACE FUNCTION public.set_responded_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status <> OLD.status AND NEW.status <> 'pending' AND OLD.status = 'pending' THEN
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guests_set_responded_at ON public.guests;
CREATE TRIGGER guests_set_responded_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.set_responded_at();

-- ==============================================================================
-- 5. PERFORMANCE & SCALABILITY INDEXES (2026-11-20)
-- ==============================================================================

-- Bảng guests: danh sách theo thiệp cưới, bộ lọc trạng thái RSVP, và tra cứu check-in
CREATE INDEX IF NOT EXISTS guests_wedding_created_idx
  ON public.guests (wedding_id, created_at DESC);

CREATE INDEX IF NOT EXISTS guests_wedding_status_idx
  ON public.guests (wedding_id, status);

CREATE INDEX IF NOT EXISTS guests_checked_in_at_idx
  ON public.guests (wedding_id, checked_in_at);

-- Bảng wishes: tra cứu lời chúc đã duyệt, lời chúc theo khách mời, duy nhất 1 lời chúc/người
CREATE INDEX IF NOT EXISTS wishes_wedding_idx
  ON public.wishes (wedding_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS wishes_one_per_author_idx
  ON public.wishes (wedding_id, author_key);

CREATE INDEX IF NOT EXISTS wishes_guest_idx
  ON public.wishes (guest_id);

CREATE INDEX IF NOT EXISTS wishes_wedding_approved_created_idx
  ON public.wishes (wedding_id, approved, created_at DESC);

-- Bảng guest_events: tối ưu hoá liên kết sự kiện và xoá cascade
CREATE INDEX IF NOT EXISTS guest_events_event_idx
  ON public.guest_events (event_id);

-- Bảng weddings: tối ưu hoá danh sách thiệp của chủ tài khoản
CREATE INDEX IF NOT EXISTS weddings_owner_created_idx
  ON public.weddings (owner_id, created_at DESC);

-- Bảng photos: lấy danh sách ảnh theo vị trí hiển thị (album coverflow / gallery)
CREATE INDEX IF NOT EXISTS photos_wedding_position_idx
  ON public.photos (wedding_id, position ASC);

-- Bảng orders & bank_transactions: nạp tiền, đối soát và tìm kiếm theo mã đơn
CREATE INDEX IF NOT EXISTS orders_wedding_created_idx
  ON public.orders (wedding_id, created_at DESC);

CREATE INDEX IF NOT EXISTS bank_transactions_matched_order_idx
  ON public.bank_transactions (matched_order_id);

-- Bảng audit_logs: xem lịch sử thao tác của admin
CREATE INDEX IF NOT EXISTS audit_logs_created_idx
  ON public.audit_logs (created_at DESC);

-- ==============================================================================
-- [MANUAL REVIEW REQUIRED] COMMENTED-OUT DESTRUCTIVE ACTIONS
-- ==============================================================================
-- DROP FUNCTION IF EXISTS public.track_guest_view(uuid, text);
-- DROP TABLE IF EXISTS public.guest_views;
-- DROP TABLE IF EXISTS public.gift_entries;

COMMIT;
