# Việc còn lại

Cập nhật: 2026-11-15 (Verified & Reconciled). Dưới đây là danh sách việc còn lại sau các đợt hoàn thiện launch hardening và designer engine:

## A. Chủ dự án cần làm (Owner-only)

- [x] Chạy các migration cơ sở dữ liệu:
  - `migration_v16_ops_roles_template_meta.sql` (bảng `ops_members`, vai trò designer) — **Đã áp dụng trên production**.
  - `migration_v17_invite_limits.sql` (giới hạn 30 lượt mở thiệp gói Free, khoá tên cặp đôi) — **Đã áp dụng trên production**.
  - `migration_v18_wish_once.sql` (RPC `save_wish_once_v18` chống spam lời chúc) — **Đã áp dụng trên production**.
- [ ] Xác nhận email admin trong `ops_members` (hiện fallback `ADMIN_EMAILS`).
- [ ] Trước `npm run deploy`: `npx wrangler login` (hoặc đặt `CLOUDFLARE_API_TOKEN`).
- [ ] **Bật Cloudflare Workers Paid (~$5/tháng)**: CPU free 10 ms không đủ cho Next.js 16 SSR và cron retention (tránh lỗi Error 1102).
- [ ] Sau deploy: xác nhận cron dọn dữ liệu chạy (`wrangler tail` lúc 03:00 UTC, log `[retention]`);
      chạy thử `POST /api/ops/retention/run` với `{ "dryRun": true, "reason": "..." }` trước.
- [ ] Kiểm tra CSP trên trình duyệt thật: Turnstile, nhạc nền, Google Maps, preview Zalo.
- [ ] Xác nhận bộ tính năng bán ra (bảng giá khớp code nhưng vẫn là bản nháp).

## B. Kỹ thuật (Trạng thái thực tế)

- [x] **Trang thiết kế thiệp cho designer trong /ops**: Đã hoàn thành (Multi-page canvas, seed styles, published/draft versions, role designer, interactive blocks, public renderer).
- [x] **Ghim version và render thiệp thật**: `/w/<slug>` và `/m/<guest>` render Designer template đúng version, kèm RSVP / map / calendar block.
- [x] **Phase 5 Animation & Replay**: Đã có multi-select trên canvas (Shift/Cmd-click), nút "Phát tất cả" và "Phát thử" trực tiếp trong artboard bằng `ElementAnimator`, badge animated trên Layers panel.
- [x] **Hiệu ứng chữ (Text Effects)**: Đã hỗ trợ `shadow`, `stroke`, `glow`, `goldGradient` trong canvas properties và `DesignerTemplateRenderer`.
- [ ] **Dynamic fields mở rộng**: Đang triển khai hỗ trợ text/textarea bên cạnh ảnh cho guest fields.
- [ ] **Hoàn thiện khối tương tác (Blocks)**: Map (hỗ trợ nhiều sự kiện và chỉ đường), Gift (nút/QR chuẩn), Gallery/Music kết nối dữ liệu thật.
- [ ] **RSVP Preload**: Tải trước dữ liệu khách (status, diet, plusOnes) cho thiệp `/m`.
- [ ] **Editor UX**: Undo/redo, autosave debounce, dirty guard.
- [ ] **Xoay ảnh/chữ khi export**: Exporter hỗ trợ góc xoay khi vẽ canvas background.
- [ ] **98–124 cảnh báo `react-hooks/set-state-in-effect`** từ eslint-plugin-react-hooks v6 (React Compiler) — giữ mức warn, không chặn build.
- [ ] **11 lỗ hổng audit build tooling** — không ảnh hưởng runtime worker.

## B2. Live QR Photo Wall (đã có UI demo, chưa có backend)

Hiện trạng: ô bento trên landing là **demo** với 6 ảnh mẫu. Album QR (`/a/<slug>`) đã chạy
cho gói Pro/VIP nhưng chỉ chủ thiệp upload trong dashboard; khách chưa tự upload và chưa
có màn hình chung cập nhật realtime.

- [ ] Migration: bảng `album_photo_uploads` (wedding_id, guest_id?, table_number, r2_key,
      status pending/approved/rejected, created_at) + token QR theo bàn.
- [ ] API khách upload `POST /api/album/[slug]/upload?t=<token>`: kiểm tra token theo bàn,
      giới hạn số ảnh, rate limit, ảnh nén client ≤1600px, lưu R2 + row `pending`.
- [ ] API/UI duyệt ảnh trong dashboard (duyệt/từ chối, đếm theo hạn mức 30/300).
- [ ] Trang upload mobile `/a/<slug>/upload` (chọn ảnh, xem tiến trình, thông báo chờ duyệt).
- [ ] Trang wall `/a/<slug>/wall`: chỉ hiện ảnh approved, tự cập nhật bằng polling 8–10s
      (Workers không giữ WebSocket lâu; Supabase Realtime là phương án thay thế), chế độ
      fullscreen cho TV/màn hình tiệc.
