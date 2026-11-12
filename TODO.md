# Danh sách việc cần hoàn thiện & xác nhận trước phát hành (TODO)

Tài liệu tổng hợp các mục tạm thời/placeholder cần chủ dự án xác nhận hoặc bổ sung cho **Kim Hỷ** (giao diện trang chủ `/`, trang xem thử `/mau/[templateId]`, kho mẫu `templates/` và trang thiệp live `/w/[slug]`, `/m/[slug]`).

---

## 1. Trạng thái kho mẫu thiệp (`templates/`)
- [x] `basic-1` (**Vườn Ô Liu** — Gói Miễn phí): Bố cục phong bì sáp olive giữ nguyên hành vi gốc, hỗ trợ xem thử trong khung điện thoại (`contained`) và live.
- [x] `basic-2` (**Trắng Ngà Tối Giản** — Gói Miễn phí): Bố cục tạp chí sáng sủa trên nền kem ngà `#FAF7F0` & champagne, có bìa mở thiệp, lịch tiệc, đếm ngược, gallery phóng to, RSVP/lời chúc.
- [x] `basic-3` (**Ánh Nắng Hoàng Hôn** — Gói Miễn phí): Tông hồng cát & rượu vang `#7A3535`, khung ảnh vòm cổ điển, có bìa mở thiệp, lịch tiệc, gallery, RSVP/lời chúc.
- [x] `pro-1` (**Nhung Đen Ánh Kim** — Gói Pro): Nền nhung tối `#0B0B0B` & chữ vàng `#D4AF37`, hiệu ứng mở thiệp rèm đôi hai cánh (hỗ trợ `prefers-reduced-motion`).
- [ ] `vip-1` (**Ngọc Lục Bảo Độc Quyền** — Gói VIP): Hiện để ở trạng thái **placeholder** (`isPlaceholder: true`, hiển thị nhãn `"Sắp có"`, chưa tạo component riêng và chưa có `public/templates/vip-1/cover.webp`).

---

## 2. Giá trị tạm / cần xác nhận trước khi mở bán (`config/`)
- [ ] **`config/site.ts`**: Xác nhận `SITE_NAME` (`"Kim Hỷ"`), `SITE_EMAIL` (`"lienhe@kimhy.example"` -> đổi sang email tên miền thật), và `NEXT_PUBLIC_SITE_URL` / `APP_BASE_URL` cho canonical/OG.
- [ ] **`config/pricing.ts`**: Chốt giá chính thức của **Gói Tiêu chuẩn (Pro)** (hiện ghi `199.000đ` dự kiến) và **Gói Cao cấp (VIP)** (hiện ghi `399.000đ` dự kiến). Cập nhật lại các dòng đánh dấu `comingSoon: true` khi tính năng hoàn thiện.
- [ ] **`config/bank.ts`**: Điền `bankName`, `accountNumber`, `accountHolder`, `branch` thật trong `BANK_TRANSFER_INFO` (hiện để rỗng và hiển thị `"Đang cập nhật (TODO)"` trong modal `"Thanh toán chuyển khoản"`).
- [ ] **Thanh toán & kích hoạt gói (Backend giai đoạn sau)**: Modal `"Thanh toán chuyển khoản"` hiện chỉ hiển thị thông tin + mã đơn tạm ở client, chưa kết nối API đối soát chuyển khoản hoặc tự nâng cấp `plan` trên Supabase.
- [ ] **Nội dung pháp lý**: Cập nhật văn bản chính thức cho `/chinh-sach-bao-mat` (`app/chinh-sach-bao-mat/page.tsx`) và `/dieu-khoan-su-dung` (`app/dieu-khoan-su-dung/page.tsx`).

---

## 3. Tài nguyên đa phương tiện & ảnh bìa mẫu (`public/`)
- [x] `public/templates/basic-1/cover.webp`, `basic-2/cover.webp`, `basic-3/cover.webp`: Ảnh minh họa bìa tỉ lệ 3:4 (`600x800`).
- [ ] `public/templates/pro-1/cover.webp`: Hiện sử dụng ảnh vector Art Deco dựng tạm (`600x800` WebP) do chạm hạn mức tạo ảnh; cân nhắc tạo lại bằng AI hoặc ảnh chụp sản phẩm thật khi cần.
- [ ] `public/templates/vip-1/cover.webp`: Chưa có ảnh — đang dùng card fallback tối kèm viền kim loại & nhãn `"Sắp có"`.
- [ ] `content/demo.ts`: Dữ liệu cô dâu/chú rể/lịch tiệc mẫu đang dùng lại bộ ảnh trong `public/photos/*`, QR mẫu `/images/gift-qr.png` và nhạc `/media/wedding.mp3`. Có thể thay bằng nhạc và bộ ảnh demo riêng cho từng mẫu nếu muốn.
- [ ] `public/photos/*`, `public/images/gift-qr.png`, `public/media/wedding.mp3`: Kiểm tra bản quyền nhạc nền & thay ảnh mặc định bằng bộ ảnh thương hiệu trước khi quảng bá công khai.

