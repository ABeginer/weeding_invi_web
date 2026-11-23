# Báo Cáo Đánh Giá Hiệu Năng & Khả Năng Mở Rộng Hệ Thống (Inviwedd)
*Next.js 16 + OpenNext on Cloudflare Workers + Supabase Architecture*

**Ngày thực hiện:** 20/11/2026  
**Chế độ:** Read-Only Audit (Không thay đổi mã nguồn, database hay cấu hình)

---

## 1. Executive Summary & Điểm Đánh Giá Sức Khỏe Hệ Thống

| Hạng mục | Điểm (Thang 100) | Tình trạng | Rủi ro chính |
| :--- | :---: | :---: | :--- |
| **Edge & Cloudflare Runtime** | **62 / 100** | ⚠️ Rủi ro trung bình-cao | Auth0 middleware chạy trên đường dẫn khách mời `/m/:path*`, thiếu Cache-Control edge cho trang xem thiệp. |
| **Supabase & Database Layer** | **55 / 100** | 🔴 Rủi ro cao | Bảng `guests` thiếu composite index cho sắp xếp/lọc; thiếu index cho foreign key `guest_events(event_id)`; `select('*')` và đếm chính xác (`count: exact`). |
| **Polling & Realtime Traffic** | **68 / 100** | ⚠️ Rủi ro trung bình | Polling không kiểm tra `document.hidden`; `/led/[slug]` tải toàn bộ thiệp mỗi 15s; `/share/[slug]` tải toàn bộ danh sách khách mỗi 10s. |
| **Frontend & Mobile Webview** | **70 / 100** | ⚠️ Rủi ro trung bình | Iframe trong `/tao-thiep` re-navigate theo từng ký tự; static import thư viện nặng (`jsqr`, `fflate`, `basic-1`). |
| **Tổng thể (Overall Health)** | **64 / 100** | ⚠️ **Cần tối ưu trước khi chạy chiến dịch lớn** | Sẽ nghẽn kết nối Supabase và giật lag trình duyệt khi 500–1.000 khách đồng thời mở thiệp từ Zalo. |

---

### Top 5 Rủi Ro Khi Chạm Ngưỡng 1.000 Khách / 100 Chủ Thiệp Đồng Thời

1. **Supabase Connection Pool Exhaustion (Tắc nghẽn kết nối DB tức thì):**
   - Khi chủ tiệc gửi link thiệp vào nhóm Zalo/Facebook, hàng trăm khách bấm mở cùng lúc. Do `/m/[slug]` và `/w/[slug]` dùng `export const dynamic = "force-dynamic"` và không có `Cache-Control` (Edge/SWR), mỗi lượt xem kích hoạt 5–6 câu query đọc DB + 1 RPC ghi `track_guest_view_open`.
   - **Hậu quả:** 500 khách mở thiệp tạo ra ~3.000 request tới Supabase trong vài giây $\rightarrow$ Vượt ngưỡng pool connection của PgBouncer $\rightarrow$ Trả lỗi `504 Gateway Timeout` hoặc `PGRST000`.

2. **Cloudflare Worker CPU Timeout do Auth0 Middleware trên Route Khách Mời (`proxy.ts:32`):**
   - Route `/m/:path*` (đường dẫn thiệp cá nhân của khách) bị đưa vào matcher của `proxy.ts`. Mỗi request của khách đều phải khởi tạo Auth0 SDK, giải mã session cookie và xử lý context xác thực người dùng không cần thiết.
   - **Hậu quả:** Tăng đáng kể CPU time và latency trên mỗi Worker request, dễ chạm trần 50ms CPU limit của Cloudflare Workers khi có traffic burst.

3. **Iframe Re-navigation giật lag nghiêm trọng trên `/tao-thiep` (`CreateWeddingBuilder.tsx:442`):**
   - State `iframeSrc` được cập nhật đồng thời với `groomName`, `brideName`, `quote` trong `useEffect` mà không có debounce. Mặc dù đã có cơ chế `postMessage`, việc thay đổi `iframeSrc` khiến trình duyệt liên tục hủy và load lại trang iframe theo từng phím gõ.
   - **Hậu quả:** Giao diện bị khựng, nhấp nháy liên tục, tiêu tốn CPU và pin trên thiết bị di động/laptop.

