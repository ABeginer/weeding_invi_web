# 01. Hệ Thống Thiết Kế (Design System) — Song Hỷ v2 Đỏ

Hệ thống thiết kế này được trích xuất trực tiếp từ bản dựng thực tế của mẫu thiệp `Song Hỷ v2 Đỏ`.

---

## 1. Bảng Màu Chuẩn (Color Palette)

| Tên biến / Vai trò | Mã Hex / RGBA | Ý nghĩa & Vị trí ứng dụng |
| :--- | :--- | :--- |
| **Primary Background (Đỏ Thắm)** | `#920002` / `#990000` | Màu nền chính toàn bộ trang thiệp, phong bì và các khối nội dung. |
| **Dark Red Accent (Đỏ Rượu Đậm)** | `#2F0000` / `#8C0000` | Dùng cho viền khung đậm, chữ nổi trên nền vàng, lớp đổ bóng sâu. |
| **Primary Gold (Vàng Hoàng Gia)** | `#FFE8A4` | Màu chữ tiêu đề chính, nút bấm "MỞ THIỆP", viền bo cong nổi bật. |
| **Soft Peach Gold (Vàng Nhũ Mềm)**| `#FDCB9C` | Đường line phân cách mờ, ký tự hoa văn trang trí `❦`, viền phụ. |
| **Light Cream / Off-White** | `#FFF9E6` (hoặc `rgba(255, 249, 230, 0.85)`) | Màu chữ nội dung (body text), ngày tháng, đoạn mô tả dễ đọc trên nền đỏ. |
| **Card / Glass Surface** | `rgba(255, 255, 255, 0.08)` | Nền mờ kính (glassmorphism) cho thẻ thông tin lễ cưới, đếm ngược, hộp quà. |
| **Border Highlight** | `#FFE8A466` (Alpha 40%) | Viền thẻ sự kiện, viền ảnh chân dung và các khung hình vòm. |
| **Romantic Pink (Trợ sắc)** | `#FB3570` | Điểm nhấn trái tim, trạng thái yêu thích hoặc đính ước. |

---

## 2. Hệ Thống Font Chữ (Typography)

Mẫu thiệp kết hợp hài hòa giữa **Cursive Script mềm mại lãng mạn** cho tên cặp đôi và **Serif cổ điển sang trọng** cho thông tin nghi thức cưới:

### A. Tên Cô Dâu & Chú Rể (Primary Script)
- **Font:** `Carattere` (Google Fonts)
- **Link Google Fonts:** `https://fonts.googleapis.com/css2?family=Carattere&display=swap`
- **Fallback:** `"EB Garamond", "Times New Roman", serif`
- **Thông số:** Size 36px – 48px trên mobile, màu `#FFE8A4`, letter-spacing tự nhiên.
- **Dấu nối "&":** Sử dụng font `Ms Madi` (Google Fonts) hoặc `Carattere` với font-size ~22px ở giữa hai tên.

### B. Tiêu Đề Mục & Thư Ngỏ (Section Headings)
- **Font:** `Pattaya` hoặc `Lora`
- **Link Google Fonts:** `https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Pattaya&display=swap`
- **Thông số:** 
  - Tiêu đề chính (H2): 20px – 24px, In hoa (`uppercase`), font-weight 600, màu `#FFE8A4`.
  - Tiêu đề phụ (H3): 15px – 17px, font-weight 500, màu `#FFF9E6`.

### C. Nội Dung Chi Tiết (Body Text)
- **Font:** `Lora` (Serif) kết hợp `Montserrat` hoặc `Be Vietnam Pro` (Sans-serif)
- **Thông số:** Size 13px – 15px, line-height 1.6, màu `rgba(255, 249, 230, 0.9)`.

---

## 3. Họa Tiết Đồ Họa Cốt Lõi (Traditional Visual Assets)

1. **Biểu tượng chữ "Song Hỷ" (囍 - Double Happiness):**
   - Vị trí: Đỉnh phong bì cover, chính giữa màn hình mở đầu, nền mờ watermark phía sau ảnh cưới.
   - Phong cách: Họa tiết chữ Hỷ đôi mạ vàng với các nét uốn lượn phong cách cung đình.
   - Định dạng khuyên dùng: SVG vector màu `#FFE8A4` hoặc ảnh PNG/WebP trong suốt.

2. **Khung Vòm Cổng Cưới (Hero Arch Shape):**
   - Đường cong vòm kiểu Pháp kết hợp hoa văn Á Đông (`border-radius: 9999px 9999px 0 0`).
   - Đường viền đôi (double border) màu vàng nhạt `rgba(255, 232, 164, 0.5)`.

3. **Họa Tiết Mây Cuộn Truyền Thống (Oriental Cloud / Vân Mây):**
   - Đặt ở 4 góc của thiệp và chân trang.
   - Màu sắc: Vàng mờ (opacity 15% - 25%) để tạo chiều sâu cổ kính không làm rối nội dung.

4. **Bộ Icon Nghi Thức Cưới Cổ Truyền & Hiện Đại:**
   - 💍 **Nhẫn cưới:** Đón khách / Trao nhẫn
   - 🏛️ **Nhà thờ / Cổng hoa:** Nghi thức thành hôn / Lễ Gia Tiên
   - 🥂 **Ly champagne giao bôi:** Khai tiệc & Chúc rượu
   - 🎂 **Bánh cưới:** Cắt bánh & Rót rượu hạnh phúc
   - 🎵 **Nốt nhạc:** Tiệc âm nhạc & Giao lưu

---

## 4. Quy Cách Khung Hiển Thị (Layout Specs)

- **Chiều rộng tối đa (Max Width):** `480px` – chuẩn định dạng màn hình smartphone cao cấp.
- **Nền ngoài desktop:** Thêm lớp viền đổ bóng `box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7)` để khi khách mở trên laptop/máy tính bàn thiệp vẫn căn giữa như một chiếc điện thoại sang trọng.
- **Khoảng đệm (Spacing):** Section padding trung bình `py-10 px-5` (40px trên dưới, 20px hai bên).

