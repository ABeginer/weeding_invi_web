# Năng lực production & phương án migration

Cập nhật: 2026-11-14. Mục tiêu: trả lời “100 active user/ngày có chịu nổi không?”,
những gì đã tối ưu trong đợt này, và khi nào/phương án nâng cấp.

## 1. Giả định

- “100 active user/ngày” = khoảng 100 người mở thiệp/RSVP, không phải 100 cặp đôi
  tạo mới mỗi ngày. Mỗi khách mở thiệp ~3 lần/ngày, xem ~20 ảnh/lần.
- Ảnh nằm trong R2, không nằm trong DB. DB chỉ chứa guest/wedding/content/canvas JSON.
- Worker trả HTML/API; ảnh `/media` đi qua Worker nhưng đọc R2.
- Chưa tính traffic tấn công, tải ảnh hàng loạt, hay 100 người đồng thời mở cùng lúc.

## 2. Hiện trạng đo được (2026-11-14)

- Worker bundle: **~16,7 MiB uncompressed**; `wrangler deploy --dry-run` ~18,7 MiB
  total (gồm static assets), gzip ~4,08 MiB. Cloudflare hiện giới hạn **64 MiB
  uncompressed**, không còn giới hạn 3 MiB gzip; bundle hiện tại **vừa**.
- DB: 4 wedding, 21 guest, 37 designer template, 2 version — không đáng kể.
- Public `/m` trước đây đọc DB 2 lần/request (metadata + page), mỗi lần ~6 query
  (guest, wedding, events ×2, photos, designer version). Sau tối ưu còn 1 lần đọc
  dữ liệu/request; version mẫu được cache.
- Ảnh `/media` trước đây đọc R2 mỗi request; giờ cache ở edge.

## 3. Giới hạn free hiện tại

### Supabase Free
- 500 MB database, 5 GB egress, 5 GB cached egress, 1 GB file storage.
- **Unlimited API requests**, 50.000 MAU (Auth của Supabase; app dùng Auth0 nên ít liên quan).
- Shared CPU / 500 MB RAM; **project bị pause sau 1 tuần không có hoạt động**; tối đa 2 project.

### Cloudflare Workers Free
- **100.000 request/ngày**, **10 ms CPU/request**, 128 MB RAM, 50 subrequest/request.
- Worker size **64 MiB uncompressed** (không giới hạn gzip), 20.000 static asset file.

### Cloudflare R2 Free
- **10 GB-month** storage, **1 triệu Class A**, **10 triệu Class B** mỗi tháng.
- **Egress miễn phí** (kể cả qua Worker).
- Class A = upload/ghi; Class B = đọc/list. Ảnh đọc nhiều là Class B.

### Auth0
- Free tier có giới hạn MAU riêng; 100 user/ngày nằm dưới ngưỡng, nhưng cần xem
  dashboard khi vượt vài nghìn MAU.

## 4. Bài toán 100 active user/ngày

| Hạng mục | Ước tính 100 DAU | Giới hạn free | Kết luận |
|---|---|---|---|
| Worker request | ~6.000–12.000/ngày (page + `/media` + API) | 100.000/ngày | Còn 8–15× |
| Worker CPU | 300 page SSR × 10–25 ms + API | 10 ms/request | **Không đạt** (Error 1102) |
| Supabase egress | ~0,2–1,5 GB/tháng | 5 GB | Còn 3–25× |
| Supabase DB | vài MB → vài chục MB | 500 MB | Rất thoải mái |
| R2 storage | 100 wedding × 30 ảnh × 150 KB ≈ 0,45 GB | 10 GB | Còn ~20× |
| R2 Class B | ~0,2–1 triệu/tháng | 10 triệu | Còn 10–50× |
| R2 Class A | ~3.000 upload/tháng | 1 triệu | Còn rất xa |
| Cron retention | job daily có thể >10 ms khi dữ liệu lớn | 10 ms | **Không đạt** trên free |

**Kết luận:** với **Workers Paid ($5/tháng)**, 100 active user/ngày rất nhẹ; Supabase
Free và R2 Free đủ dùng. Nếu cố ở Workers Free, rủi ro chính là **CPU 10 ms** (SSR
và cron), không phải dung lượng.

## 5. Đã tối ưu trong đợt này

1. **Singleton Supabase client** (`lib/server/supabase.ts`): mỗi isolate tạo một
   client thay vì tạo mới mỗi query; giảm allocation/CPU.
2. **React `cache()` cho public wedding** (`app/m/[slug]/page.tsx`,
   `app/w/[slug]/page.tsx`): metadata + page dùng chung một lần đọc DB/request.
3. **Cache API cho `/media`** (`app/media/[...key]/route.ts`): R2 key bất biến,
   cache theo URL ở data center; bỏ đọc R2 cho mọi lượt xem lại; thêm `s-maxage`.
4. **Cache API cho designer version** (`lib/server/designer.ts`): canvas JSON của
   version đã publish là bất biến, cache 1 ngày theo `(template, version)`; giảm
   egress/CPU cho `/m` và trang preview.
5. **`/w` không đọc designer version** (`lib/server/public-wedding.ts`): `/w` render
   template code nên bỏ hẳn truy vấn canvas không dùng; `/m` vẫn đọc.
6. **Bỏ binding `IMAGES` không dùng** (`wrangler.jsonc`): app đặt
   `images.unoptimized`, không có chỗ dùng binding này.
7. Giữ nguyên cấu trúc route/DB; không đổi schema, không đổi workflow lưu/publish.

Kiểm chứng: typecheck, lint 0 error, 50/50 test, `next build`, `next start` smoke
(`/`, `/m`, `/w`, `/media` 404 hợp lệ, `/api/ops/me`), `opennextjs-cloudflare build`
và `wrangler deploy --dry-run` (18,7 MiB total, không còn IMAGES).

