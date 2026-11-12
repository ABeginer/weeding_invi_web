# Danh sách việc cần hoàn thiện & xác nhận trước phát hành (TODO)

Tài liệu tổng hợp các mục tạm thời/placeholder, kết quả kiểm tra tương phản WCAG 2.1 và cấu hình hạ tầng cần chủ dự án xác nhận cho **Inviwedd** (trang chủ `/`, trang tạo thử `/tao-thiep`, Dashboard `/dashboard`, kho mẫu `/mau/[templateId]`, và thiệp live `/w/[slug]`, `/m/[slug]`).

---

## 1. Trạng thái kho mẫu thiệp (`templates/`)
- [x] `basic-1` (**Vườn Ô Liu** — Gói Miễn phí): Bố cục phong bì sáp olive giữ nguyên bảng màu riêng, hỗ trợ xem thử (`contained`) và live (`/w/*`, `/m/*`), nút Quà mừng & biểu mẫu RSVP kèm người đi cùng/chế độ ăn.
- [x] `basic-2` (**Trắng Ngà Tối Giản** — Gói Miễn phí): Bố cục tạp chí nền kem ngà & champagne, có bìa mở thiệp, lịch tiệc, đếm ngược, gallery phóng to, hộp thoại Quà mừng, RSVP & lời chúc.
- [x] `basic-3` (**Ánh Nắng Hoàng Hôn** — Gói Miễn phí): Tông hồng cát & rượu vang, khung ảnh vòm cổ điển, đầy đủ hộp thoại Quà mừng & RSVP mở rộng.
- [x] `pro-1` (**Nhung Đen Ánh Kim** — Gói Pro): Nền nhung tối `#0B0B0B` & chữ vàng `#D4AF37`, hiệu ứng mở thiệp rèm đôi hai cánh (hỗ trợ `prefers-reduced-motion`), hỗ trợ ảnh QR Quà mừng.
- [ ] `vip-1` (**Ngọc Lục Bảo Độc Quyền** — Gói VIP): Hiện ở trạng thái **placeholder** (`isPlaceholder: true`, hiển thị nhãn `"Sắp có"`, chưa có `public/templates/vip-1/cover.webp`).

---

## 2. Giá trị tạm / cần xác nhận trước khi mở bán (`config/`)
- [ ] **`config/site.ts`**: Xác nhận `SITE_NAME` (`"Inviwedd"`), `SITE_EMAIL` (`"lienhe@inviwedd.example"` -> đổi sang email tên miền thật), và `APP_BASE_URL` / `SITE_URL` / `NEXT_PUBLIC_SITE_URL` để chuẩn hóa canonical & Open Graph URL.
- [ ] **`config/pricing.ts`**: Chốt giá chính thức của **Gói Tiêu chuẩn (Pro)** (hiện ghi `199.000đ` dự kiến) và **Gói Cao cấp (VIP)** (hiện ghi `399.000đ` dự kiến). Cập nhật lại các dòng đánh dấu `comingSoon: true` khi tính năng hoàn thiện.
- [ ] **`config/bank.ts`**: Điền `bankName`, `accountNumber`, `accountHolder`, `branch` thật trong `BANK_TRANSFER_INFO` (hiện để rỗng và hiển thị `"Đang cập nhật (TODO)"` trong modal `"Thanh toán chuyển khoản"`).
- [ ] **Thanh toán & kích hoạt gói (Backend giai đoạn sau)**: Modal `"Thanh toán chuyển khoản"` hiện chỉ hiển thị thông tin + mã đơn tạm ở client, chưa kết nối API đối soát chuyển khoản hoặc tự nâng cấp `plan` trên Supabase.
- [ ] **Nội dung pháp lý**: Cập nhật văn bản chính thức cho `/chinh-sach-bao-mat` ([app/chinh-sach-bao-mat/page.tsx](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/app/chinh-sach-bao-mat/page.tsx)) và `/dieu-khoan-su-dung` ([app/dieu-khoan-su-dung/page.tsx](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/app/dieu-khoan-su-dung/page.tsx)).