- [ ] Dashboard tạo/tải QR theo từng bàn trỏ tới link upload.
- [ ] Test: token sai/hết hạn, vượt hạn mức ảnh, ảnh quá lớn, duyệt & từ chối, polling wall.

## B3. Trang thiết kế thiệp cho designer trong /ops (đề xuất, chưa code)

Mục tiêu: designer không cần code vẫn tạo được mẫu thiệp mới; cô dâu chú rể chỉ điền
placeholder. Lưu dưới dạng **layout JSON + ảnh nền webp** (không flatten toàn bộ thiệp,
để giữ RSVP/maps/nhạc là element tương tác).

- [ ] Data model: `designer_templates` (name, plan, ritual, status draft/published, version,
      canvas_json, background_key, snapshot_key, created_by), `designer_assets` (kind, r2_key,
      width/height), lịch sử version.
- [ ] Editor canvas: artboard 390×844 (xuất 2x 780×1688), zoom, pan, grid, snap, ruler,
      layer panel, undo/redo, multi-page (bìa / nội dung / RSVP / thanks).
- [ ] Text: 2 loại — text cố định và text placeholder (`{{groom}}`, `{{bride}}`, `{{date}}`,
      `{{venue}}`, `{{guest}}`, `{{salutation}}`); chọn font self-hosted, size, line-height,
      letter-spacing, align, auto-fit, max lines, overflow.
- [ ] Element kéo thả: ảnh PNG/SVG upload R2, khung ảnh, shape, divider, icon; calendar block
      (ngày giờ), map block (static image + link Google Maps), countdown, QR, music, RSVP anchor.
- [ ] Ops UX: role `designer` (không phải admin), thư viện asset dùng chung, duplicate mẫu,
      preview desktop/mobile, preview theo khách, publish cần duyệt, audit log.
- [ ] Lưu & xuất: upload background webp (canvas `toBlob("image/webp", 0.9)` ở client, ≤300KB),
      lưu JSON layout; version mỗi lần publish; snapshot OG xuất cùng lúc.
- [ ] Runtime: registry trỏ `designerTemplateId`; renderer đọc JSON, đặt overlay theo toạ độ %
      (scale theo bề rộng), fallback template code nếu thiếu layout.
- [ ] Validation trước publish: placeholder thiếu, chữ tràn safe-area, contrast < 4.5:1,
      asset quá lớn, block tương tác nằm ngoài vùng chạm 44px.

## B4. Designer → thiệp thật (version ghim)

- [x] Multi-page canvas (Bìa / Nội dung), mỗi trang nền + element riêng.
- [x] Seed bộ mẫu gốc kéo thả: Đào Phấn, Lục Xuân, Kim Hỏa, Ren Trắng, Mộc Nâu, Chibi Hồng
      (`POST /api/ops/designer/seed-styles`, nút "Tạo bộ mẫu gốc").
- [x] Fallback upload ảnh khi R2/Miniflare dev lỗi: nhúng data URL tạm vào layout.
- [ ] Preview chuyển trang `?p=` + tab trang trên `/mau/designer/[id]`.
- [ ] Xuất webp **tất cả trang** (lưu mảng `backgrounds[]`) thay vì chỉ trang đang chọn.
- [x] Dashboard gán designer template cho thiệp: ghi `designer_template_id` +
      `designer_template_version` (bản mới nhất), có nút "Cập nhật lên vN".
- [x] `/m/<slug>`: nếu thiệp có designer template → render `DesignerTemplateRenderer`
      đúng version ghim với dữ liệu thật (tên khách, xưng hô, ngày, địa điểm).
- [x] Mẫu **Đào Phấn** hoàn chỉnh trong designer: 3 trang (Bìa / Nội dung / Cảm ơn),
      publish v1 → v2, gán thiệp test `aaaaa` và kiểm tra `/m/<guest>`.
- [ ] Block tương tác (RSVP, map, nhạc) cho designer template — giai đoạn sau.

## B5. Editor animations & fonts (theo prompt `DEEPSEEK_ANIMATIONS_FONTS.md`)

- [x] Phase 1: data model `animation.in`, 10 preset "Vào", easing, wrapper trong
      `ElementAnimator`, IntersectionObserver dùng chung, stagger màn hình đầu,
      reduced-motion, no-JS/observer-failure fallback, panel "Hiệu ứng" tab Vào.