4. **Missing Composite Index gây Full Table Scan trên bảng `guests`:**
   - Các API `/api/weddings/[id]/guests` và `/api/share/guests` thực hiện sắp xếp `.order("created_at", { ascending: false })` và lọc `.eq("status", status)`. Index hiện tại trong `staging_init.sql` chỉ có `guests_wedding_idx(wedding_id)`.
   - **Hậu quả:** Khi danh sách khách lên đến 300–500 khách/tiệc, Postgres phải load toàn bộ bản ghi vào bộ nhớ để sort và lọc thủ công, làm tăng thời gian phản hồi API từ ~20ms lên >500ms.

5. **Polling bão hòa tài nguyên ở sảnh tiệc (`FamilySharePortal.tsx:92` & `LedPhotoWallClient.tsx:135`):**
   - Màn hình LED `/led/[slug]` cứ 15 giây lại fetch toàn bộ object đám cưới (`/api/public/wedding/[slug]`) với `cache: "no-store"`.
   - Cổng điều phối `/share/[slug]` cứ 10 giây lại fetch toàn bộ danh sách khách với `cache: "no-store"` mà không kiểm tra trạng thái ẩn/hiện của tab (`document.hidden`).
   - **Hậu quả:** Nếu 5 nhân sự đón khách mở điện thoại (dù đã đút túi) + 1 màn hình LED, hệ thống liên tục chịu hàng chục query nặng nề mỗi phút trên DB.

---

## 2. Bảng Chi Tiết Điểm Nghẽn & Kế Hoạch Xử Lý

### 🔴 P0: Nghiêm Trọng — Cần khắc phục trước khi chịu tải thực tế