---

## 3. Tài nguyên đa phương tiện & ảnh bìa mẫu (`public/`)
- [x] `public/templates/basic-1/cover.webp`, `basic-2/cover.webp`, `basic-3/cover.webp`: Ảnh minh họa bìa tỉ lệ 3:4 (`600x800`).
- [ ] `public/templates/pro-1/cover.webp`: Hiện sử dụng ảnh vector Art Deco dựng tạm (`600x800` WebP); cân nhắc thay bằng ảnh sản phẩm thật hoặc ảnh AI khi sẵn sàng.
- [ ] `public/templates/vip-1/cover.webp`: Chưa có ảnh — đang dùng card fallback tối kèm viền kim loại & nhãn `"Sắp có"`.
- [ ] `content/demo.ts`: Dữ liệu cô dâu/chú rể/lịch tiệc mẫu đang dùng bộ ảnh trong `public/photos/*`, QR mẫu `/images/gift-qr.png` và nhạc `/media/wedding.mp3`.
- [ ] `public/photos/*`, `public/images/gift-qr.png`, `public/media/wedding.mp3`: Kiểm tra bản quyền nhạc nền & thay ảnh mặc định trước khi quảng bá công khai.

---

## 4. Hệ hai Theme Light/Dark (`lib/brand-theme.ts`), Font chữ & Kiểm tra tương phản WCAG 2.1

### Bộ font (`app/layout.tsx`, hỗ trợ tiếng Việt đầy đủ)
- **Tiêu đề (`--font-display`)**: Chọn nhất quán **Cormorant Garamond** (weights `400, 500, 600, 700`, bao gồm kiểu nghiêng *italic* hiển thị dấu tiếng Việt rõ nét).
- **Nội dung & nút bấm (`--font-sans`)**: **Be Vietnam Pro** (weights `300, 400, 500, 600, 700`).
- *Lưu ý ranh giới theme*: Hai theme Sáng/Tối chỉ áp dụng cho giao diện Inviwedd (`/`, `/tao-thiep`, `/dashboard`, `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`). Thiệp của khách (`/w/*`, `/m/*`, `/mau/*` & `templates/*`) giữ bảng màu độc lập theo từng mẫu trong `lib/theme.ts`.

### Kết quả đo tự động từ `node scripts/check-contrast.mjs` (chuẩn WCAG AA `>= 4.5:1`)

**Light Theme (mặc định):**

| Cặp màu | Mã Hex (Chữ / Nền) | Tỉ lệ đo | Trạng thái |
| :--- | :--- | :---: | :---: |
| `text` trên `bg` | `#2C2A29` / `#FAF7F2` | **13.37:1** | PASS |
| `text` trên `surface` | `#2C2A29` / `#FFFFFF` | **14.28:1** | PASS |
| `text` trên `surfaceAlt` | `#2C2A29` / `#F3EEE6` | **12.37:1** | PASS |
| `textMuted` trên `bg` / `surface` / `surfaceAlt` | `#5C5752` trên `#FAF7F2` / `#FFFFFF` / `#F3EEE6` | **6.68:1** / **7.14:1** / **6.18:1** | PASS |
| `accentText` trên `bg` / `surface` | `#8A6D2F` trên `#FAF7F2` / `#FFFFFF` | **4.56:1** / **4.87:1** | PASS |
| `accentFg` trên `accent` / `accentHover` | `#2C2A29` trên `#C5A059` / `#B58F46` | **5.81:1** / **4.75:1** | PASS |
| `text` trên `accentSoft` | `#2C2A29` / `#F1E7D0` | **11.62:1** | PASS |
| `vipBadgeFg` trên `vipBadgeBg` | `#C5A059` / `#2C2A29` | **5.81:1** | PASS |
| `soonBadgeFg` trên `soonBadgeBg` | `#5C5752` / `#F3EEE6` | **6.18:1** | PASS |
| `successFg` trên `successBg` / `surface` | `#1B5E38` trên `#EBF5EE` / `#FFFFFF` | **6.96:1** / **7.76:1** | PASS |
| `dangerFg` trên `dangerBg` / `surface` | `#991B1B` trên `#FCEEEE` / `#FFFFFF` | **7.36:1** / **8.31:1** | PASS |
| `dangerBtnFg` trên `dangerBtnBg` | `#FFFFFF` / `#B91C1C` | **6.47:1** | PASS |
| `neutralFg` trên `neutralBg` | `#4E4944` / `#EFECE6` | **7.55:1** | PASS |

