-- ==============================================================================
-- INVIWEDD PERFORMANCE & SCALABILITY INDEXES
-- Migration: 20261120_performance_indexes.sql
-- Mục tiêu: Khử bỏ toàn bộ Table Scan trên các luồng mở thiệp và quản lý khách mời
-- An toàn khi chạy lại nhiều lần (IF NOT EXISTS).
-- ==============================================================================

-- 1. Tối ưu bảng GUESTS (Hot path quản lý khách và check-in)
-- Phục vụ truy vấn phân trang danh sách khách mời theo tiệc cưới
CREATE INDEX IF NOT EXISTS guests_wedding_created_idx 
ON public.guests (wedding_id, created_at DESC);

-- Phục vụ bộ lọc 2 tầng theo trạng thái RSVP
CREATE INDEX IF NOT EXISTS guests_wedding_status_idx 
ON public.guests (wedding_id, status);

-- 2. Tối ưu bảng WISHES (Hot path xem và gửi lời chúc)
-- Phục vụ tra cứu lời chúc cũ của khách mời để chỉnh sửa
CREATE INDEX IF NOT EXISTS wishes_guest_idx 
ON public.wishes (guest_id);

-- Phục vụ tra cứu lời chúc đã duyệt hiển thị lên thiệp
CREATE INDEX IF NOT EXISTS wishes_wedding_approved_created_idx 
ON public.wishes (wedding_id, approved, created_at DESC);

-- 3. Tối ưu bảng GUEST_EVENTS (Liên kết khách mời & buổi lễ)
-- Phục vụ ON DELETE CASCADE khi xóa buổi lễ và tra cứu khách theo buổi lễ
CREATE INDEX IF NOT EXISTS guest_events_event_idx 
ON public.guest_events (event_id);

-- 4. Tối ưu bảng WEDDINGS (Danh sách thiệp của người dùng trong Dashboard)
-- Phục vụ truy vấn danh sách tiệc cưới của chủ tài khoản
CREATE INDEX IF NOT EXISTS weddings_owner_created_idx 
ON public.weddings (owner_id, created_at DESC);

-- 5. Tối ưu bảng PHOTOS (Danh sách ảnh hiển thị trên thiệp)
-- Phục vụ truy vấn lấy toàn bộ ảnh theo thứ tự hiển thị
CREATE INDEX IF NOT EXISTS photos_wedding_position_idx 
ON public.photos (wedding_id, position ASC);

-- 6. Tối ưu bảng ORDERS & BANK_TRANSACTIONS (Giao dịch nạp tiền & đối soát)
CREATE INDEX IF NOT EXISTS orders_wedding_created_idx 
ON public.orders (wedding_id, created_at DESC);

CREATE INDEX IF NOT EXISTS bank_transactions_matched_order_idx 
ON public.bank_transactions (matched_order_id);