## 6. Nên làm tiếp (chưa làm)

- **Workers Paid** trước khi mở production: $5/tháng, CPU 5 phút/request, không còn
  giới hạn 100k request/ngày. Đây là “migration” quan trọng nhất ở mốc 100 DAU.
- **Cache Rule `/media/*`** ở Cloudflare (Edge TTL dài): Cache API trong Worker chỉ
  tránh đọc R2, **vẫn tính một Worker request**. Cache Rule có thể trả ảnh từ edge
  mà không chạy Worker, giảm request/CPU khi ảnh tăng.
- **Cache HTML có kiểm soát** cho `/w/<slug>` (TTL ngắn 30–60 s) và `/m/<guest>`
  (TTL 15–30 s + purge khi chủ thiệp sửa nội dung/suspend). Cần cơ chế purge trước
  khi bật, nếu không khách thấy nội dung cũ.
- **Tách font theo route group**: hiện `app/layout.tsx` tải 9 family cho mọi trang;
  chỉ trang thiệp/designer cần đủ bộ. Chuyển font designer sang layout của `/m`,
  `/mau`, `/ops/designer` để giảm CSS/font tải ở landing/dashboard.
- **Backup DB**: Supabase Free không có backup tự động. Thêm GitHub Action chạy
  `pg_dump` hằng tuần → R2 (free) hoặc Supabase Pro (backup 7 ngày).
- **Giảm ảnh**: cân nhắc hạ gallery 1600 → 1280 px hoặc quality 0.8 → 0.75 nếu R2
  storage gần 8–9 GB; hiện chưa cần.
- **Kiểm tra `canvas_json` có data URL**: fallback upload khi R2/Miniflare lỗi có thể
  nhúng `data:image/...;base64` vào layout; mỗi ảnh có thể vài trăm KB và bị nhân bản
  theo từng version publish. Chuyển các ảnh này sang `designer_assets`/R2 trước khi
  DB gần 400 MB. Đây là rủi ro dung lượng lớn nhất của designer.
- **Theo dõi `designer_template_versions`**: mỗi lần publish lưu full canvas JSON;
  dọn version cũ không còn wedding nào ghim nếu DB tiến gần 400 MB.
- **Ops list**: `GET /api/ops/weddings` và `/api/ops/users` tải toàn bộ rồi lọc/slice
  trong bộ nhớ; chỉ ảnh hưởng admin, nhưng nên chuyển filter/pagination xuống SQL
  khi có hàng nghìn wedding.
- **Rate limit**: hiện là in-memory theo isolate, không phải global; khi có traffic
  xấu, thêm Cloudflare Rate Limiting rule cho `/api/rsvp`, `/api/wishes`, `/api/invite`.

## 7. Ngưỡng migration & phương án

| Khi nào | Nâng gì | Chi phí | Ghi chú |
|---|---|---|---|
| Ngay khi production | **Workers Paid** | ~$5/tháng | CPU 10 ms free không đủ cho SSR/cron |
| DB > 400 MB, egress > 4 GB/tháng, cần backup/PITR, > 40k MAU | **Supabase Pro** | $25/tháng | 8 GB DB, 250 GB egress, backup 7 ngày |
| R2 > 8 GB, Class A > 800k, Class B > 8M | **R2 paid** | $0,015/GB + $4,50/M A + $0,36/M B | Egress vẫn free |
| 1.000 DAU | Workers Paid + Supabase Pro (nếu egress tăng) + Cache Rule ảnh | ~$30–40/tháng | Bắt đầu cache HTML/API |
| 10.000 DAU | Supabase Pro + read replica/connection pool, Cache Rule, queue cho write | ~$60–150/tháng | Cân nhắc tách đọc/ghi |
| Auth0 vượt MAU free | Auth0 paid hoặc chuyển Supabase Auth | tùy | App đã tách `getUser` |

### Phương án kỹ thuật khi cần

1. **Giữ Cloudflare + Supabase Pro** — ít việc nhất, đúng kiến trúc hiện tại.
2. **Đổi Postgres** (Neon/RDS/Postgres tự quản) — `pg_dump`/restore, thay
   `lib/server/supabase.ts` bằng driver/ORM; mất PostgREST/RLS mặc định, phải làm
   lại phân quyền server. Chỉ nên làm khi Supabase Pro không đủ.
3. **Đổi host** (Vercel/AWS Node) — bỏ OpenNext/Workers, R2 qua S3 API; thường đắt
   hơn Workers Paid ở mốc nhỏ.
4. **Đổi storage** (S3/B2) — R2 đang rẻ nhất vì egress free; chỉ đổi nếu cần dịch vụ
   ngoài Cloudflare.
5. **Tách write path** — RSVP/wish/upload qua Queue/Durable Object khi write đồng
   thời tăng; đọc vẫn qua Worker + cache.

## 8. Cách đo trước khi nâng cấp

- Cloudflare Dashboard → Worker → Metrics: Requests, CPU time, Errors 1102/1027.
- Supabase Dashboard → Usage: Database size, Egress, MAU; bật cảnh báo 80%.
- R2 → Metrics: Storage, Class A/B; theo dõi số ảnh/wedding.
- `npx wrangler deploy --dry-run` để xem bundle; `wrangler tail` cho lỗi runtime.
- Chạy `npx wrangler deploy --dry-run` và `curl -I /media/...` kiểm tra cache header.

## 9. Nguồn giới hạn

- Supabase pricing: https://supabase.com/pricing
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare R2 pricing/free tier: https://developers.cloudflare.com/r2/pricing/