- [x] Phase 3: loop/emphasis (`float/pulse/heartbeat/breathe/sway/spin/twinkle/
      shimmer/kenBurns`), parallax một listener chung, tab "Lặp", 12 loop gần tâm,
      `typewriter` / `wordsIn` / `flipIn`, tắt theo reduced-motion/no-JS.
  - Còn thiếu: shimmer chưa mask theo alpha ảnh PNG; "Phát thử" mới mở trang preview,
    chưa replay đúng element/"Phát tất cả"; badge animated trên layers chưa có.
- [~] Phase 4: hiệu ứng rơi **bản built-in + nguồn tùy chỉnh** — 9 preset (tuyết/sakura/hồng/lá/tim/sao/
      kim tuyến/bong bóng/đom đóm), tối đa 4 nguồn (preset/icon/ảnh upload 256px,
      ≤512KB), panel đầy đủ tham số, trong khung/cả trang, static sample +
      "Xem hiệu ứng khi chỉnh", max 2, area/hardware scale, DPR≤2, pause
      off-screen/tab, reduced-motion tắt.
  - Còn thiếu: icon color picker theo từng nguồn; "Phát thử" đúng element/"Phát tất cả".
- [~] Phase 5: exit effects (`fadeOut/slideOut/zoomOutExit`, observer theo dõi
      vào/ra, replay entrance khi "Chạy lại" bật), shimmer mask theo alpha ảnh,
      "Tự động áp dụng" fadeIn so le 120ms, badge "Hiệu ứng" trên element chọn.
  - Còn thiếu: multi-select thật (Shift/Cmd-click) + áp dụng preset cho nhiều element;
    "Phát thử" đúng element / "Phát tất cả" trong editor (hiện mở trang preview).
- [ ] Phase 2 (phần còn lại): các family mới (Great Vibes, Allura, Montserrat,
      Quicksand, Noto Serif…), "Bộ chữ", hiệu ứng chữ (bóng/viền/glow/ánh kim).
      Hiện mới có nhóm font self-host sẵn + 6 "Kiểu chữ có sẵn".
- [ ] Export theo lớp: element có animation phải tách thành layer transparent 2x
      thay vì bake vào một ảnh nền. Cần cột/bảng lưu layer + endpoint upload mới
      (chưa làm vì prompt cấm đổi backend/storage).

## B6. Tối ưu production & Hạ tầng (sau đợt audit)

- [ ] **Bật Cloudflare Workers Paid trước production ($5/tháng)**: CPU free 10 ms không đủ cho
      Next.js 16 SSR và cron retention (tránh lỗi Error 1102), dù bundle 16,7 MiB < 64 MiB.
- [ ] **Thiết lập tự động sao lưu Supabase Database định kỳ**: Tạo GitHub Action hoặc cron
      Worker chạy lệnh `pg_dump` nén tải lên bucket Cloudflare R2 hằng tuần/hằng ngày để
      bảo vệ dữ liệu tiệc cưới khách hàng (do Supabase Free không có PITR/auto-backup).
- [ ] Tạo Cloudflare Cache Rule cho `/media/*` (Edge TTL dài) để ảnh không chạy Worker.
- [ ] Cache HTML `/w` (30–60 s) và `/m` (15–30 s) + cơ chế purge khi sửa nội dung/suspend.
- [ ] Tách font designer khỏi root layout (chỉ tải ở `/m`, `/mau`, `/ops/designer`).
- [ ] Giảm ảnh 1600 → 1280 px nếu R2 gần 8–9 GB; dọn `designer_template_versions`
      không còn wedding ghim nếu DB gần 400 MB.
- [ ] Ops: chuyển lọc/phân trang weddings/users xuống SQL khi dữ liệu lớn.

## B7. Tái cấu trúc mã nguồn (Codebase Refactoring & Component Modularity)

- [ ] **Tách nhỏ các "God Components" ở Dashboard**:
  - `components/dashboard/WeddingInfoEditor.tsx` (~1.700 dòng): Chia nhỏ theo từng section chức năng:
    - `CoupleInfoSection.tsx`: Thông tin chú rể, cô dâu, ngày cưới, xưng hô.
    - `EventTimelineSection.tsx`: Danh sách sự kiện, nghi lễ (Ăn hỏi, Vu Quy, Tiệc cưới).
    - `TemplateSelectorSection.tsx`: Lựa chọn mẫu thiệp (Code vs Designer) và ghim version.
    - `ShareSettingsSection.tsx`: Tuỳ chỉnh chia sẻ, hiển thị tên khách mời, lời nhắn.
  - `components/dashboard/GuestTable.tsx` (~1.360 dòng): Chia nhỏ thành:
    - `GuestFilterToolbar.tsx`: Tìm kiếm, bộ lọc trạng thái RSVP, nhóm khách.
    - `GuestPaginationBar.tsx`: Thanh điều hướng phân trang 50 khách/trang.
    - `GuestBatchActions.tsx`: Các thao tác hàng loạt (xoá, đổi nhóm, xuất danh sách).
  - `components/dashboard/PhotosManager.tsx` (~1.370 dòng): Chia nhỏ thành:
    - Quản lý slot ảnh theo từng nhóm riêng: ảnh bìa (banner), ảnh đôi (couple), album ảnh (gallery).
    - Tách riêng `ImageCropDialog` và logic nén/upload client-side.
