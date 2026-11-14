# 01. Hệ Thống Thiết Kế (Design System) — Tơ Duyên Đỏ Đậm

> **Reference Link:** [https://chungdoi.com/vi/mau-thiep/to-duyen-do-dam/demo](https://chungdoi.com/vi/mau-thiep/to-duyen-do-dam/demo)

---

## 1. Bảng Màu Chuẩn (Color Palette)

| Vai trò thiết kế | Mã Hex / RGBA | Mô tả & Cách ứng dụng |
| :--- | :--- | :--- |
| **Primary Velvet Wine Red** | `#931434` | Màu nền chính toàn bộ trang thiệp, mang sắc đỏ rượu vang nhung quý phái. |
| **Deep Burgundy Contrast** | `#460011` / `#4A0A19` | Màu đỏ mận thẫm dùng cho bóng đổ thẻ, viền nhấn và nền nút tương phản cao. |
| **Warm Ivory / Silk Cream** | `#FEFBF4` / `#F3DFC3` | Màu chữ chính, viền bo thẻ, dải lụa mỏng và nền thẻ thông tin. |
| **Muted Velvet Rose** | `#752E3F` / `#913B51` | Màu trung chuyển giữa đỏ rượu và nền tối, dùng cho viền phụ. |
| **Accent Glow** | `#93143455` | Lớp ánh sáng phát quang mờ phía sau hình ảnh và nút bấm. |
| **Subtext Opacity** | `rgba(255, 255, 255, 0.7)` | Màu chữ mô tả thời gian, ngày âm lịch và phụ đề. |

---

## 2. Hệ Thống Typography (Font Chữ)

Mẫu thiệp này sử dụng font script có nét bút bay bổng và lượn sóng như dải lụa mềm mại:

### A. Tên Cặp Đôi (Couple Names Script)
- **Font:** `The Nautigal` hoặc `Carattere` (Google Fonts)
- **Link Google Fonts:** `https://fonts.googleapis.com/css2?family=Carattere&family=The+Nautigal:wght@400;700&display=swap`
- **Thông số:** Size 42px – 56px, nét thanh mảnh uốn lượn tự nhiên, màu `#FEFBF4` hoặc `#F3DFC3`.

### B. Tiêu Đề Nghi Lễ (Headings & Subtitles)
- **Font:** `Baskerville`, `Lora` hoặc `EB Garamond`
- **Link Google Fonts:** `https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap`
- **Thông số:** Size 18px – 22px, in hoa (`uppercase`), letter-spacing `0.15em`, màu kem `#FEFBF4`.

### C. Nội Dung Thể Hiện (Body Text)
- **Font:** `Lora` kết hợp `Montserrat`
- **Thông số:** Size 13px – 15px, line-height 1.6, màu `rgba(255, 255, 255, 0.85)`.

---

## 3. Họa Tiết Đồ Họa Cốt Lõi (Key Graphic Assets)

1. **Dải lụa tơ duyên (Silk Ribbon Motif):**
   - Dải lụa đỏ uốn lượn mềm mại kết nối các phần nội dung của thiệp (`ribbon-decoration.webp`).
   - Đường viền uốn lượn mảnh màu vàng kem (`line-decoration.webp`).
2. **Hoa Phong Quỳ (Anemone Floral Accent):**
   - Họa tiết hoa phong quỳ viền đỏ nhung và hồng khói đặt ở 4 góc thiệp và đầu thẻ sự kiện.
3. **Bộ Icon Tiệc Tối Lãng Mạn:**
   - 🕯️ **Nến thơm lãng mạn:** Lễ gia tiên và đón khách.
   - 💍 **Nhẫn cưới kim cương:** Nghi thức thành hôn và trao nhẫn.
   - 🍷 **Ly rượu vang sóng sánh:** Rót rượu khai tiệc và chúc mừng.
   - 🎂 **Bánh cưới hoa lụa:** Cắt bánh tình yêu.

---

## 4. Kích Thước & Khung Hiển Thị
- Chiều rộng tối đa (Max Width): `480px` (chuẩn giao diện mobile).
- Hiệu ứng viền nổi trên desktop: bóng mờ sẫm `box-shadow: 0 20px 40px rgba(70, 0, 17, 0.6)`.

