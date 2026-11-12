# Danh sách tài nguyên & cấu hình cần duyệt / thay thế (TODO)

Giao diện trang thiệp (`/` và `/m/[slug]`) đã được dựng lại theo bố cục **Mẫu 18** (`DESIGN_REFERENCE.md`) và giữ nguyên toàn bộ kết nối backend hiện có. Trước khi phát hành chính thức, vui lòng kiểm tra và thay thế các mục đang dùng dữ liệu/tài nguyên mẫu (placeholder) dưới đây:

## 1. Tài nguyên đa phương tiện (`public/`)
- [ ] `public/photos/hero.svg` → Thay bằng ảnh cưới chính (`.jpg`/`.webp`, tối ưu dung lượng ~250KB cho 4G) và cập nhật `wedding.hero.coverImage` trong `content/wedding.ts`.
- [ ] `public/photos/groom.svg` & `public/photos/bride.svg` → Thay bằng ảnh chân dung thật của chú rể (`wedding.groom.photo`) & cô dâu (`wedding.bride.photo`) trong `content/wedding.ts`.
- [ ] `public/photos/gallery-1.svg` → `gallery-6.svg` → Thay bằng 6 ảnh cưới thật trong `content/wedding.ts` (`photos`, cập nhật đúng `width` và `height` thực tế; 3 ảnh đầu đồng thời hiển thị ở dải ba ảnh cưới `#6`).
- [ ] `public/photos/thank-you.svg` → Thay bằng ảnh banner lời cảm ơn thực tế (`wedding.sections.footer.bannerImage` trong `content/wedding.ts`).
- [ ] `public/media/music.mp3` → Bổ sung file nhạc nền cưới thực tế (hiện chưa có file nên nút `MusicPlayer` tự ẩn an toàn khi lỗi tải).
- [ ] `public/images/gift-qr.png` → Thay bằng 1 hoặc 2 ảnh mã QR tài khoản ngân hàng mừng cưới thật trong `gift.items[]` (hiện cả 2 mục mẫu đang trỏ cùng `gift-qr.png` placeholder).
- [ ] `public/images/og-cover.png` → Thay bằng ảnh xem trước Open Graph thực tế (`1200x630px`) khi gửi link qua Zalo/Messenger.

## 2. Nội dung đám cưới & cấu hình sự kiện (`content/wedding.ts`, `app/layout.tsx`)
- [ ] Cập nhật họ tên đầy đủ, tên ngắn của chú rể & cô dâu (`groom`, `bride`) và thông tin phụ huynh + địa chỉ hai bên (`families.groom`, `families.bride`).
- [ ] Cập nhật câu thơ/lời dẫn (`quote`) và lời giới thiệu mời tiệc (`invitationNote`).
- [ ] Cập nhật mảng sự kiện `events[]` (có thể giữ 1 hoặc nhiều sự kiện): `title`, `time`, `date` (đúng múi giờ `+07:00`), `lunarDate` (kiểm tra khớp âm lịch thực tế), `venue`, `address`, và `mapDirectionsUrl` (link chỉ đường Google Maps chính thức). Sự kiện đầu tiên (`events[0]`) được dùng cho ngày Hero và đồng hồ đếm ngược.
- [ ] Cập nhật thông tin Hộp Mừng Cưới (`gift.items[]` gồm `label`, `qrImage`, `note`, `downloadFileName` — hỗ trợ 1 hoặc 2 mã QR) và lời cảm ơn cuối trang (`sections.footer`).
- [ ] Thay `metadataBase: new URL("https://thiepcuoi.example")` trong `app/layout.tsx` bằng domain production thật để ảnh Open Graph resolve chuẩn khi chia sẻ.

## 3. Màu sắc & Font chữ (`lib/theme.ts`, `app/globals.css`, `app/layout.tsx`)
Giao diện trang thiệp (`/` và `/m/[slug]`) dùng bảng màu tối giản 3 sắc độ chuẩn bị qua biến CSS trong `lib/theme.ts` & `.invitation-theme` ở `app/globals.css` (không ảnh hưởng giao diện Admin):
- [ ] **Bảng màu trang thiệp (`lib/theme.ts` / `app/globals.css`)**:
  - Nền chính (`--inv-bg`): `#ffffff`
  - Tiêu đề, tên cô dâu chú rể, tiêu đề các phần (`--inv-title`): `#8A9580`
  - Chữ nhỏ, nội dung, nhãn, ghi chú (`--inv-text-small`): `#5E6A52`
- [ ] **Cặp font chữ (`app/layout.tsx`, hỗ trợ đầy đủ dấu tiếng Việt)**:
  - Tiêu đề & chữ nhấn *italic* (`--font-display`): `Cormorant Garamond` (weights 400, 500, 600, 700, regular & italic)
  - Nội dung, ngày giờ & nút bấm (`--font-sans`): `Be Vietnam Pro` (weights 300–700)
