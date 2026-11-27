# AGENT.md — BẢN ĐỒ KIẾN TRÚC DỰ ÁN CHO AI AGENT

> ⚠️ **CHỈ THỊ BẮT BUỘC CHO MỌI AI AGENT:**
> 1. **CẬP NHẬT FILE NÀY:** SAU MỖI TASK có tạo mới, đổi tên, di chuyển, xóa file hoặc thay đổi luồng/route/API quan trọng, **BẮT BUỘC** phải cập nhật lại file `AGENT.md` này trước khi báo hoàn thành cho người dùng.
> 2. **TUÂN THỦ EDR & AN NINH:** KHÔNG BAO GIỜ thực thi inline evaluation qua shell (như `node -e` hoặc `powershell -c`). Khi cần chạy script kiểm tra, LUÔN tạo file script độc lập trong thư mục `scratch/*.mjs` và chạy qua `node scratch/*.mjs`, sau đó dọn dẹp sạch sẽ.
> 3. **TIÊU CHUẨN DỮ LIỆU THIỆP (STRICT OBJECT CONSUMPTION):** Load trực tiếp dữ liệu từ schema/object, không tự ý viết shim fallback mock hardcode trong UI components.
> 4. **CẤU TRÚC THƯ MỤC ROOT-ONLY:** Toàn bộ mã nguồn dự án được tổ chức trực tiếp tại root (`app/`, `components/`, `lib/`, `config/`, `templates/`, `content/`). Alias `@/*` trong `tsconfig.json` ánh xạ tới `./*`. Tuyệt đối **KHÔNG tạo lại thư mục `src/`** để tránh phân mảnh và nhầm lẫn đường dẫn.
> 5. **CỔNG NGHIỆM THU 2 TẦNG BẮT BUỘC (ZERO-MANUAL-QA GATE):** Sau khi tạo mới hoặc sửa bất kỳ template nào, BẮT BUỘC phải vượt qua 100% kiểm thử 2 tầng trước khi bàn giao:
>    - **Tầng 1 (Script tự động):** Chạy `node scripts/qa-template.mjs <slug>` đạt 15/15 PASS (kiểm tra định dạng WebP, tách nền lõi khung vòm/phim, căn tâm hộp quà, chống tràn ngang 360/390/1440, văn phong cấm, dress code, đa lễ, 9 toggle, đảo nhà gái, drag-drop sectionOrder, tương tác RSVP & delay hộp quà 700ms).
>    - **Tầng 2 (Thị giác qua `/browser`):** Mở xem thử trực tiếp, kiểm tra thực tế trên mobile viewport, click mở bìa, cuộn mượt và xác thực mỹ thuật.
>    - *Chi tiết quy chuẩn và bảng kiểm:* Xem tại **Mục 13 của [card_exp.md](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/card_exp.md)**.
> 6. **CẤM ICON NGÔI SAO / SPARKLES:** TUYỆT ĐỐI KHÔNG sử dụng icon hình ngôi sao / sparkles (`Sparkles`, `Star`, `✨`, `✦`) trong giao diện web, badge, nút bấm hay template thiệp cưới. Thay bằng chấm tròn mảnh (`h-1.5 w-1.5 rounded-full`) hoặc icon chức năng phù hợp ngữ cảnh.
> 7. **QUY CHUẨN KHUNG ẢNH PHIM 35MM & TIÊU ĐỀ ĐIỆN ẢNH:** Khung ảnh phim 35mm bắt buộc ảnh phải nằm trong viewport riêng `overflow-hidden` (tái sử dụng `FilmFrame35mm`), 2 dải sprockets nằm độc lập ở mép ngoài, tuyệt đối không để lỗ phim cắt ngang mặt người. Cấm đặt eyebrow song ngữ lặp heading bên dưới; chuẩn hóa Album thành `THƯỚC PHIM`, Hộp quà thành `HỘP QUÀ`, RSVP thành `XÁC NHẬN THAM DỰ`. Không lạm dụng từ khóa chủ đề (xem Mục 16 của `card_exp.md`).
> 8. **PHÂN QUYỀN GÓI & BLOCK "CHUYỆN CHÚNG MÌNH" (STORY TIER GATING):** Section `story` (Chuyện chúng mình) dành riêng cho gói Standard (`pro`) và Pro (`vip`). Gói Miễn phí (`free`) tuyệt đối không có section này (công tắc bị disabled kèm badge "Standard" trong Dashboard Editor, và thiệp/preview Free tuyệt đối không bao giờ render). Dữ liệu mốc kỷ niệm (`data.story`) tách biệt độc lập 100% khỏi lịch trình ngày cưới (`data.timeline`).
> 9. **TIÊU CHUẨN GOOGLE FONTS 100% VIETNAMESE SUBSET:** Mọi font chữ Google Fonts trong template bắt buộc phải có `subsets: ['latin', 'vietnamese']` (hỗ trợ cả chữ thường lẫn chữ nghiêng italic) và gọi qua biến CSS do Next.js sinh trong `app/layout.tsx` (`var(--font-dancing-script)`, `var(--font-cormorant)`, `var(--font-lora)`, `var(--font-be-vietnam)`). Tuyệt đối không chỉ định chuỗi tên font trần không kèm biến CSS hoặc dùng font thiếu glyph tiếng Việt khiến chữ có dấu (Mạnh, Bà, đ, ệ, ủ, ỹ, ả, ợ) bị vỡ hoặc nhảy font.
> 10. **MÁY TRẠNG THÁI MỞ BÌA PHONG THƯ (ENVELOPE 3-STAGE STATE MACHINE):** Bìa phong thư mở thiệp tương tác bắt buộc chạy theo máy trạng thái 3 giai đoạn: `closed` $\to$ `opening-flap` (0-450ms: lật nắp tam giác `rotateX(-180deg)`, thu nhỏ dấu sáp) $\to$ `opening-card` (450-1050ms: trượt ruột thiệp nhô lên) $\to$ `fading` (1050-1450ms: fade out overlay) $\to$ `opened` (1450ms: unmount hoàn toàn overlay phong bì `return null`, mở khóa cuộn, kích hoạt auto-scroll). Đồng bộ `triggerInvitationOpened()` ngay trong user click gesture. Con dấu sáp đặt thoáng bên trên (`top-[108px]`), ruột thư có `pt-24`, tuyệt đối không đè lên tiêu đề hay tên dâu rể.

