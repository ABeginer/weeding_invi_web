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
