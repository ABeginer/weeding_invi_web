-- Thêm cột checked_in_at và checked_in_count phục vụ tính năng Mobile QR Check-in & Real-Time Arrival Tracking
ALTER TABLE guests ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS checked_in_count integer DEFAULT 1;

-- Index hỗ trợ lọc và thống kê khách đã check-in theo tiệc cưới
CREATE INDEX IF NOT EXISTS guests_checked_in_at_idx ON guests (wedding_id, checked_in_at);