---

## 1. Tổng quan Dự án & Tech Stack

- **Dự án:** Inviwedd (`inviwedd.date`) — Nền tảng thiệp cưới điện tử trực tuyến (SaaS) cao cấp kết hợp số hóa điều phối tiệc cưới (quản lý khách mời RSVP, sơ đồ xếp bàn, vé check-in QR, hộp mừng cưới VietQR, photo wall LED sảnh tiệc).
- **Core Framework:** Next.js 16.4.6 (App Router, Turbopack) + React 19.3.1 + TypeScript 5.7.
- **Styling & Motion:** Tailwind CSS v4 (`@tailwindcss/postcss`), Motion (`motion/react` v14), Lucide React.
- **Hosting & Edge Runtime:** Cloudflare Workers thông qua `@opennextjs/cloudflare` + `wrangler` (`wrangler.jsonc`), proxy điều hướng tại `proxy.ts`.
- **Cơ sở dữ liệu:** Supabase (PostgreSQL, Row Level Security, Migration SQL tại `supabase/migrations/`).
- **Lưu trữ tệp (Object Storage):** Cloudflare R2 Bucket (`thiep-cuoi-photos`) lưu ảnh cưới, ảnh khách mời LED và assets.
- **Xác thực (Auth):** Auth0 (`@auth0/nextjs-auth0`) cho chủ tiệc và ban quản trị Ops; Mã PIN 4 số nội bộ (`lib/share-pin.ts`) cho người thân hỗ trợ tiệc cưới.
- **Cổng thanh toán:** payOS (kết nối VietQR Napas 247 ngân hàng tự động, webhook tại `app/api/webhooks/payos/route.ts`).

### Các lệnh chạy chính
- `npm run dev`: Khởi chạy môi trường phát triển local (`next dev`).
- `npm test`: Chạy bộ test tự động (`node --test "tests/*.test.ts"` - hiện có 140+ tests).
- `npm run typecheck`: Kiểm tra lỗi kiểu TypeScript (`tsc --noEmit`).
- `npm run build`: Build Next.js tối ưu (`next build`).
- `npm run deploy`: Build và deploy Cloudflare Workers Production (`opennextjs-cloudflare build && opennextjs-cloudflare deploy`).
- `npm run deploy:staging`: Deploy môi trường Staging (`opennextjs-cloudflare build && wrangler deploy --env staging`).

---

## 2. Bản đồ Thư mục & Đường đi (Project Map)

