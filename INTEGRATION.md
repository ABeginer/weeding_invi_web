# Quy ước tích hợp backend

Tài liệu cho người thêm route/API mới. Bản đồ đầy đủ (37 route, schema, env):
`.dsh/skills/inviwedd-project-map/references/`.

## 1. Cấu trúc một API route

```ts
// app/api/weddings/[id]/vi-du/route.ts
import { authRoute, fail, json, readBody, text } from "@/lib/server/http";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string }> };

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id); // luôn kiểm tra sở hữu
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  const name = text(body?.name, 100);
  if (!name) return fail("Tên không hợp lệ.");

  const { data, error } = await db().from("...").insert({ ... }).select("*").single();
  if (error) throw error;
  return json(data, 201);
});
```

Quy ước:

- Bọc handler bằng `route()` (công khai), `authRoute()` (JWT + user) hoặc
  `opsRoute()` (JWT + `ADMIN_EMAIL`). Lỗi bất ngờ được `route()` bắt và trả 500
  kèm thông báo chung.
- `params` là `Promise` (Next 15+): luôn `await params`.
- Lỗi trả về dạng `{ error: string, code?: string }`; dùng `fail()` / `coded()`.
- Helper đặt trong `lib/server/`, route chỉ export `GET/POST/PATCH/DELETE`.
- Mọi truy vấn ghi phải lọc theo `wedding_id` + `owner_id` (hoặc id đã xác thực).
- Đọc danh sách dài: dùng `fetchAllRows` (`lib/server/pagination.ts`) — PostgREST
  mặc định cắt 1.000 dòng.
- Endpoint công khai ghi dữ liệu: thêm `rateLimit()` + `tooManyRequests()`
  (`lib/server/rate-limit.ts`) và (nếu là form) Turnstile.

## 2. Validate

Schema Zod đặt trong `lib/wedding-types.ts` (nội dung thiệp, sự kiện, sắp xếp,
gán lễ, quà mừng). Ví dụ:

```ts
const parsed = weddingEventInputSchema.safeParse(body);
if (!parsed.success) {
  return json({ error: parsed.error.issues[0]?.message, field: parsed.error.issues[0]?.path.join(".") }, 400);
}
```

Đừng tin dữ liệu từ client: giới hạn độ dài, kiểm URL `https`, kiểm id thuộc
đúng thiệp.

## 3. Ảnh / R2

- Client nén trước (`lib/image/compress.ts`) rồi gửi multipart.
- Server kiểm magic bytes (`detectImageMimeFromBytes`), giới hạn 5 MB
  (`UPLOAD_MAX_BYTES`), ghi R2 qua `putPhotoObject`, lưu `photos.storage_key`.
- Ảnh một chỗ (bìa, chân dung, OG, QR) được thay thế sau khi upload thành công —
  không xoá trước.
- Phục vụ qua `/media/[...key]`, key phải khớp `MEDIA_KEY_RE`.

## 4. Auth

- `/dashboard` được `proxy.ts` (middleware Next 16) bảo vệ bằng session Auth0.
- API tin vào `Authorization: Bearer <access token>`; `lib/server/auth.ts` xác
  thực RS256, issuer và audience bằng `jose`.
- Client lấy token qua `getAccessToken()` (Auth0 SDK) trong `lib/api.ts`, có cache
  theo `expires_at`.

## 5. Database

- Migration viết tay trong `supabase/migration_vN_mo_ta.sql`, chạy trên SQL Editor.
- Không sửa migration đã chạy; thêm file mới.
- Bảng mới: bật RLS và `revoke all ... from anon, authenticated` như các bảng cũ.
- Code phải chịu được trường hợp cột mới chưa tồn tại (bắt `42703`/`PGRST204` và
  fallback), vì migration do người vận hành chạy.

## 6. Thanh toán

- `POST /api/orders` tạo/tái sử dụng đơn `INV-XXXXXX`, trả payload VietQR.
- `POST /api/webhooks/bank` xác thực bằng header `x-webhook-secret`, tìm mã đơn
  trong nội dung chuyển khoản, cập nhật `orders` + `weddings.plan`.
- Ops có thể xác nhận/huỷ/đối soát tay; mọi thao tác ghi `audit_logs` kèm lý do ≥5 ký tự.

## 7. Kiểm tra trước khi commit

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Sau thay đổi lớn, cập nhật skill `.dsh/skills/inviwedd-project-map/` (changelog +
open-items + Last verified) theo Update protocol trong `SKILL.md`.