**Dark Theme:**

| Cặp màu | Mã Hex (Chữ / Nền) | Tỉ lệ đo | Trạng thái |
| :--- | :--- | :---: | :---: |
| `text` trên `bg` / `surface` / `surfaceAlt` | `#E8DFC8` trên `#0B0B0B` / `#151515` / `#1B1B1B` | **14.83:1** / **13.76:1** / **12.98:1** | PASS |
| `textMuted` trên `bg` / `surface` / `surfaceAlt` | `#A89F86` trên `#0B0B0B` / `#151515` / `#1B1B1B` | **7.47:1** / **6.93:1** / **6.54:1** | PASS |
| `accentText` trên `bg` / `surface` | `#D4AF37` trên `#0B0B0B` / `#151515` | **9.36:1** / **8.68:1** | PASS |
| `accentFg` trên `accent` / `accentHover` | `#0B0B0B` trên `#D4AF37` / `#E3C35A` | **9.36:1** / **11.45:1** | PASS |
| `text` trên `accentSoft` | `#E8DFC8` / `#2A2412` | **11.64:1** | PASS |
| `vipBadgeFg` trên `vipBadgeBg` | `#D4AF37` / `#0B0B0B` | **9.36:1** | PASS |
| `soonBadgeFg` trên `soonBadgeBg` | `#A89F86` / `#1B1B1B` | **6.54:1** | PASS |
| `successFg` trên `successBg` / `surface` | `#7FE3A8` trên `#12261C` / `#151515` | **10.20:1** / **11.70:1** | PASS |
| `dangerFg` trên `dangerBg` / `surface` | `#FCA5A5` trên `#2B1414` / `#151515` | **9.12:1** / **9.62:1** | PASS |
| `dangerBtnFg` trên `dangerBtnBg` | `#FFFFFF` / `#B91C1C` | **6.47:1** | PASS |
| `neutralFg` trên `neutralBg` | `#C9BFA8` / `#201E1B` | **9.11:1** | PASS |

---

## 5. Cài đặt Hạ tầng, Biến môi trường & Migration SQL (CHƯA thực thi)
- [ ] **Chạy lần lượt các file Migration SQL trên Supabase Studio -> SQL Editor**:
  - `supabase/migration_v3.sql` (nếu chưa chạy: bảng `events`, `guest_events` & RLS).
  - `supabase/migration_v4.sql` (**CHƯA thực thi**: thêm cột `plus_ones`, `diet` vào `public.guests` và mở rộng constraint `kind` của `public.photos` thêm `'gift'`).
  - `supabase/migration_v5.sql` (**CHƯA thực thi**: thêm cột `theme` `'light' | 'dark'` vào `public.users`).
- [ ] **Cloudflare Turnstile chống spam cho RSVP & Lời chúc**:
  - Tạo Turnstile widget trên Cloudflare Dashboard, điền `TURNSTILE_SECRET_KEY` và `NEXT_PUBLIC_TURNSTILE_SITE_KEY` vào `.env.local` / biến môi trường deploy.
  - Ở môi trường dev hiện tại khi chưa đặt key: widget client tự ẩn (`null`), backend cho phép vượt qua trong dev nhưng **sẽ chặn fail-closed** nếu đặt `TURNSTILE_SECRET_KEY` mà token rỗng/sai hoặc khi kiểm tra trên production.