```
wedding_invi_web/
├── app/                              # Next.js App Router (Pages, Layouts & API Routes)
│   ├── layout.tsx                    # Root Layout (Fonts, ThemeProvider, ToastProvider)
│   ├── page.tsx                      # Trang chủ Landing Page (Hero, Showcase, Bento, Pricing, FAQ, Footer)
│   ├── robots.ts                     # Cấu hình SEO robots.txt chuẩn
│   ├── sitemap.ts                    # Cấu hình dynamic sitemap.xml
│   ├── icon.png                      # App favicon 48x48
│   ├── apple-icon.png                # Apple Touch Icon 180x180
│   │
│   ├── w/[slug]/                     # Trang thiệp cưới công khai cho khách xem (/w/ten-co-dau-chu-re)
│   ├── m/[slug]/                     # Trang thiệp cưới cá nhân hóa cho từng khách (/m/slug?guest=...)
│   │   └── tra-cuu-ban/              # Trang khách tự tra cứu vị trí bàn tiệc & nhận vé check-in
│   ├── thiep-cuoi/                   # Trang danh mục & thư viện duyệt toàn bộ mẫu thiệp
│   ├── mau/[templateId]/             # Trang xem thử demo mẫu thiệp trong khung mobile có toolbar
│   │   └── designer/[id]/            # Xem demo mẫu thiệp do designer tùy biến
│   ├── tao-thiep/                    # Luồng khởi tạo thiệp cưới nhanh (Wizard)
│   │   ├── preview/                  # Frame iframe xem trước trong lúc nhập liệu
│   │   └── luu/                      # Lưu thiệp và điều hướng sang dashboard
│   ├── dashboard/                    # Quản trị tiệc cưới dành cho cô dâu chú rể
│   │   ├── weddings/[id]/            # Quản lý chi tiết 1 đám cưới (thông tin, lễ cưới, khách mời, album, tiền mừng, bàn tiệc)
│   │   ├── new/                      # Tạo thêm thiệp cưới mới
│   │   └── so-mung/                  # Quản lý sổ mừng cưới & sao kê mừng cưới
│   ├── led/[slug]/                   # Màn hình LED trình chiếu ảnh kỷ niệm trực tiếp tại sảnh tiệc
│   ├── photo-wall/[slug]/            # Web app cho khách quét mã QR gửi ảnh lên màn hình LED
│   ├── share/[slug]/                 # Cổng phân quyền quản lý cho người thân bằng mã PIN 4 số
│   ├── a/[slug]/                     # Cổng trợ lý hỗ trợ check-in đón khách tại sảnh
│   ├── cong-cu/                      # Bộ công cụ cưới miễn phí
│   │   ├── bang-tinh-dam-cuoi/       # Bảng tính chi phí đám cưới
│   │   ├── doi-am-lich/              # Đổi ngày dương sang âm lịch
│   │   └── tao-loi-moi-zalo/         # Soạn lời mời cưới Zalo theo vai vế văn hóa Việt
│   ├── chinh-sach/                   # 5 trang chính sách pháp lý theo chuẩn Bộ Công Thương
│   │   ├── bao-mat/                  # Chính sách bảo mật (Nghị định 13/2023/NĐ-CP, RLS, Cloudflare HTTPS)
│   │   ├── thanh-toan/               # Chính sách thanh toán chuyển khoản VietQR payOS
│   │   ├── cung-cap-dich-vu/         # Chính sách bàn giao dịch vụ số SaaS & thời hạn lưu trữ
│   │   ├── dieu-khoan-su-dung/       # Điều khoản sử dụng & quy trình giao dịch 4 bước
│   │   └── doi-tra-hoan-tien/        # Chính sách đổi trả & hoàn tiền 100% khi có sự cố kỹ thuật
│   ├── ops/                          # Cổng quản trị vận hành nội bộ Admin/Ops
│   ├── qa/[slug]/                    # Runner kiểm thử tự động trực quan & runner cho Playwright QA
│   │
│   └── api/                          # REST API Endpoints & Serverless Routes
│       ├── webhooks/payos/           # Webhook nhận thông báo giao dịch tự động từ cổng payOS
│       ├── webhooks/bank/            # Webhook đối soát ngân hàng
│       ├── orders/                   # Tạo đơn hàng nâng cấp gói (Pro, VIP) & lấy link/mã VietQR
│       ├── weddings/                 # CRUD thiệp cưới, lưu nội dung, kiểm tra slug
│       │   └── [id]/guests/          # Quản lý khách mời, RSVP, import Excel/CSV, xếp bàn
│       │   └── [id]/photos/          # Quản lý album ảnh cưới & upload Cloudflare R2
│       │   └── [id]/events/          # Quản lý lịch trình, lễ cưới & tiệc cưới
│       │   └── [id]/gifts/           # Cấu hình tài khoản ngân hàng nhận mừng cưới VietQR
│       │   └── [id]/wishes/          # Quản lý lời chúc từ khách mời
│       ├── rsvp/                     # Endpoint công khai cho khách gửi phản hồi tham dự
│       ├── wishes/                   # Endpoint công khai cho khách gửi lời chúc mừng
│       ├── invite/[slug]/            # Endpoint công khai trả về dữ liệu thiệp đã tối ưu cache
│       ├── share/verify-pin/         # Xác thực mã PIN trợ lý 4 số
│       ├── share/check-in/           # Endpoint điểm danh check-in khách mời tại sảnh
│       └── ops/                      # API nội bộ quản trị hệ thống (orders, users, stats, retention)
│
├── components/                       # Thư viện React UI Components
│   ├── landing/                      # Components Landing Page (hero, navbar, bento, pricing-table, faq, footer)
│   ├── invitation/                   # Components thiệp cưới công khai (Envelope, Hero, EventDetails, Gallery, GiftQR, RsvpWishBlock)
│   ├── dashboard/                    # Components quản trị (EventsManager, GuestTable, MusicEditor, PhotosManager, TableStandeeModal)
│   ├── create/                       # Form wizard tạo thiệp cưới (CreateWeddingBuilder, preview-frame)
│   ├── demo/                         # Viewer xem demo mẫu thiệp (template-demo-viewer, demo-toolbar)
│   ├── led/                          # Giao diện màn hình LED sảnh tiệc (LedPhotoWallClient)
│   ├── share/                        # Cổng chia sẻ quyền quản trị cho người thân (FamilySharePortal)
│   ├── policy/                       # Layout dùng chung cho các trang chính sách (PolicyLayout)
│   ├── tools/                        # Components cho bộ công cụ cưới (Zalo invite, âm lịch, bảng tính)
│   ├── templates/                    # Trình duyệt lưới mẫu thiệp (template-grid-browser, template-preview-dialog)
│   ├── ui/                           # UI primitives tái sử dụng (Button, Card, Dialog, Input, Toast)
│   └── theme/                        # Theme context & quản lý bảng màu giao diện
│
├── config/                           # Cấu hình tĩnh & Dữ liệu hệ thống
│   ├── site.ts                       # Cấu hình chung website, URL gốc, hotline, email, link Zalo hỗ trợ
│   ├── pricing.ts                    # Bảng giá các gói (Free, Pro, VIP), tính năng và thời hạn lưu trữ
│   ├── plans.ts                      # Giới hạn kỹ thuật từng gói (số khách, số ảnh, tính năng nâng cao)
│   ├── template-features.ts          # Danh sách tính năng của mẫu thiệp (RSVP, nhạc, album, thời hạn lưu)
│   ├── template-sections.ts          # Cấu hình các section có thể bật/tắt trong thiệp cưới
│   ├── tools-copy.ts                 # Nội dung text cho các trang công cụ cưới
│   ├── landing.ts                    # Nội dung text hiển thị trên Landing Page
│   └── bank.ts                       # Danh sách ngân hàng Việt Nam & cấu hình mã VietQR
│
├── content/                          # Dữ liệu nội dung mẫu & demo
│   ├── demo.ts                       # Dữ liệu mẫu hoàn chỉnh dùng cho demo /mau/[templateId]
│   └── wedding.ts                    # Dữ liệu thiệp mặc định khi khởi tạo
│
├── lib/                              # Core Utilities, Helper Functions & Business Logic
│   ├── types.ts / wedding-types.ts   # Định nghĩa kiểu dữ liệu TypeScript toàn bộ dự án
│   ├── utils.ts                      # Helper chung: format ngày cưới, formatLunarDateClean, cn()
│   ├── api.ts                        # Client API SDK gọi backend
│   ├── auth0.ts                      # Cấu hình Auth0 client cho frontend & server
│   ├── legal-config.ts               # Thông tin pháp lý chủ sở hữu, hotline, email, giấy phép
│   ├── lunar.ts                      # Thuật toán tính âm lịch Việt Nam chính xác
│   ├── salutation-engine.ts          # Bộ sinh xưng hô, câu mời và tin nhắn Zalo tự động theo vai vế
│   ├── share-pin.ts                  # Mã hóa, băm & xác thực mã PIN trợ lý 4 số
│   ├── led-token.ts                  # Sinh & xác thực token bảo mật cho màn hình LED
│   ├── export-boarding-pass.ts       # Sinh ảnh vé mời cưới Boarding Pass (xử lý in-app browser Zalo)
│   ├── export-table-qr-poster.ts     # Sinh poster bảng mã QR đặt bàn tiệc chuẩn in ấn
│   ├── export-photo-wall-zip.ts      # Nén trọn bộ ảnh kỷ niệm màn hình LED thành file .ZIP
│   ├── image-compress.ts             # Nén ảnh client-side trước khi tải lên
│   ├── sound-effects.ts              # Hiệu ứng âm thanh khi mở bao thư thiệp cưới
│   └── server/                       # Backend Logic (chỉ chạy trên server)
│       ├── supabase.ts               # Khởi tạo Supabase client (service role & anon)
│       ├── payos.ts                  # Khởi tạo PayOS SDK, tạo link VietQR, kiểm tra chữ ký webhook
│       ├── payments.ts               # Xử lý nâng cấp gói và đối soát đơn hàng
│       ├── storage.ts                # Tương tác Cloudflare R2 bucket (upload, presigned URL, delete)
│       ├── storage-cleanup.ts        # Dọn dẹp ảnh rác trên R2 khi thiệp bị xóa
│       ├── public-wedding.ts         # Query dữ liệu thiệp cưới công khai với caching tối ưu
│       ├── retention.ts              # Kiểm tra & thực thi xóa thiệp cưới hết hạn lưu trữ
│       ├── turnstile.ts              # Xác thực Cloudflare Turnstile anti-bot
│       └── ops.ts                    # Middleware phân quyền Admin/Ops & lấy thống kê
│
├── templates/                        # Hệ thống Mẫu thiệp cưới (Templates Engine)
│   ├── registry.ts                   # Nơi đăng ký DUY NHẤT toàn bộ mẫu thiệp (ID, tên, plan, ảnh bìa, nhạc nền, tag)
│   ├── types.ts                      # Type definitions: BaseTemplateId, WeddingTemplateMeta, v.v.
│   ├── LiveTemplateRenderer.tsx      # Dispatcher hiển thị thiệp thật trên web (/w/[slug], /m/[slug])
│   ├── TemplatePreviewRenderer.tsx   # Dispatcher hiển thị thiệp xem thử trong demo viewer
│   ├── variants.ts                   # Nhân bản mẫu cơ sở thành các biến thể catalog
│   ├── shared/                       # Components dùng chung (FilmFrame35mm, nút nhạc nổi, RSVP form, overlays)
│   └── [template-id]/                # Thư mục mã nguồn của từng mẫu cụ thể (vd: vuon-o-liu, long-phung, chu-sa-long-phung, anh-dao-phan-tuyet, bich-ngoc-hoang-trieu, long-phung-ep4, bach-nguyet, lam-hoa-vien, bach-tra-suong-mai, song-hac-kim-van, hac-vu-luu-ly, diem-phan-kim-to, phi-thuy-dong-duong, ho-phach-mat-thu, lam-tu-ngoc-suong, tu-dang-da-khuc, huyen-kim-long-phung, hac-kim-nhat-thuc, da-yen-pha-le, mac-lam-kim-tuyen, nau-toi-gian, ban-sac-huong-cang, cuu-long-hy-yen, da-anh-huong-cang, hao-quang-huong-cang, huong-cang-dem-neon, nhat-ky-mua-yeu...)
│
├── supabase/                         # Quản lý Database Supabase (PostgreSQL)
│   ├── migrations/                   # Các file migration SQL theo thứ tự thời gian
│   └── staging_init.sql              # Script khởi tạo toàn bộ schema DB
│
├── public/                           # Static Assets công khai (truy cập qua root URL)
│   ├── favicon.ico                   # Favicon dự phòng
│   ├── media/                        # File âm thanh mp3, wav (nhạc cưới nền, tiếng mở thiệp)
│   ├── photos/                       # Ảnh mẫu demo, ảnh gallery webp
│   ├── images/                       # Logo, icon, ảnh QR mừng cưới placeholder
│   └── templates/                    # Thư mục chứa asset đồ họa của từng mẫu thiệp:
│       └── [template-id]/            # Đặt theo slug mẫu (vd: /templates/vuon-o-liu/cover.webp, floral.webp...)
│
├── scripts/                          # Bộ công cụ & script kiểm thử tự động
│   └── qa-template.mjs               # Script kiểm thử tự động 15 tiêu chí (Playwright + Sharp)
│
├── tests/                            # Bộ kiểm thử tự động (Node.js native test runner: 140+ tests)
├── proxy.ts                          # Edge proxy xử lý canonical domain & 301 redirect
├── wrangler.jsonc                    # Cấu hình triển khai Cloudflare Workers & R2 bindings
├── open-next.config.ts               # Cấu hình OpenNext chuyển đổi Next.js sang Cloudflare Workers
├── next.config.ts                    # Cấu hình Next.js (images remote patterns, redirects 301)
├── package.json                      # Dependencies và npm scripts
└── tsconfig.json                     # TypeScript path alias map (@/* -> ./*)
```