- [ ] **Sửa script test trong package.json**: Thay đổi `"test"` thành `node --test tests/*.test.ts` (loại bỏ `--test-isolation=none` để tương thích tốt với mọi phiên bản Node.js).

## C. Đã xong

- [x] Đợt 1–4: 8 lỗi chặn, dữ liệu/bảo mật, dọn repo + docs + CI, Sổ mừng, Album,
      retention cron, phân trang khách.
- [x] Đợt 5: CSP + HSTS, 22 test helper, bỏ `authClient()`.
- [x] Đợt 6: xoá mock `lib/ops-api.ts` (1.101 → 368 dòng).
- [x] Đợt 7:
  - Font: bỏ `@import` 7 family Google Fonts; 6 family dùng thật chuyển sang `next/font`
    (self-host, 78 file woff2) + `theme-configs.ts` dùng CSS variable.
  - Trang chủ `/` thành **static** (bỏ `force-dynamic`), session đọc client qua `useUser()`,
    theme áp bằng script inline trước khi paint (không nháy sáng/tối).
  - `eslint-config-next` nâng lên 16.4.6 (flat config), sửa 2 lỗi `react-hooks/refs`.
  - Ảnh gallery hạ 2048px → 1600px.
  - Gộp logic validate RSVP/gift thành `lib/rsvp-input.ts`, `lib/gift-input.ts` + 7 test mới (tổng 29).
  - Xoá `FORBIDDEN_WEDDING_SLUGS` trùng, `isImplementedTemplateId` hardcode,
    page redirect trùng `/cong-cu/du-tru-chi-phi`, ảnh `qr.jpg` không dùng, dependency `critters`
    (sau đó thêm stub `vendor/critters-stub` để OpenNext build được — xem Đợt 8).
- [x] Đợt 8 — Ops:
  - Tab **Template** dạng grid + search cho các mẫu designer đã publish: đổi tên thiết kế,
    title khách hàng thấy, upload ảnh bìa (R2), hiện số thiệp đang dùng.
  - Phân quyền ops theo email (`ops_members`, migration v16): admin thấy toàn bộ + trang
    Phân quyền; designer chỉ thấy Template + Thiết kế mẫu; chặn ở cả sidebar, layout và API.
  - Title khách hàng thấy được dùng trong danh sách chọn mẫu ở dashboard.
- [x] Đợt 9 — Editor animations (Phase 1) + kiểu chữ:
  - `animation.in` cho mọi element, 10 preset vào, easing, duration/delay/direction/distance,
    once/threshold; engine client `ElementAnimator` chỉ animate wrapper nội dung.
  - Public `/m` + preview dùng chung engine; observer dùng chung, stagger màn hình đầu,
    no-JS fallback, 3s safety, reduced-motion.
  - Panel "Hiệu ứng" trong canvas; nhóm font self-host + 6 kiểu chữ có sẵn.
- [x] Đợt 11 — Public designer catalog:
  - Trang chủ mục "Mẫu thiết kế mới" + `/mau-thiep`; API `/api/public/designer-templates`
    chỉ trả published, cache 60s.
  - Hover desktop chạy iframe thiệp thật từ trên xuống; mobile hiện trang đầu;
    popup có thông tin, nhạc, tự cuộn, CTA dashboard.
  - Embed `/mau/designer/<id>/embed`; bỏ preload 7 font trang trí (chỉ preload
    Be Vietnam + Playfair) để giảm tải trang.
  - Card code template dùng `coverImage` (hết ảnh trắng); hover/carousel và popup
    render iframe `/mau/<id>?embed=1`, tự cuộn, có nhạc.
  - Gộp mẫu designer đã publish vào chính carousel "Chọn mẫu thiệp của bạn" và
    `/thiep-cuoi` cùng 25 mẫu code; bỏ mục riêng trên trang chủ.
  - Nút "Xuất bản" lưu canvas hiện tại trước khi tạo version (tránh mất animation).
- [x] Đợt 10 — Tối ưu production:
  - Supabase client singleton theo isolate; React `cache()` cho `/m` và `/w`.
  - Cache API cho `/media` (R2 key bất biến) và designer version JSON.
  - Bỏ binding `IMAGES` không dùng; thêm `PRODUCTION_CAPACITY.md` với số liệu 100 DAU,
    giới hạn free và ngưỡng migration.
