# Inviwedd — thiệp cưới online

Nền tảng tạo và quản lý thiệp cưới trực tuyến (tiếng Việt): mỗi thiệp có một
đường dẫn chung `/w/<slug>` và link riêng cho từng khách `/m/<guestSlug>` để
khách xem thiệp, xác nhận tham dự và gửi lời chúc.

## Stack

| Thành phần | Công nghệ |
|---|---|
| Ứng dụng | Next.js 16 (App Router) + React 19 + Tailwind CSS 4 |
| Triển khai | Cloudflare Workers qua `@opennextjs/cloudflare` |
| Dữ liệu | Supabase Postgres (RLS bật, backend dùng secret key qua `db()`) |
| Đăng nhập | Auth0 (`@auth0/nextjs-auth0`), JWT RS256 xác thực bằng `jose` |
| Ảnh | Cloudflare R2 (binding `PHOTOS`), phục vụ qua `/media/[...key]` |
| Thanh toán | Chuyển khoản + VietQR, đối soát qua webhook ngân hàng |
| Chống spam | Cloudflare Turnstile + honeypot + rate limit trong Worker |

## Yêu cầu

- Node.js **>= 22** (script test dùng `--test-isolation=none`; đã kiểm tra trên Node 24).
- npm (có `package-lock.json`).
- Tài khoản Supabase, Auth0, Cloudflare (R2 + Turnstile) cho môi trường thật.

## Cài đặt

```bash
npm ci
cp .env.example .env.local   # rồi điền giá trị
npm run dev
```

`.env.local` và mọi `.env*` đều nằm trong `.gitignore` — **không commit secret**.
Danh sách biến và nơi đọc chúng: [.env.example](.env.example).

## Script

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy dev (khởi động Miniflare để có binding Cloudflare) |
| `npm run build` / `start` | Build và chạy bản production của Next |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript) |
| `npm run test` | Unit test bằng `node:test` |
| `npm run preview` / `deploy` | Build + chạy thử / deploy lên Cloudflare |

## Cấu trúc

```
app/            trang (App Router) + API routes
components/     UI theo khu vực: invitation, dashboard, landing, create, ops, tools, ui
lib/            client API, types, dữ liệu thiệp, âm lịch, tính chi phí
lib/server/     phần chỉ chạy server: auth, supabase, storage, turnstile, payments…
templates/      các mẫu thiệp + registry
config/         site, plans/limits, bảng giá, copy landing
supabase/       migration SQL chạy tay
tests/          unit test
```

Bản đồ chi tiết (routes, schema, env, quyết định, việc còn mở) nằm trong skill
`.dsh/skills/inviwedd-project-map/` — đọc `references/open-items.md` trước khi
bắt tay vào việc mới.

## Luồng chính

1. Chủ thiệp đăng nhập, tạo thiệp ở `/tao-thiep` (lưu nháp, chọn mẫu), quản lý ở `/dashboard`.
2. Thêm khách (hoặc dán danh sách), mỗi khách có link `/m/<guestSlug>`.
3. Khách mở link, xem thiệp, RSVP (số người đi cùng, chế độ ăn, bài hát), gửi lời chúc.
4. Nâng gói: tạo đơn `INV-XXXXXX` → chuyển khoản theo VietQR → webhook/ops xác nhận → `weddings.plan` đổi.
5. Album cho khách (gói Pro/VIP): tải ảnh trong tab Ảnh → chia sẻ `/a/<slug>`.
6. Sổ mừng (gói Pro/VIP): ghi nhận tiền mừng, cảm ơn, tổng hợp ở `/dashboard/so-mung`.
7. Bộ sưu tập mẫu thiệp: `/thiep-cuoi` (carousel + popup xem trước); trang chủ chỉ giới thiệu.

## Kiểm tra trước khi gửi PR

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

CI (`.github/workflows/ci.yml`) chạy đúng 4 bước này trên mọi push/PR.

## Deploy

```bash
npx wrangler login   # hoặc đặt CLOUDFLARE_API_TOKEN trong shell
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SECRET_KEY
# … các biến còn lại theo .env.example
npm run deploy
```

Build OpenNext dùng `critters` stub trong `vendor/critters-stub` (Next 16 middleware
tham chiếu tĩnh tới `critters` dù `experimental.optimizeCss` đang tắt). `.npmrc` đặt
`install-links=true` để npm copy stub thay vì tạo junction. Nếu sau này bật
`optimizeCss`, cài `critters` thật rồi bỏ entry `file:vendor/critters-stub` trong
`package.json`.

