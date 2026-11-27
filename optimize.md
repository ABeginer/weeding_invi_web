# BÁO CÁO TOÀN DIỆN: TỐI ƯU HÓA HIỆU NĂNG & DỌN DẸP CODEBASE (INVIWEDD)

> **Dự án:** Inviwedd (`https://inviwedd.date`)  
> **Môi trường:** Next.js 16.4.6 (App Router) + React 19.3.1 + Cloudflare Workers via OpenNext  
> **Thời gian thực hiện:** 20/11/2026  

---

## 1. Tóm tắt nhanh

- **Số file rác / dead code đã xóa an toàn:** **11 file** (6 file source code TypeScript thừa bao gồm toàn bộ thư mục `src/`, 1 file SQL trống, 4 file ảnh JPG trùng lặp).
- **Dung lượng đĩa giải phóng:** **~185.6 KB** (190,064 bytes).
- **Tối ưu Bundle & Render (Code-splitting):**
  - Lazy load dynamic import với `{ ssr: false }` cho các modal nặng (`PaymentTransferModal`, `PlanUpgradeModal`, `UpgradeModal`, `PhotoModerator`, `AssistantPinManager`).
  - Giảm đáng kể kích thước initial bundle của Landing Page (`/`), trang xem thử mẫu thiệp (`/mau/[templateId]`) và trang quản trị cưới (`/dashboard/weddings/[id]`). Tách biệt hoàn toàn thư viện nặng `qrcode` khỏi bundle trang chủ.
- **Rà soát Fonts & Assets:**
  - Xác nhận trang chủ chỉ preload duy nhất font chính `Be_Vietnam_Pro`; 8 font nghệ thuật còn lại đều được cấu hình `preload: false` để giảm thiểu tranh chấp băng thông LCP.
  - Loại bỏ hoàn toàn các file ảnh JPG trùng lặp không được tham chiếu.
- **Clean Code & Edge Query:**
  - Codebase sạch hoàn toàn: **0 `console.log` / `console.debug`** trong mã nguồn production app.
  - Các API routes và Supabase queries đều tuân thủ whitelist cột cụ thể, các route lấy số lượng (stats) đều tận dụng `{ count: 'exact', head: true }` để giảm thiểu payload truyền tải.
  - Xóa sạch hoàn toàn thư mục thừa `src/` (chỉ chứa 2 file forwarder rác), đồng bộ 100% codebase đặt trực tiếp tại root (`app/`, `components/`, `lib/`, `config/`, `templates/`) để tránh mọi nhầm lẫn đường dẫn cho AI agent.
- **Trạng thái kiểm chứng sau tối ưu:** **140/140 tests passed**, `tsc --noEmit` **0 errors**, build OpenNext Cloudflare Workers **100% thành công**.

---

## 2. Danh sách file đã xóa an toàn

| STT | Đường dẫn file | Kích thước | Lý do xóa an toàn |
| :---: | :--- | :---: | :--- |
| 1 | `components/landing/social-proof-marquee.tsx` | 1,839 B | Component marquee thông báo giả lập cũ; không có bất kỳ import hay tham chiếu nào trong dự án. |
| 2 | `components/landing/template-teaser.tsx` | 1,494 B | Component teaser mẫu thiệp cũ của landing page; đã được thay thế hoàn toàn bởi `template-showcase.tsx`. |
| 3 | `lib/server/ops-page.ts` | 959 B | File helper kiểm tra quyền Ops cũ bị bỏ sót; toàn bộ các route và page `/ops` hiện đều sử dụng thống nhất qua `lib/server/ops.ts`. |
| 4 | `lib/wedding-content.ts` | 160 B | File re-export trung gian dư thừa; toàn bộ codebase hiện tại đều import trực tiếp từ `@/lib/wedding-data`. |
| 5 | `prod_schema.sql` | 0 B | File SQL rỗng (0 bytes) tại thư mục root. |
| 6 | `public/photos/long-phung-1.jpg` | 57,665 B | File JPG dư thừa; ứng dụng và demo mẫu Long Phụng đã chuyển sang dùng bản tối ưu WebP `public/photos/long-phung-1.webp`. |
| 7 | `public/photos/long-phung-2.jpg` | 39,375 B | File JPG dư thừa; đã chuyển sang `public/photos/long-phung-2.webp`. |
| 8 | `public/photos/long-phung-3.jpg` | 30,823 B | File JPG dư thừa; đã chuyển sang `public/photos/long-phung-3.webp`. |
| 9 | `public/photos/long-phung-hero.jpg` | 57,665 B | File JPG dư thừa; đã chuyển sang `public/photos/long-phung-hero.webp`. |
| 10 | `src/components/pricing/FeatureInfoPopover.tsx` | 55 B | Forwarder re-export dư thừa của `components/pricing/FeatureInfoPopover.tsx`; không có file nào import từ `src/`. |
| 11 | `src/lib/plans.ts` | 29 B | Forwarder re-export dư thừa của `lib/plans.ts`; không có file nào import từ `src/`. Đã xóa bỏ hoàn toàn thư mục `src/`. |