---

## 4. Hệ màu, Font chữ & Kiểm tra tương phản WCAG (`lib/theme.ts`, `app/globals.css`, `app/layout.tsx`)

### Bộ font (`app/layout.tsx`, hỗ trợ tiếng Việt đầy đủ)
- **Tiêu đề (`--font-display`)**: `Cormorant Garamond` (weights 400, 500, 600, 700, regular & italic; nhãn in hoa dùng `tracking-[0.12em]`–`0.2em`).
- **Nội dung & nút bấm (`--font-sans`)**: `Be Vietnam Pro` (weights 300–700).

### Hệ màu tối-vàng (`landingTheme` trong `lib/theme.ts`) & Kết quả đo độ tương phản WCAG 2.1
(Đo bằng công thức relative luminance chuẩn W3C WCAG 2.1; yêu cầu chữ tối thiểu `>= 4.5:1`)

| Cặp màu (Chữ / Thành phần trên Nền) | Mã Hex | Tỉ lệ đo được | Mục đích & Trạng thái |
| :--- | :--- | :---: | :--- |
| `textBody` trên `bg` | `#E8DFC8` / `#0B0B0B` | **14.83:1** | Chữ nội dung trên nền chính — Đạt (`>= 4.5:1`) |
| `textBody` trên `surface` | `#E8DFC8` / `#151515` | **13.76:1** | Chữ nội dung trên thẻ/bảng — Đạt (`>= 4.5:1`) |
| `textBody` trên `surfaceHover` | `#E8DFC8` / `#1E1E1E` | **12.56:1** | Chữ khi hover thẻ/dòng — Đạt (`>= 4.5:1`) |
| `textMuted` trên `bg` | `#A89F86` / `#0B0B0B` | **7.47:1** | Chữ phụ trên nền chính — Đạt (`>= 4.5:1`) |
| `textMuted` trên `surface` | `#A89F86` / `#151515` | **6.93:1** | Chữ phụ trên thẻ/bảng — Đạt (`>= 4.5:1`) |
| `textMuted` trên `surfaceHover` | `#A89F86` / `#1E1E1E` | **6.33:1** | Chữ phụ khi hover — Đạt (`>= 4.5:1`) |
| `gold` trên `bg` | `#D4AF37` / `#0B0B0B` | **9.36:1** | Tiêu đề, chữ nhấn trên nền chính — Đạt (`>= 4.5:1`) |
| `gold` trên `surface` | `#D4AF37` / `#151515` | **8.68:1** | Tiêu đề trên thẻ/bảng — Đạt (`>= 4.5:1`) |
| `gold` trên `surfaceHover` | `#D4AF37` / `#1E1E1E` | **7.93:1** | Tiêu đề/nút viền khi hover — Đạt (`>= 4.5:1`) |
| `gold` trên `goldTint` | `#D4AF37` / `#221D11` | **7.98:1** | Nhãn/nút nhấn nền tối ánh vàng — Đạt (`>= 4.5:1`) |
| Chữ đen trên nút vàng (`bg` / `gold`) | `#0B0B0B` / `#D4AF37` | **9.36:1** | Nút CTA chính — Đạt (`>= 4.5:1`) |
| `freeBadgeText` trên `freeBadgeBg` | `#A5C6BE` / `#182421` | **8.70:1** | Nhãn `"Miễn phí"` — Đạt (`>= 4.5:1`) |
| `soonBadgeText` trên `soonBadgeBg` | `#C2BDB4` / `#222222` | **8.51:1** | Nhãn `"Sắp có"` — Đạt (`>= 4.5:1`) |
| `goldSoft` trên `bg` | `#8C7A3F` / `#0B0B0B` | **4.66:1** | Viền nhạt / icon phụ trên `#0B0B0B` — Đạt (`>= 4.5:1`) |
| `goldSoft` trên `surface` | `#8C7A3F` / `#151515` | **4.32:1** | Chỉ dùng cho viền (`border`) / icon trang trí (`>= 3.0:1`), không dùng cho chữ |
