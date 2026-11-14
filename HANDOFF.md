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
| Sổ mừng (`/dashboard/so-mung`) | **Chưa có backend** — đang ẩn, trang chỉ thông báo |
| Album cho khách | **Chưa có backend** — nút upload bị khoá |
| Lưu trữ 30 ngày (gói free) | Cam kết có, **chưa triển khai** |

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

1. **Chạy `supabase/migration_v11_guest_preferences.sql`** (thêm `song_request`,
   `ride_needed`). Chưa chạy thì RSVP vẫn hoạt động nhưng mất 2 thông tin này.
2. Điền `BANK_BIN`, `BANK_NAME`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME`,
   `BANK_WEBHOOK_SECRET` để luồng thanh toán chạy.
3. Đặt `APP_BASE_URL`/`SITE_URL` là domain thật (hiện fallback `localhost:3000`,
   làm sai canonical/OG/sitemap).
4. Xác nhận `ADMIN_EMAIL` trên production (đã set ở local).
5. Quyết định: xây hay bỏ Sổ mừng + Album; có triển khai retention 30 ngày không
   (thao tác xoá dữ liệu, cần duyệt).

## 5. Kiểm tra

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Đã verify ngày 2026-11-14: tsc sạch, lint sạch, 8/8 test pass, build thành công,
smoke test `next start` với DB thật (trang công khai 200, `/dashboard` 307,
`/ops` fail-closed, rate limit trả 429).

## 6. Tài liệu liên quan

- `README.md` — cài đặt, script, deploy.
- `TODO.md` — việc còn lại.
- `INTEGRATION.md` — quy ước khi thêm route/API mới.
- `.dsh/skills/inviwedd-project-map/` — bản đồ dự án (routes, schema, env,
  quyết định, open items). Cập nhật skill này sau mỗi thay đổi lớn.
- `DESIGN_PLAN.md` — brief giao diện ban đầu (mang tính lịch sử).
