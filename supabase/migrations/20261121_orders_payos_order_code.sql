-- ==============================================================================
-- MIGRATION: BỔ SUNG CỘT PAYOS_ORDER_CODE VÀO BẢNG ORDERS
-- Mục đích: Lưu liên kết số nguyên dương orderCode của payOS và tối ưu tra cứu
-- Ngày tạo: 2026-11-21
-- Tương thích: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Bổ sung cột payos_order_code (bigint) vào bảng public.orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payos_order_code bigint;

-- 2. Tạo unique index cho payos_order_code (chỉ áp dụng với các bản ghi NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payos_order_code
ON public.orders (payos_order_code)
WHERE payos_order_code IS NOT NULL;

-- 3. Cập nhật comment giải thích
COMMENT ON COLUMN public.orders.payos_order_code IS 'Mã số đơn hàng dạng số nguyên dương định danh trên cổng thanh toán payOS';