- [ ] **Biến môi trường chia sẻ Open Graph & Zalo**:
  - `APP_BASE_URL` / `SITE_URL` / `NEXT_PUBLIC_SITE_URL`: đặt domain thật (ví dụ `https://inviwedd.vn`) để thẻ `og:image` và `og:url` dùng URL tuyệt đối.
  - `SHARE_SHOW_GUEST_NAME`: mặc định `"false"` (ẩn tên khách khỏi `<title>` Open Graph `/m/[slug]` để bảo vệ riêng tư khi chia sẻ link; đặt `"true"` nếu muốn hiện tên khách trong preview).
- [ ] **Tạo Cloudflare R2 Bucket cho ảnh cưới**:
  ```bash
  npx wrangler r2 bucket create thiep-cuoi-photos
  ```
- [ ] **Ngoài phạm vi đợt này (chưa triển khai)**: Đối soát thanh toán tự động, tên miền riêng, sổ ghi nhận tiền mừng, UI song ngữ, check-in QR tại tiệc, giới hạn tốc độ RSVP theo từng khách, tùy chọn phương tiện di chuyển.

---

## 6. Khu vực Công cụ (`/cong-cu`)
- [ ] **Bảng đối chiếu âm lịch (`docs/lunar-test-cases.md`)**: **Đang chờ chủ dự án cung cấp** bảng ít nhất 20 ngày đối chiếu từ hai nguồn lịch chính thống (gồm cả tháng nhuận). Theo quy tắc an toàn, mã nguồn thuật toán ([lib/lunar.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/lib/lunar.ts)), giao diện ([LunarConverterClient.tsx](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/tools/LunarConverterClient.tsx)) và bộ kiểm thử ([tests/lunar.test.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/tests/lunar.test.ts)) đã sẵn sàng, nhưng **`IS_LUNAR_TOOL_PUBLIC` đang đặt `false`** nên `/cong-cu/doi-am-lich` chưa mở công khai và chưa đưa vào `sitemap.xml`. Khi có file `docs/lunar-test-cases.md` và `node --test tests/lunar.test.ts` đạt 100%, chỉ cần bật `IS_LUNAR_TOOL_PUBLIC = true` trong [config/tools-copy.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/config/tools-copy.ts).
- [ ] **Xác nhận các giá trị gợi ý mặc định trong Bảng tính đám cưới ([config/tools-copy.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/config/tools-copy.ts) & [WeddingCalcClient.tsx](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/tools/WeddingCalcClient.tsx))**:
  - Tỉ lệ khách đến dự mặc định: `90%` (`attendanceRate`).
  - Số người đi cùng trung bình mỗi khách đến dự: tạm để `0` (trong đặc tả bị ngắt sau `0.`, nên đặt trung tính `0` — xác nhận nếu muốn đổi sang `0.2` hay `0.5`).
  - Số khách mỗi bàn: `10` người (`guestsPerTable`).
  - Dự phòng thêm: `5%` (`reserveRate`).
  - Số khách mời dự kiến, giá một mâm, các khoản chi khác và tiền mừng trung bình đều để trống khi mở trang.
- [ ] **SEO, Analytics & Kiểm tra thủ công sau deploy**:
  - Đăng ký **Google Search Console** cho domain production và gửi `https://<domain>/sitemap.xml`.
  - Xác nhận biến `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` nếu muốn bật **Cloudflare Web Analytics** (hiện tại `app/layout.tsx` tự chèn script nếu biến này có giá trị và bỏ qua nếu chưa cấu hình).
  - Kiểm tra dữ liệu có cấu trúc JSON-LD (`WebApplication`, `FAQPage`, `BreadcrumbList`) bằng **Google Rich Results Test** / Schema Markup Validator cho `/cong-cu/bang-tinh-dam-cuoi` sau khi deploy URL công khai và ghi lại kết quả tại đây.
  - Tính năng ngoài phạm vi đợt 1 (chưa triển khai): mục 2.7 *"Lấy số khách từ danh sách của tôi"* (khi đã đăng nhập) và khu vực Cẩm nang / Thu email.