Nếu build báo `Failed to write to output file: ...\open-next.config.mjs: Access is denied`
trên Windows, file `node_modules\@esbuild\win32-x64\esbuild.exe` đang mang nhãn
integrity thấp (do sandbox/agent để lại). Sửa một lần:

```powershell
icacls node_modules\@esbuild\win32-x64 /setintegritylevel Medium /T
```

Sau deploy kiểm tra: `/`, `/sitemap.xml` (domain thật, không phải localhost),
`/w/<slug>`, `/m/<slug>`, `/a/<slug>` (album), `/dashboard` (redirect login),
`/ops` (404 với người không có role; designer chỉ thấy Template + Thiết kế mẫu),
`/ops/templates` (grid mẫu + upload ảnh bìa), `/ops/roles` (admin), upload ảnh R2,
Turnstile, preview OG trên Zalo/Facebook, và `wrangler tail` xem log `[retention]`
sau 03:00 UTC.
Chạy `npx wrangler deploy --dry-run` để xem bundle (~16,7 MiB uncompressed / ~4,08 MiB gzip
gồm assets). Workers Free cho phép 64 MiB uncompressed nên **kích thước không chặn**;
Workers Paid (~$5/tháng) vẫn cần vì free chỉ có **10 ms CPU/request** (SSR/cron dễ vượt).
Chi tiết và ngưỡng nâng cấp: [PRODUCTION_CAPACITY.md](PRODUCTION_CAPACITY.md).

## Ghi chú

- Migration SQL trong `supabase/` được chạy **thủ công** trên Supabase SQL Editor,
  theo thứ tự tên file. Không có công cụ migrate tự động. Danh sách hiện tại:
  `v2` (bảng gốc), `v3` (sự kiện), `v4` (RSVP mở rộng), `v5` (theme),
  `v10_ops` (ops), `v11_guest_preferences`, `v12_gifts`, `v13_album_kind`,
  `v14_designer`, `v15_designer_versions`, `v16_ops_roles_template_meta`
  (v14/v15 đã chạy 2026-11-14; **v16 cần chạy** để bật phân quyền ops + title mẫu).
- Ops phân quyền theo email: `ADMIN_EMAIL`/`ADMIN_EMAILS` là admin mặc định; bảng
  `ops_members` (migration v16) cấp thêm role `admin`/`designer`. Designer chỉ thấy
  **Template** và **Thiết kế mẫu**; admin thấy toàn bộ và có trang **Phân quyền**.
- Dung lượng/chi phí production: xem [PRODUCTION_CAPACITY.md](PRODUCTION_CAPACITY.md)
  (ước tính 100 active user/ngày, giới hạn free của Supabase/R2/Workers và ngưỡng nâng cấp).
- Mẫu designer đã publish hiện trong catalog công khai `/mau-thiep` và mục
  “Mẫu thiết kế mới” trên trang chủ: hover desktop chạy thiệp thật, mobile xem
  trang đầu, popup có nhạc/tự cuộn.
- Job dọn dữ liệu gói free quá 30 ngày: `lib/server/retention.ts`, chạy qua
  Cloudflare Cron (`wrangler.jsonc` → `triggers.crons`, 03:00 UTC mỗi ngày) trong
  `worker-entry.ts`; có thể chạy thử bằng `POST /api/ops/retention/run`
  (`dryRun: true`) với tài khoản admin.
- Ảnh do người dùng tải lên được nén phía client trước khi gửi (Workers không chạy
  `sharp`), nên `next.config.ts` đặt `images.unoptimized`.
- `next dev` cần workerd/Miniflare; trong môi trường bị giới hạn quyền, hãy kiểm tra
  bằng `npm run build` + `npm start` thay vì `npm run dev`.

### Lỗi Miniflare/workerd trên Windows

Nếu `npm run dev` log `CreateDirectory: Access is denied; path = miniflare-*`:

- Nguyên nhân: workerd không tạo được thư mục state khi project nằm trong
  `Desktop`/`OneDrive` (Windows Defender Controlled Folder Access chặn ghi).
- Code đã bắt lỗi này: dev server **vẫn chạy**, chỉ mất binding R2/KV/cache nên
  `/media/[...key]` (ảnh trên thiệp) trả 404.
- Cách khắc phục triệt để: chuyển repo ra ngoài Desktop (ví dụ `C:\dev\...`),
  hoặc thêm `workerd.exe` vào Windows Security → Ransomware protection →
  Allow an app, hoặc tắt hẳn bằng `CLOUDFLARE_DEV_BINDINGS=0`.