---

## 3. Các hạng mục đã tối ưu & Cách sửa

### 3.1. Code-splitting & Dynamic Import Modals nặng
Các modal thanh toán, nâng cấp gói và quản lý quyền phụ tá chứa nhiều logic phức tạp, mã QR (`qrcode`), và chỉ hiển thị khi người dùng tương tác (click nút). Việc import tĩnh trước đây làm phình to gói bundle JavaScript ban đầu:

1. **Landing Page Client (`components/landing/landing-page-client.tsx`):**
   - **Vấn đề:** `PaymentTransferModal` (được định nghĩa trong `pricing-modals.tsx` dài 734 dòng và import thư viện `qrcode`) được import tĩnh, khiến toàn bộ mã tạo QR và polling thanh toán bị tải ngay khi người dùng vừa vào trang chủ.
   - **Cách sửa:** Chuyển sang nạp động (lazy load) với `next/dynamic`:
     ```tsx
     const PaymentTransferModal = dynamic(
       () => import("./pricing-modals").then((m) => m.PaymentTransferModal),
       { ssr: false },
     );
     ```

2. **Trang xem thử mẫu thiệp (`components/demo/template-demo-viewer.tsx`):**
   - **Vấn đề:** Tải sẵn cả `PaymentTransferModal` và `PlanUpgradeModal` trong khi người xem chỉ đang duyệt demo giao diện thiệp cưới.
   - **Cách sửa:** Chuyển cả hai modal sang dynamic import:
     ```tsx
     const PaymentTransferModal = dynamic(
       () => import("@/components/landing/pricing-modals").then((m) => m.PaymentTransferModal),
       { ssr: false },
     );
     const PlanUpgradeModal = dynamic(
       () => import("@/components/landing/pricing-modals").then((m) => m.PlanUpgradeModal),
       { ssr: false },
     );
     ```

3. **Trang Quản trị tiệc cưới (`components/dashboard/WeddingDetailView.tsx`):**
   - **Vấn đề:** Các tab chuyên sâu như `PhotoModerator` (kiểm duyệt ảnh LED sảnh tiệc), `AssistantPinManager` (quản trị mã PIN người thân trợ lý) và `UpgradeModal` (hộp thoại nâng cấp gói cưới) bị tải toàn bộ ngay khi vào tab mặc định ("Thông tin cưới").
   - **Cách sửa:** Áp dụng dynamic import cho cả 3 component tab/modal:
     ```tsx
     const PhotoModerator = dynamic(
       () => import("./PhotoModerator").then((m) => m.PhotoModerator),
       { ssr: false },
     );
     const AssistantPinManager = dynamic(
       () => import("./AssistantPinManager").then((m) => m.AssistantPinManager),
       { ssr: false },
     );
     const UpgradeModal = dynamic(
       () => import("./UpgradeModal").then((m) => m.UpgradeModal),
       { ssr: false },
     );
     ```