| STT | Phân loại | Tệp / Tuyến đường | Mô tả điểm nghẽn | Tác động ước tính | Khuyến nghị giải pháp |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Cloudflare** | [proxy.ts:32](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/proxy.ts#L28-L34) | Tuyến đường `/m/:path*` nằm trong matcher của `proxy.ts`, buộc Auth0 middleware chạy trên từng lượt mở thiệp của khách. | Lãng phí 40–60% CPU thời gian xử lý Worker trên mỗi view thiệp; tăng cold start. | Loại bỏ `/m/:path*` khỏi `matcher` trong `proxy.ts`. Chỉ giữ `/auth/:path*` và `/dashboard/:path*`. |
| **2** | **Edge Cache** | [app/w/[slug]/page.tsx:15](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/app/w/[slug]/page.tsx#L15)<br>[app/m/[slug]/page.tsx:22](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/app/m/[slug]/page.tsx#L22) | `force-dynamic` không kèm `Cache-Control` cho route thiệp công khai. Mọi request đều gọi Supabase trực tiếp. | 500 khách vào cùng lúc = 3.000 query DB. Gây sập connection pool của Supabase. | Thêm header `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` cho `/w/[slug]`. Tách RPC `trackGuestView` sang API nền không đồng bộ (`fetch('/api/track-view')` hoặc Cloudflare Worker `ctx.waitUntil`). |
| **3** | **API Cache** | [app/api/wishes/route.ts:216](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/app/api/wishes/route.ts#L216-L224) | `GET /api/wishes` trả dữ liệu lời chúc công khai nhưng không có header cache, mặc định `no-store`. | Mỗi khách mở thiệp đều kéo lại danh sách lời chúc từ Supabase. | Đặt `Cache-Control: public, s-maxage=30, stale-while-revalidate=60`. Khi có lời chúc mới, chỉ cần vài giây để edge cache tự cập nhật. |
| **4** | **Database** | `staging_init.sql`<br>`prod_schema.sql` | Thiếu composite index trên `guests(wedding_id, created_at desc)` và `guests(wedding_id, status)`. | Query phân trang và đếm khách mời phải quét tuần tự và sort in-memory trên Supabase. | Tạo index `guests_wedding_created_idx` và `guests_wedding_status_idx`. |
| **5** | **Frontend UX** | [components/create/CreateWeddingBuilder.tsx:442](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/create/CreateWeddingBuilder.tsx#L442-L455) | `setIframeSrc` chạy trong `useEffect` mỗi khi người dùng gõ tên hoặc lời tựa, bắt trình duyệt reload iframe liên tục. | CPU client nhảy vọt 100%, khung preview nhấp nháy giật lag nghiêm trọng khi nhập liệu. | Chỉ cập nhật `iframeSrc` khi đổi mẫu thiệp (`templateId`). Đồng bộ nội dung thuần túy qua `postMessage` đã có sẵn. |

---

### 🟠 P1: Mức Độ Cao — Cần tối ưu sớm để đảm bảo trải nghiệm mượt mà

| STT | Phân loại | Tệp / Tuyến đường | Mô tả điểm nghẽn | Tác động ước tính | Khuyến nghị giải pháp |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **6** | **Database** | `public.guest_events` | Khóa chính `(guest_id, event_id)` chỉ index `guest_id`. Cột `event_id` không có index riêng. | Khi xóa 1 sự kiện (`events`), `ON DELETE CASCADE` quét toàn bộ bảng `guest_events`. | Tạo index `create index if not exists guest_events_event_idx on public.guest_events (event_id);`. |
| **7** | **Database** | `public.wishes` | Khóa ngoại `wishes.guest_id` không có index. Khi kiểm tra lời chúc của khách (`lib/server/wishes.ts:188`), DB phải quét toàn bộ lời chúc. | Tăng thời gian phản hồi khi khách mở form lời chúc để xem lại lời chúc cũ. | Tạo index `create index if not exists wishes_guest_idx on public.wishes (guest_id);`. |
| **8** | **Polling** | [components/share/FamilySharePortal.tsx:92](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/share/FamilySharePortal.tsx#L92) | Polling danh sách khách mỗi 10s không kiểm tra `document.hidden`. Không có cơ chế ETag hay 304 Not Modified. | Băng thông di động 4G bị lãng phí; DB liên tục nhận query dù không có ai check-in. | Thêm kiểm tra `if (document.hidden) return;`. Thêm header `ETag` hoặc so khớp `last_modified` để trả 304 khi không đổi. |
| **9** | **Polling** | [components/led/LedPhotoWallClient.tsx:135](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/led/LedPhotoWallClient.tsx#L135-L153) | Polling 15s gọi `/api/public/wedding/[slug]` kéo toàn bộ dữ liệu đám cưới thay vì chỉ kéo ảnh mới. | Chuyển tải JSON lớn liên tục qua mạng Wi-Fi tại sảnh tiệc cưới (vốn thường chập chờn). | Đổi sang endpoint chuyên biệt `/api/public/wedding/[slug]/photos` kèm query timestamp `?since=...`. |
| **10** | **Polling** | [components/dashboard/UpgradeModal.tsx:171](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/dashboard/UpgradeModal.tsx#L171-L186) | Polling trạng thái thanh toán mỗi 3s không giới hạn số lần và không dừng khi tab ẩn. | Trình duyệt bị bỏ quên trong tab nền vẫn gửi request liên tục tới server. | Thêm `maxPolls = 100` (5 phút), dừng khi `document.hidden`, và tăng dần interval (exponential backoff 3s $\rightarrow$ 6s). |
| **11** | **Bundle** | [components/share/FamilySharePortal.tsx:30](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/share/FamilySharePortal.tsx#L30) | Import tĩnh `QrCheckInScanner`, kéo theo thư viện `jsqr` (~150 KB) vào bundle chính của trang chia sẻ gia đình. | Làm chậm thời gian tải trang ban đầu trên điện thoại của họ hàng/người đón khách. | Dùng `dynamic(() => import("./QrCheckInScanner"), { ssr: false })` khi người dùng bấm mở tab camera. |
| **12** | **Bundle** | [components/dashboard/PhotoModerator.tsx:26](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/dashboard/PhotoModerator.tsx#L26) | Import tĩnh `export-photo-wall-zip` chứa thư viện nén `fflate`. | Tăng kích thước client bundle của trang kiểm duyệt ảnh dashboard. | Chuyển sang dynamic import khi người dùng bấm nút tải zip: `const { downloadPhotosZip } = await import(...)`. |
| **13** | **Bundle** | [templates/LiveTemplateRenderer.tsx:6](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/templates/LiveTemplateRenderer.tsx#L6) | Import tĩnh `Basic1Template` vào `LiveTemplateRenderer` dù các template khác đều dùng dynamic import. | Mọi trang thiệp đều tải mã nguồn của `basic-1` dù khách chọn mẫu khác. | Chuyển `Basic1Template` sang dynamic import đồng nhất như `TemplatePreviewRenderer`. |
| **14** | **Re-render** | [components/dashboard/WeddingInfoEditor.tsx:938](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/dashboard/WeddingInfoEditor.tsx#L938-L940) | Input text kích hoạt `onDraftChange` trực tiếp trên từng phím gõ, kích hoạt recalculate `previewData` và re-render toàn bộ `PhoneFrame`. | Gõ chữ bị trễ nhịp (input lag) trên máy cấu hình yếu. | Giữ state cục bộ cho input text và debounce 300ms trước khi cập nhật lên state cha `draftContent`. |

---

### 🟡 P2: Mức Độ Vừa Phải — Tinh chỉnh bổ sung (Nice-to-Have)

| STT | Phân loại | Tệp / Tuyến đường | Mô tả điểm nghẽn | Khuyến nghị giải pháp |
| :---: | :--- | :--- | :--- | :--- |
| **15** | **Cache Header** | [next.config.ts:134](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/next.config.ts#L134-L141) | Static assets `/(templates|photos|images)/:path*` chỉ đặt `max-age=86400` (1 ngày). | Tăng lên `max-age=31536000, immutable` cho các file ảnh hoa văn/họa tiết template cố định. |
| **16** | **Edge Runtime** | [app/api/og/invite/route.tsx:3](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/app/api/og/invite/route.tsx#L3) | Cảnh báo deprecation của Edge Runtime từ Next.js 16. | Chuyển runtime sang standard nodejs hoặc tận dụng Cloudflare KV / R2 cache ảnh OG đã sinh một lần. |
| **17** | **Media** | [public/media/wedding.mp3](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/public/media/wedding.mp3) | File nhạc mặc định dung lượng 1.83 MB. | Nén âm thanh xuống bitrate 64–96 kbps mono/joint-stereo (~600–800 KB) để tiết kiệm 60% băng thông tải nhạc. |
| **18** | **Database** | [app/api/weddings/[id]/guests/route.ts:72](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/app/api/weddings/[id]/guests/route.ts#L72) | Dùng `{ count: "exact" }` trên Supabase query. | Khi số lượng khách lớn, chuyển sang đếm từ bảng `stats` hoặc dùng count ước lượng/client memo khi không có search filter. |

---

## 3. Bản Đề Xuất SQL Migration Thêm Index (Sẵn sàng chạy trên Supabase)

Dưới đây là tập lệnh SQL an toàn (`IF NOT EXISTS`), sẵn sàng lưu vào `supabase/migrations/20261120_performance_indexes.sql`:

```sql
-- ==============================================================================
-- INVIWEDD PERFORMANCE & SCALABILITY INDEXES
-- Migration: 20261120_performance_indexes.sql
-- Mục tiêu: Khử bỏ toàn bộ Table Scan trên các luồng mở thiệp và quản lý khách mời
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
```

---

## 4. Danh Sách Quick Wins (< 30 Phút Triển Khai, Hiệu Quả Tức Thì)

1. **Gỡ bỏ `/m/:path*` khỏi `proxy.ts` (5 phút):**
   - Mở `proxy.ts`, xóa dòng `"/m/:path*"` khỏi `config.matcher`.
   - **Hiệu quả:** Giải phóng 100% chi phí khởi tạo Auth0 middleware trên toàn bộ lượt khách xem thiệp.

2. **Dừng `setIframeSrc` khi gõ chữ trong `CreateWeddingBuilder.tsx` (10 phút):**
   - Chỉ set `iframeSrc` khi `templateId` hoặc `designerTemplateId` thay đổi. Bỏ `groomName`, `brideName`, `date`, `quote` khỏi dependency cập nhật `iframeSrc`.
   - **Hiệu quả:** Chấm dứt hiện tượng reload iframe và nhấp nháy giật lag trên trang tạo thiệp.

3. **Thêm `Cache-Control` cho API lời chúc `GET /api/wishes` (5 phút):**
   - Trong `app/api/wishes/route.ts`, bổ sung header `Cache-Control: public, s-maxage=30, stale-while-revalidate=60`.
   - **Hiệu quả:** Cắt giảm đến 90% số lượng request đọc lời chúc gửi về Supabase khi đông khách truy cập.

4. **Thêm kiểm tra `document.hidden` cho các vòng lặp Polling (10 phút):**
   - Trong `FamilySharePortal.tsx` và `UpgradeModal.tsx`, thêm `if (typeof document !== "undefined" && document.hidden) return;` vào đầu callback của `setInterval`.
   - **Hiệu quả:** Ngăn chặn việc gửi request nền vô tận khi người dùng khóa màn hình hoặc chuyển tab.
