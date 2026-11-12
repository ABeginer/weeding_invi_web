# Tài liệu bàn giao (Backend Integration Handoff)

Giao diện frontend (trang thiệp chung `/`, trang thiệp cá nhân `/m/[slug]`, và khu vực quản trị `/admin/*`) đã hoàn thiện đầy đủ trên dữ liệu giả (mock). Toàn bộ lời gọi dữ liệu đều đi qua `lib/api.ts` theo đúng hợp đồng kiểu dữ liệu tại `lib/types.ts`.

---

## 1. Danh sách các hàm đang là mock trong `lib/api.ts`

Hiện tại `lib/api.ts` giả lập độ trễ mạng `320–560ms` và lưu dữ liệu vào `localStorage` (`wedding_mock_guests_v1`, `wedding_mock_wishes_v1`, `wedding_mock_admin_session_v1`) với fallback bộ nhớ cho SSR. Khi nối backend thật, **giữ nguyên tên hàm, tham số và kiểu trả về** dưới đây:

### Phía khách (Public & Personal Invite)
| Hàm | Chữ ký | Hành vi mock hiện tại | Yêu cầu khi nối Backend |
| :--- | :--- | :--- | :--- |
| `getInvite` | `(slug: string) => Promise<{ name: string; status: GuestStatus } \| null>` | Tìm khách theo `slug`, trả `null` nếu không tồn tại. | Query bảng khách mời theo `slug` (public read chỉ trả `name` & `status`, trả `null` nếu 404). |
| `submitRsvp` | `(slug: string, status: "accepted" \| "declined") => Promise<void>` | Cập nhật `status` và `respondedAt` theo `slug`. | Gọi API cập nhật RSVP theo `slug`; ném `Error` message tiếng Việt nếu thất bại. |
| `submitWish` | `(input: { slug?: string; name: string; message: string }) => Promise<void>` | Validate rỗng / `<= 500` ký tự, gắn `guestId` nếu khớp `slug`, thêm vào đầu danh sách lời chúc. | Gọi API lưu lời chúc (xác thực độ dài, rate-limit/chống spam ở server). |

### Phía admin (`/admin/*`)
| Hàm | Chữ ký | Hành vi mock hiện tại | Yêu cầu khi nối Backend |
| :--- | :--- | :--- | :--- |
| `adminLogin` | `(email: string, password: string) => Promise<void>` | Chấp nhận mọi email chứa `@` và mật khẩu không rỗng, lưu session mock vào `localStorage`. | Gọi API đăng nhập (Supabase Auth / session cookie), ném `Error` tiếng Việt khi sai thông tin. |
| `adminLogout` | `() => Promise<void>` | Xóa session mock khỏi `localStorage`. | Gọi API đăng xuất / hủy session cookie. |
| `listGuests` | `() => Promise<Guest[]>` | Trả danh sách khách mời sắp xếp mới nhất trước. | Gọi API lấy danh sách khách (yêu cầu đã xác thực admin). |
| `createGuest` | `(name: string) => Promise<Guest>` | Sinh `id`, `slug` ngẫu nhiên, trạng thái `pending`. | Tạo 1 khách mời mới ở DB, đảm bảo `slug` duy nhất. |
| `createGuestsBulk` | `(names: string[]) => Promise<Guest[]>` | Tạo hàng loạt khách mời từ mảng tên. | Insert batch khách mời ở DB, đảm bảo `slug` không trùng. |
| `updateGuest` | `(id: string, patch: { name: string }) => Promise<Guest>` | Cập nhật `name` theo `id`. | Cập nhật tên khách mời theo `id`. |
| `deleteGuest` | `(id: string) => Promise<void>` | Xóa khách mời theo `id`. | Xóa khách mời theo `id` (lưu ý quan hệ `guestId` ở bảng `wishes`: `ON DELETE SET NULL`). |
| `listWishes` | `() => Promise<Wish[]>` | Trả lời chúc mới nhất lên đầu. | Query lời chúc sắp xếp `created_at DESC`. |
| `getStats` | `() => Promise<Stats>` | Tính `total`, `accepted`, `declined`, `pending`, `wishes`. | Query tổng hợp / count từ DB. |
| `buildGuestLink` | `(slug: string) => string` | Trả `${window.location.origin}/m/${slug}`. | Có thể giữ nguyên hoặc đọc base URL production nếu cần. |

---

## 2. Các điểm cần nối ở tầng Backend & Bảo mật

1. **Bảo vệ route Admin (`/admin/guests`, `/admin/wishes`, `/admin/overview`):**
   - Trong bản giao diện mẫu, các trang `/admin/*` không ép chuyển hướng sang `/admin/login` để thuận tiện kiểm thử trực tiếp đủ 3 tab.
   - Khi nối auth thật, cần bổ sung kiểm tra session (Next.js middleware hoặc layout/API guard trả `401`) để chuyển hướng người dùng chưa đăng nhập về `/admin/login`.
2. **Database & API Routes (`app/api/*`, `supabase/`):**
   - Các hàm trong `lib/api.ts` có thể gọi tới `fetch("/api/...")` hoặc Supabase client qua API route bảo mật.
   - Đảm bảo khóa bí mật, service role key chỉ nằm ở server / Cloudflare Workers bindings (`.env*`, `wrangler.jsonc`).
3. **Chống spam cho `WishForm`:**
   - Component `components/invitation/WishForm.tsx` hiện có sẵn một trường ẩn honeypot (`name="website"`). Nếu backend muốn bổ sung Turnstile hoặc kiểm tra honeypot ở API route, có thể mở rộng nội bộ `WishForm` hoặc truyền header/metadata mà không cần đổi chữ ký `submitWish`.
4. **Hạ tầng Cloudflare Workers / OpenNext:**
   - Dự án đã đặt `images: { unoptimized: true }` trong `next.config.ts` và không sử dụng API chỉ có trên Node (`fs`, `path`, `sharp`) ở runtime.
   - Các trang `/m/[slug]` và `/admin/*` đã cấu hình `robots: { index: false, follow: false }`, đồng thời thẻ Open Graph của `/m/[slug]` không lộ tên khách mời khi chia sẻ link qua Zalo/Messenger.
5. **Danh sách slug mẫu để kiểm thử ngay với mock:**
   - `/m/minh-anh-8x2k` (trạng thái `accepted`)
   - `/m/hoang-nam-3p9q` (trạng thái `pending`)
   - `/m/quoc-bao-9t4w` (trạng thái `declined`)
   - `/m/link-khong-ton-tai` (hiển thị trang `"Link thiệp không hợp lệ"`)