---

## 3. Điểm chạm Quan trọng (Key Entry Points - Cheatsheet)

### 1. Muốn thêm một mẫu thiệp mới
1. Thêm slug ID vào `BaseTemplateId` tại [templates/types.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/templates/types.ts).
2. Đăng ký metadata mẫu (tên, gói free/pro/vip, ảnh bìa, bài nhạc mặc định) trong `BASE_TEMPLATES` tại [templates/registry.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/templates/registry.ts).
3. Tạo thư mục component tại `templates/[slug]/index.tsx`.
4. Đăng ký component vào [templates/LiveTemplateRenderer.tsx](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/templates/LiveTemplateRenderer.tsx) và [templates/TemplatePreviewRenderer.tsx](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/templates/TemplatePreviewRenderer.tsx).
5. Tạo thư mục asset tĩnh tương ứng tại `public/templates/[slug]/` và tối thiểu phải có `cover.webp` (kích thước đứng chuẩn 720×1180px).
6. Tuân thủ tuyệt đối bộ quy chuẩn kiểm soát chất lượng giao diện tại [card_exp.md](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/card_exp.md) (§41): hoa văn 4 góc đối xứng, khoảng an toàn typography/linh vật, văn phong tiếng Việt tự nhiên, form RSVP không bọc thẻ trắng thô, và cơ chế khóa chiều cao `h-full overflow-hidden` + ẩn ruột thiệp khi bìa thư chưa mở để chống trôi/treo màn hình xem trước.
7. Chạy kiểm thử tự động `node scripts/qa-template.mjs <slug>` đạt 15/15 PASS và kiểm tra trực quan bằng `/browser` theo Mục 13 của [card_exp.md](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/card_exp.md) trước khi bàn giao.

