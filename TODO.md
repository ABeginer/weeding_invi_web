# Việc còn lại

Cập nhật: 2026-11-14. Toàn bộ việc kỹ thuật trong danh sách trước đã xong; dưới đây là
những gì còn lại và lý do.

## A. Chủ dự án cần làm

- [ ] Sau deploy: xác nhận cron dọn dữ liệu chạy (`wrangler tail` lúc 03:00 UTC, log `[retention]`);
      chạy thử `POST /api/ops/retention/run` với `{ "dryRun": true, "reason": "..." }` trước.
- [ ] Kiểm tra CSP trên trình duyệt thật: Turnstile, nhạc nền, Google Maps, preview Zalo.
      Console báo vi phạm thì gửi directive để nới đúng chỗ trong `next.config.ts`.
- [ ] Xác nhận bộ tính năng bán ra (bảng giá khớp code nhưng vẫn là bản nháp).

## B. Kỹ thuật (chưa làm được trong môi trường hiện tại)

- [ ] **Ảnh cho bộ sưu tập mẫu thiệp**: `/thiep-cuoi` đang dùng placeholder vì chưa có
      `public/templates/<id>/preview.webp` (700×1240) và `snapshot.webp` (750×≤6000)
      cho 24 mẫu. Cần bổ sung ảnh thật; code đã tự fallback placeholder.

- [ ] **Test API có DB** (RSVP limit, phân quyền, gifts): route handler import alias `@/`
      và `next/server`, nên `node:test` không import trực tiếp được; cần thêm Vitest/tsx
      hoặc Supabase test project. Hiện đã tách logic thuần và test 29 case.
- [ ] **98 cảnh báo `react-hooks/set-state-in-effect`** từ eslint-plugin-react-hooks v6
      (React Compiler). Đang để mức `warn` để không chặn CI; muốn sạch phải refactor
      pattern đồng bộ prop→state trong các template.
- [ ] **5 lỗ hổng audit production** đều nằm trong `@opennextjs/cloudflare →
      @opennextjs/aws → @node-minify/core → glob/minimatch` (công cụ build, không vào
      runtime worker). `npm audit fix --force` sẽ hạ adapter về 0.3.0 — không làm.
      Chờ bản `@opennextjs/cloudflare` mới.

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
    page redirect trùng `/cong-cu/du-tru-chi-phi`, ảnh `qr.jpg` không dùng, dependency `critters`.
