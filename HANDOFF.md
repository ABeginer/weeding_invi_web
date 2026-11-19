# Bàn giao dự án Inviwedd

Cập nhật: 2026-11-14 · code `db98d6c` · bản đồ chi tiết trong `.dsh/skills/inviwedd-project-map/`.

## 1. Trạng thái

| Hạng mục | Trạng thái |
|---|---|
| Thiệp công khai `/w/[slug]`, link khách `/m/[slug]` | Chạy được với dữ liệu thật |
| Dashboard: thiệp, khách, lời chúc, sự kiện, ảnh, thống kê | Chạy được |
| Tạo thiệp `/tao-thiep` + lưu nháp sau đăng nhập | Chạy được |
| Xác thực (Auth0) + phân quyền chủ thiệp | Chạy được |
| Ops console `/ops` | Chạy được khi `ADMIN_EMAIL` được set; fail-closed khi thiếu |
| Thanh toán chuyển khoản (đơn + VietQR + webhook) | Có code; **chưa cấu hình `BANK_*`** ở local |
| Sổ mừng (`/dashboard/so-mung`) | Đã có API + bảng `gifts` (migration v12, Pro/VIP) |
| Album cho khách (`/a/[slug]`) | Đã có upload + trang album công khai (migration v13) |
| Lưu trữ 30 ngày (gói free) | Đã có job: `lib/server/retention.ts` + cron 03:00 UTC + endpoint ops |
| Phân trang danh sách khách | Server-side search/filter + 50 khách/trang |

## 2. Kiến trúc tóm tắt

```
Browser ──HTTPS──> Cloudflare Worker (Next.js 16 / OpenNext)
                      │ Auth0 (session cookie cho /dashboard, Bearer JWT cho API)
                      ├── Supabase Postgres (service-role key, RLS bật + revoke anon/authenticated)
                      ├── R2 PHOTOS ──> /media/[...key] (immutable cache)
                      └── /api/webhooks/bank <── Google Apps Script (đọc email biến động số dư)
```

- API chia 3 lớp auth: `route()` công khai, `authRoute()` = JWT + chủ thiệp,
  `opsRoute()` = JWT + allowlist `ADMIN_EMAIL`.
- Mọi thao tác ghi đều kiểm tra quyền sở hữu (`getOwnedWedding`).
- Ảnh: nén phía client → R2 → phục vụ qua route `/media`, không dùng `next/image`.
- Gói cước nằm trên `weddings.plan`; giới hạn ở `config/plans.ts`, giá ở
  `lib/server/payments.ts`.

## 3. Việc backend đã nối (không còn mock)

`lib/api.ts` gọi API thật; **không còn mock/localStorage** trong luồng sản phẩm
(ngoại lệ: `lib/ops-api.ts` còn dữ liệu mẫu chết, không được dùng).

## 4. Trước khi phát hành — cần chủ dự án

1. **Migration**: v11, v12, v13, v16, v17, v18 đã chạy và đã được verify trên production.
2. **Cron retention**: sau deploy kiểm tra `wrangler tail` lúc 03:00 UTC (log `[retention]`);
   chạy thử `POST /api/ops/retention/run` với `dryRun: true` trước.
3. **CSP**: kiểm tra trên trình duyệt thật (Turnstile, nhạc nền, Google Maps, Zalo);
   nới directive trong `next.config.ts` nếu console báo vi phạm.
4. **Production env**: `APP_BASE_URL`, `BANK_*`, `ADMIN_EMAIL` đã có trên production
   (xác nhận của chủ dự án); local không cần.

## 5. Kiểm tra

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Đã verify ngày 2026-11-14: tsc sạch, lint 0 error (98 warning React Compiler), **29/29 test pass**,
build thành công, `wrangler deploy --dry-run` bundle thành công, smoke test `next start` với DB thật,
CSP + HSTS trả đúng header, `/` là static và font self-host (không còn gọi Google Fonts CSS).

## 6. Tài liệu liên quan

- `README.md` — cài đặt, script, deploy.
- `TODO.md` — việc còn lại.
- `INTEGRATION.md` — quy ước khi thêm route/API mới.
- `.dsh/skills/inviwedd-project-map/` — bản đồ dự án (routes, schema, env,
  quyết định, open items). Cập nhật skill này sau mỗi thay đổi lớn.
- `DESIGN_PLAN.md` — brief giao diện ban đầu (mang tính lịch sử).