### 2. Muốn sửa Bảng giá, Giới hạn gói hoặc Thời hạn lưu trữ
- **Giá niêm yết & thời hạn lưu trữ:** [config/pricing.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/config/pricing.ts) (Quy ước chuẩn: **Free 6 tháng, Pro 1 năm, VIP 2 năm**).
- **Tính năng theo gói:** [config/template-features.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/config/template-features.ts).
- **Giới hạn kỹ thuật:** [config/plans.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/config/plans.ts) & [lib/plans.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/lib/plans.ts).
- **Modal nâng cấp gói UI:** [components/dashboard/UpgradeModal.tsx](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/components/dashboard/UpgradeModal.tsx).

### 3. Muốn sửa Thông tin liên hệ, Pháp lý & Chính sách
- **Thông tin liên hệ chung:** [config/site.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/config/site.ts) (`contactZalo: "0902955594"`, hotline, email).
- **Thông tin pháp lý:** [lib/legal-config.ts](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/lib/legal-config.ts) (Chủ sở hữu: Tôn Long Thuận, địa chỉ, hotline: 0902 955 594, email: support@inviwedd.date).
- **5 trang chính sách Bộ Công Thương:** Nằm trong thư mục [app/chinh-sach/](file:///c:/Users/thuan.ton/Desktop/wedding_invi_web/app/chinh-sach/).

### 4. Biến môi trường & Bí mật (Environment Variables)
- **Local:** `.env.local` (chứa `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYOS_*`, `AUTH0_*`).
- **Template:** `.env.example`.
- **Cloudflare Edge Production:** `wrangler.jsonc` (khai báo bindings R2 Bucket `PHOTOS`, service bindings và cron triggers).
