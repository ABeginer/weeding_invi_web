# Tài liệu Thiết Kế & Hướng Dẫn Tái Hiện Mẫu Thiệp "Song Hỷ v2 Đỏ" (ChungDoi)

Thư mục này chứa toàn bộ thông số kỹ thuật (Design Specification), hệ thống phong cách (Design System), kiến trúc thành phần (Component Hierarchy), tài nguyên đồ họa (Assets) và mã nguồn mẫu (HTML/CSS/JS) để bạn có thể tự thiết kế lại hoặc phát triển mẫu thiệp cưới **Song Hỷ v2 Đỏ** một cách chuẩn xác và dễ dàng nhất.

---

## 📂 Cấu Trúc Tài Liệu Trong Thư Mục

1. **[01-DESIGN-SYSTEM.md](./01-DESIGN-SYSTEM.md)**:
   - Bảng mã màu chuẩn (Deep Crimson `#920002`, Imperial Gold `#FFE8A4`, Muted Gold `#FDCB9C`, v.v.).
   - Bộ font chữ chuẩn Việt hóa (`Carattere`, `Lora`, `Pattaya`, `EB Garamond`).
   - Họa tiết truyền thống: Chữ Song Hỷ (囍), hoa văn mây (cloud pattern), hoa sen/mẫu đơn trang trí, khung vòm (arch shape).
   - Quy chuẩn kích thước, khoảng cách và đổ bóng (Shadows & Borders).

2. **[02-ARCHITECTURE-AND-SECTIONS.md](./02-ARCHITECTURE-AND-SECTIONS.md)**:
   - Cấu trúc từng phần từ trên xuống dưới (Envelope Cover, Hero, Chú Rể & Cô Dâu, Thông tin Hôn lễ, Thông tin Tiệc cưới, Đếm ngược, Lịch trình ngày cưới, Dress code, Album ảnh cưới, Hộp quà mừng VietQR, Sổ lưu bút).
   - Nội dung chữ mẫu (Copywriting) đúng nghi lễ cưới truyền thống Việt Nam (Lễ Gia Tiên, Lễ Vu Quy, Lễ Thành Hôn, Tiệc Cưới).

3. **[03-INTERACTIONS-AND-TECH-SPEC.md](./03-INTERACTIONS-AND-TECH-SPEC.md)**:
   - Hiệu ứng mở phong bì (Envelope Unfold / Slide-up) và xử lý âm thanh tự động phát (Bypass Autoplay Policy).
   - Bộ đếm ngược ngày cưới (Countdown Timer) theo giờ thực tế.
   - Tính năng "Sao chép số tài khoản" và sinh mã VietQR động theo chuẩn Napas 247.
   - Tích hợp Google Maps Embed và "Thêm vào Google Calendar".
   - Form gửi lời chúc (Guestbook) và form xác nhận tham dự (RSVP).

4. **[song-hy-v2-do-template.html](./song-hy-v2-do-template.html)**:
   - File mã nguồn độc lập hoàn chỉnh (Standalone HTML5 + Tailwind CSS + Vanilla JS).
   - Bạn chỉ cần nhấp đúp để mở trên trình duyệt hoặc mang vào dự án React/Vue/Next.js/WordPress tùy ý.

---

## 🎨 Điểm Nhấn Thiết Kế (Design Highlights)

- **Phong cách:** Traditional Orient Luxury (Cưới truyền thống Á Đông sang trọng).
- **Màu sắc chủ đạo:** Đỏ thắm nhung cưới phối cùng sắc Vàng kim cung đình (Imperial Gold / Pale Gold) giúp thiệp vừa đậm chất hoan hỷ cổ truyền vừa trang nhã, hiện đại.
- **Tỉ lệ hiển thị:** Mobile-first (Tối ưu tuyệt đối trên màn hình điện thoại 375px - 430px khi khách mở từ Zalo, Messenger, SMS).

