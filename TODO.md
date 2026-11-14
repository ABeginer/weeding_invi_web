# Việc còn lại

Cập nhật: 2026-11-14 · code `db98d6c`. Chi tiết + lý do nằm trong
`.dsh/skills/inviwedd-project-map/references/open-items.md`.

## A. Chủ dự án cần làm (chặn phát hành)

- [ ] Chạy `supabase/migration_v11_guest_preferences.sql` trên Supabase SQL Editor.
- [ ] Điền `BANK_BIN`, `BANK_NAME`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME`,
      `BANK_WEBHOOK_SECRET` (local + `wrangler secret put` cho production).
- [ ] Đặt `APP_BASE_URL`/`SITE_URL` là domain thật trước khi deploy.
- [ ] Xác nhận `ADMIN_EMAIL` trên production.
- [ ] Quyết định: xây hay bỏ **Sổ mừng** và **Album cho khách**.
- [ ] Duyệt triển khai **lưu trữ 30 ngày** cho gói free (xoá dữ liệu, không hoàn tác).

## B. Kỹ thuật

### Ưu tiên cao
- [ ] Phân trang UI danh sách khách (`GuestTable` đang tải toàn bộ rồi lọc client-side).
- [x] Hiện banner lỗi ở `/ops` thay vì danh sách rỗng khi API fail (sự kiện
      `ops-api-error` + banner trong `app/ops/layout.tsx`).
- [ ] Xoá dữ liệu mẫu chết trong `lib/ops-api.ts` (~350 dòng) và các hàm gifts
      chưa dùng trong `lib/api.ts`.
- [ ] Viết `route.ts` + bảng `gifts` nếu chọn xây Sổ mừng; thêm `album` vào
      constraint DB, `VALID_KINDS`, `MEDIA_KEY_RE` nếu chọn xây Album.

### Trung bình
- [ ] Nâng `eslint-config-next` lên 16.x cho khớp `next@16`.
- [ ] Thêm test cho API (RSVP limit, rate limit, phân quyền) — hiện chỉ có 2 file test.
- [ ] CSP + HSTS trong `next.config.ts` (hiện có X-Frame-Options, Referrer-Policy…).
- [ ] Giảm chi phí font: `app/globals.css:1` đang `@import` 7 font Google
      (render-blocking) bên cạnh 3 font `next/font`.
- [ ] Trang chủ đang `force-dynamic` chỉ để đọc session → cân nhắc ISR/static + client session.
- [ ] Nén/thu nhỏ ảnh gallery theo kích thước hiển thị (hiện 2048px, không srcset).

### Thấp / dọn dẹp
- [ ] Gộp `FORBIDDEN_WEDDING_SLUGS` (đang định nghĩa ở 2 file) và
      `isImplementedTemplateId` (hardcode 24 id trùng registry).
- [ ] Bỏ redirect trùng `/cong-cu/du-tru-chi-phi` (vừa có page vừa có redirect trong next.config).
- [ ] Rà lại docs lịch sử `DESIGN_PLAN.md`, `CARD_CREATE_SKILL.md` khi có thay đổi lớn.
- [ ] Dọn `public/images/qr.jpg` nếu không còn dùng.

## C. Đã xong (để khỏi làm lại)

- [x] Sửa 8 lỗi chặn đợt 1 (Sổ mừng/Album ẩn đúng cách, gán lễ hàng loạt, thay ảnh
      không mất dữ liệu, Turnstile retry, `/m` render từ SSR, ops fail-closed, khoá thiệp có hiệu lực).
- [x] Đợt 2: RSVP tôn trọng hạn mức gói, lưu bài hát/phương tiện, giữ `map_embed_url`,
      rate limit, hết cắt 1.000 dòng, bảng giá khớp code, `/w` noindex, `.env.example` đủ.
- [x] Đợt 3: bỏ `.open-next/.wrangler/scratch` khỏi git, README/HANDOFF/TODO/INTEGRATION
      viết lại, script `typecheck`/`test`, CI 4 bước.