### 3.2. Kiểm toán Fonts & Chiến lược Preloading LCP
- **File kiểm toán:** `app/layout.tsx`
- **Kết quả:** Font chính của hệ thống là `Be_Vietnam_Pro` được tải chuẩn với cấu hình mặc định (preload). Tất cả **8 Google Fonts trang trí** khác (`Playfair_Display`, `Cormorant_Garamond`, `Lora`, `EB_Garamond`, `Viaoda_Libre`, `Pinyon_Script`, `The_Nautigal`, `Carattere`) đều đã được thiết lập `preload: false`.
- **Lợi ích:** Tránh tình trạng trình duyệt tải trước đồng loạt hàng chục tệp `.woff2`, giải phóng băng thông mạng ban đầu để đạt điểm số LCP (Largest Contentful Paint) cao trên mobile.

### 3.3. Dọn dẹp Code thừa & Debug Logs
- **Console Logs:** Toàn bộ mã nguồn chạy trên production không còn bất kỳ dòng `console.log` hay `console.debug` thử nghiệm nào. Chỉ giữ lại `console.error` có chủ đích tại các khối `catch` để ghi log telemetry lỗi hệ thống khi cần thiết.
- **Supabase Query Optimization:**
  - Các hàm query dữ liệu thiệp công khai (`lib/server/public-wedding.ts`) và API thiệp cưới chỉ truy vấn các trường dữ liệu cần thiết thay vì dùng `SELECT *`.
  - Các thống kê số lượng khách, ảnh, lời chúc sử dụng `{ count: 'exact', head: true }` để máy chủ cơ sở dữ liệu không cần trả về danh sách dữ liệu thực tế, giảm thiểu tiêu hao CPU và RAM trên Edge Worker.

---

## 4. Cần xác nhận thủ công (chưa xóa / chưa sửa)

Các hạng mục dưới đây đã được kiểm tra kỹ lưỡng và được chủ động giữ lại nhằm đảm bảo an toàn tuyệt đối cho hệ thống đang chạy:

1. **Bộ 10 tệp SVG mockup trong `public/photos/`:**
   - **Danh sách:** `bride.svg`, `gallery-1.svg` đến `gallery-6.svg`, `groom.svg`, `hero.svg`, `thank-you.svg` (~1 KB mỗi file).
   - **Lý do giữ lại:** Đây là các vector mockup ban đầu. Dù mã nguồn hiện tại đã dùng ảnh WebP và link tải động từ R2 Bucket, việc giữ lại các file nhẹ này giúp đảm bảo các thiệp cưới cũ trong cơ sở dữ liệu thử nghiệm nếu có trỏ URL dạng `/photos/*.svg` sẽ không bị lỗi 404 hiển thị ảnh.
2. **Tệp toán học `lib/designer-export-math.ts`:**
   - **Lý do giữ lại:** Dù mã ứng dụng chính không import trực tiếp, tệp này được import và kiểm thử nghiêm ngặt bởi bộ test `tests/designer-export.test.ts` nhằm kiểm định tính chính xác của các ma trận biến đổi tọa độ khi xuất file in ấn.
3. **Tập lệnh SQL `supabase/staging_init.sql` và thư mục `supabase/migrations/`:**
   - **Lý do giữ lại:** Dù không được bundle vào Next.js, đây là kho lưu trữ lịch sử cấu trúc cơ sở dữ liệu Supabase, phân quyền RLS và triggers bắt buộc dùng để khởi tạo và đồng bộ Staging/Production.

---

## 5. Trạng thái kiểm chứng kỹ thuật

Sau khi hoàn tất toàn bộ các bước tối ưu và dọn dẹp, toàn bộ các khâu kiểm thử đã được thực thi và vượt qua 100%:

| Kiểm tra | Lệnh thực thi | Kết quả | Chi tiết |
| :--- | :--- | :---: | :--- |
| **Kiểm tra kiểu dữ liệu TypeScript** | `npm run typecheck` (`tsc --noEmit`) | **PASSED** | 0 lỗi cú pháp, 0 lỗi định kiểu. |
| **Bộ kiểm thử tự động** | `npm test` (`node --test "tests/*.test.ts"`) | **PASSED** | **140/140 tests pass** trên toàn bộ 35 test suites. |
| **Next.js Production Build** | `npm run build` (`next build`) | **PASSED** | Biên dịch thành công toàn bộ 59 trang tĩnh và dynamic endpoints. |
| **Cloudflare Workers Build** | `npx opennextjs-cloudflare build` | **PASSED** | Tạo bundle Edge Worker thành công tại `.open-next/worker.js`. |
