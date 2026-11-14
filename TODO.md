# Việc còn lại

Cập nhật: 2026-11-14 · code `04192e7` + các thay đổi sau đó. Chi tiết + lý do nằm trong
`.dsh/skills/inviwedd-project-map/references/open-items.md`.

## A. Chủ dự án cần làm

- [x] Chạy 3 migration (`v11`, `v12`, `v13`) — đã chạy, agent đã verify bằng REST + render trang.
- [ ] Sau deploy: xác nhận cron dọn dữ liệu chạy (`wrangler tail` lúc 03:00 UTC, log `[retention]`).
      Chạy thử trước bằng `POST /api/ops/retention/run` với `{ "dryRun": true, "reason": "..." }`.
- [ ] Kiểm tra CSP trên trình duyệt thật (Turnstile, nhạc nền, Google Maps, chia sẻ Zalo).
      Nếu console báo vi phạm, nới đúng directive trong `next.config.ts`.
- [ ] Xác nhận bộ tính năng bán ra (bảng giá hiện đã khớp code nhưng vẫn là bản nháp).

## B. Kỹ thuật

### Ưu tiên cao
- [x] Xoá dữ liệu mẫu chết trong `lib/ops-api.ts` — viết lại thành client mỏng 368 dòng
      (trước 1.101 dòng), merge tài khoản ném lỗi rõ ràng thay vì giả lập.
- [ ] Test API có DB (RSVP limit, phân quyền, gifts): cần mock Supabase hoặc DB test riêng.
      Hiện đã có 22 unit test cho helper thuần (rate limit, phân trang, VietQR, mã đơn).

### Trung bình
- [ ] Nâng `eslint-config-next` lên 16.x — `npm install` bị chặn trong sandbox (cache ngoài
      workspace); chạy ngoài sandbox rồi `npm run lint`.
- [ ] Giảm chi phí font: `app/globals.css:1` đang `@import` 6 font Google, và chúng đang được
      `templates/themed/theme-configs.ts` dùng thật (Playfair, EB Garamond, Viaoda, Pinyon,
      Nautigal, Carattere). Muốn bỏ `@import` phải chuyển sang `next/font` và đổi
      `fontFamily` trong theme-configs sang CSS variable.
- [ ] Trang chủ `force-dynamic` chỉ để đọc session → chuyển static/ISR + đọc session phía
      client (vd `useUser()` của Auth0), rồi kiểm tra lại menu tài khoản.
- [ ] Ảnh gallery 2048px, không srcset: hạ còn 1600px hoặc sinh bản nhỏ khi upload.

### Thấp / dọn dẹp
- [ ] Gộp `FORBIDDEN_WEDDING_SLUGS` (2 nơi) và `isImplementedTemplateId` (hardcode 24 id).
- [ ] Bỏ redirect trùng `/cong-cu/du-tru-chi-phi` (vừa có page vừa có redirect trong next.config).
- [ ] Rà lại `DESIGN_PLAN.md`, `CARD_CREATE_SKILL.md` khi có thay đổi lớn.
- [ ] Dọn `public/images/qr.jpg` nếu không còn dùng.
- [ ] Tài khoản trùng email (2 Auth0 provider) — chưa có route merge; hiện phải gộp tay trên Supabase.

## C. Đã xong (để khỏi làm lại)

- [x] Đợt 1: 8 lỗi chặn (ops fail-closed, khoá thiệp, thay ảnh không mất dữ liệu, Turnstile retry,
      `/m` render từ SSR, gán lễ hàng loạt, ẩn Sổ mừng/Album khi chưa có backend).
- [x] Đợt 2: RSVP tôn trọng hạn mức gói, lưu bài hát/phương tiện, giữ `map_embed_url`,
      rate limit, hết cắt 1.000 dòng, bảng giá khớp code, `/w` noindex, `.env.example` đủ.
- [x] Đợt 3: bỏ `.open-next/.wrangler/scratch` khỏi git, viết lại README/HANDOFF/TODO/INTEGRATION,
      script `typecheck`/`test`, CI 4 bước, banner lỗi `/ops`.
- [x] Đợt 4: Sổ mừng (bảng + API + UI), Album (upload + `/a/[slug]`), retention 30 ngày + cron,
      phân trang khách phía server.
- [x] Đợt 5: 22 unit test (rate limit, phân trang, VietQR, mã đơn), CSP + HSTS, bỏ `authClient()`
      và biến `SUPABASE_PUBLISHABLE_KEY` không dùng.
