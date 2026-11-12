# Nối backend vào dự án

## 1. Chép file
Chép nội dung thư mục này vào gốc dự án Next.js (gộp với thư mục `app/` và `lib/` có sẵn):

- `app/api/**` : các route handler
- `lib/server/**` : kết nối Supabase, session admin, tiện ích
- `lib/api.ts` : **ghi đè** bản mock (giữ nguyên tên hàm và kiểu dữ liệu)

Nếu dự án dùng thư mục `src/`, đặt các thư mục trên vào trong `src/`. Alias `@/` phải trỏ tới thư mục gốc chứa `lib/` (mặc định của create-next-app).

## 2. Cài thư viện
```
npm install @supabase/supabase-js
```

## 3. Biến môi trường
Chạy local: tạo `.env.local` (cho `next dev`) và `.dev.vars` (cho `wrangler dev` / preview), cùng nội dung như `.env.example`. Hai file này phải nằm trong `.gitignore`.

Tạo `SESSION_SECRET`:
```
openssl rand -base64 32
```

Production (Cloudflare), chạy từng lệnh rồi dán giá trị khi được hỏi:
```
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put SESSION_SECRET
```

`wrangler.jsonc` cần có cờ `nodejs_compat` và `compatibility_date` từ 2024-09-23 trở lên (bản mẫu của OpenNext đã có sẵn).

## 4. Chặn truy cập admin ở giao diện
Các API admin đã tự từ chối khi chưa đăng nhập (HTTP 401). Ở `app/admin/layout.tsx`, gọi `adminMe()` khi mở trang: nếu trả về `false` thì chuyển hướng sang `/admin/login`.

## 5. Chống spam (làm trên Cloudflare)
Vào Security → WAF → Rate limiting rules, tạo quy tắc giới hạn theo IP:
- `/api/admin/login`: tối đa khoảng 5 lần / phút
- `/api/wishes` và `/api/rsvp`: tối đa khoảng 10 lần / phút

Form lời chúc cần gửi thêm trường ẩn `website` (để trống). Bot điền vào thì server bỏ qua im lặng.

## 6. Thử nhanh sau khi chạy
1. Đăng nhập `/admin/login`, thêm một khách, sao chép link `/m/<slug>`.
2. Mở link ở cửa sổ ẩn danh, bấm xác nhận tham dự, gửi một lời chúc.
3. Quay lại admin: trạng thái khách đổi, lời chúc xuất hiện.
4. Mở `/api/admin/guests` ở cửa sổ ẩn danh chưa đăng nhập: phải trả về 401.
