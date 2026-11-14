# Kế hoạch dựng giao diện: Web thiệp cưới

> **Tài liệu lịch sử (2026-11-14):** đây là brief giao diện ban đầu (mock data,
> cấu trúc `/admin/*` cũ). Code hiện tại đã khác: dashboard nằm ở `/dashboard`,
> backend thật nằm trong `app/api`, dữ liệu mẫu chỉ còn trong `content/demo.ts`.
> Xem `README.md`, `HANDOFF.md` và `.dsh/skills/inviwedd-project-map/` để biết
> trạng thái hiện tại.

> Tài liệu này dành cho Antigravity CLI. Bạn chỉ làm **phần giao diện (UI)** với dữ liệu giả (mock). Phần database, API thật, đăng nhập admin do người khác nối vào sau, nên phải tuân theo "Hợp đồng dữ liệu" ở mục 5.

## 0. Prompt để dán vào Antigravity

```
Đọc kỹ DESIGN_PLAN.md ở thư mục gốc và làm lần lượt từng Phase (0 → 5).
Chỉ làm giao diện với dữ liệu giả. KHÔNG đụng vào: thư mục app/api, supabase/, wrangler.jsonc, file .env*.
Mọi dữ liệu phải đi qua lib/api.ts theo đúng hợp đồng ở mục 5.
Xong mỗi Phase thì chạy `npm run build` để chắc chắn không lỗi, commit với message rõ ràng, rồi báo cáo ngắn gọn.
Nếu thiếu tài nguyên (ảnh, nhạc, mã QR, Figma) thì dùng placeholder, ghi vào TODO.md, không dừng lại hỏi.
```

## 1. Mục tiêu và phạm vi

Thiệp cưới dạng web, mở bằng link cá nhân cho từng khách. Mục tiêu chính: **đẹp, mượt, chạy tốt trên điện thoại** (khách mở chủ yếu từ Zalo/Messenger).

**Thuộc phạm vi của bạn (UI):**
- Trang thiệp mời `/m/[slug]` và trang chung `/`
- Giao diện trang admin (đăng nhập, khách mời, lời chúc, tổng quan)
- Nhạc nền, gallery, hiệu ứng, mã QR mừng cưới, bản đồ

**Ngoài phạm vi (đừng làm):**
- Kết nối Supabase, viết API route thật, xử lý đăng nhập thật, tạo bảng
- Cấu hình Cloudflare, biến môi trường, secret

## 2. Ràng buộc kỹ thuật (bắt buộc)

- **Next.js (App Router) + TypeScript + Tailwind CSS**. Hiệu ứng dùng **Framer Motion** hoặc CSS thuần.
- Sẽ deploy lên **Cloudflare Workers** qua OpenNext, nên:
  - Không dùng API chỉ có trên Node (`fs`, `path` ở runtime, `sharp`...).
  - Không dùng `next/image` tối ưu hóa: đặt `images: { unoptimized: true }` hoặc dùng thẻ `<img>` thường (có `loading="lazy"`, `width`, `height`).
  - Tránh thư viện nặng. Mục tiêu: trang thiệp tải nhanh trên 4G.
- **Mobile-first**: thiết kế cho màn 360–430px trước, sau đó mới tới tablet và desktop.
- Tiếng Việt là ngôn ngữ duy nhất. Font phải hỗ trợ đủ dấu tiếng Việt (kiểm tra kỹ font chữ trang trí).
- Mọi nội dung đám cưới nằm trong **một file cấu hình duy nhất** `content/wedding.ts` (xem mục 4), không rải chữ cứng trong component.

## 3. Cấu trúc thư mục

```
app/
  page.tsx                  # trang thiệp chung (không có nút xác nhận)
  m/[slug]/page.tsx         # thiệp cá nhân
  admin/
    layout.tsx              # khung admin + thanh tab
    login/page.tsx
    guests/page.tsx
    wishes/page.tsx
    overview/page.tsx
components/
  invitation/               # Envelope, Hero, Couple, EventDetails, Countdown, Gallery, RsvpBox, WishForm, GiftQR, MapBlock, MusicPlayer, Petals, Footer
  admin/                    # GuestTable, StatusBadge, AddGuestDialog, BulkImportDialog, WishList, StatCards
  ui/                       # Button, Dialog, Toast, Input, Skeleton...
content/
  wedding.ts                # toàn bộ nội dung thiệp
lib/
  api.ts                    # hợp đồng dữ liệu + bản mock (mục 5)
  types.ts
public/
  photos/                   # ảnh cặp đôi
  media/music.mp3           # nhạc nền
  images/gift-qr.png        # mã QR mừng cưới
TODO.md                     # danh sách thứ còn thiếu
```

## 4. File nội dung `content/wedding.ts`

Tạo với giá trị mẫu, người dùng sẽ thay sau:

```ts
export const wedding = {
  groom: { name: "Chú rể", fullName: "Nguyễn Văn A", parents: "Ông ... & Bà ..." },
  bride: { name: "Cô dâu", fullName: "Trần Thị B", parents: "Ông ... & Bà ..." },
  date: "2027-01-01T11:00:00+07:00",      // ngày giờ tiệc
  ceremonyNote: "Lễ thành hôn lúc 10:00",
  venue: { name: "Tên nhà hàng", address: "Địa chỉ đầy đủ" },
  mapEmbedUrl: "",                          // link nhúng Google Maps (iframe)
  mapDirectionsUrl: "",                     // link mở app Google Maps
  photos: [],                               // danh sách ảnh: { src, alt, width, height }
  music: { src: "/media/music.mp3", title: "Tên bài" },
  gift: { qrImage: "/images/gift-qr.png", accountNote: "" },
  story: [],                                // tuỳ chọn: các mốc câu chuyện tình yêu
};
```

## 5. Hợp đồng dữ liệu (rất quan trọng)

Mọi component chỉ gọi hàm trong `lib/api.ts`. Hiện tại các hàm trả dữ liệu giả (có `await` giả lập độ trễ 300–600ms để thấy trạng thái loading). Sau này phần backend sẽ thay ruột các hàm này bằng lời gọi thật, **không được đổi tên hàm hay kiểu dữ liệu**.

```ts
// lib/types.ts
export type GuestStatus = "pending" | "accepted" | "declined";

export interface Guest {
  id: string;
  name: string;
  slug: string;                 // chuỗi ngẫu nhiên, dùng trong link /m/[slug]
  status: GuestStatus;
  respondedAt: string | null;   // ISO
  createdAt: string;            // ISO
}

export interface Wish {
  id: string;
  guestId: string | null;       // null nếu gửi từ trang chung
  name: string;
  message: string;
  createdAt: string;
}

export interface Stats { total: number; accepted: number; declined: number; pending: number; wishes: number; }
```

```ts
// lib/api.ts — chữ ký hàm cố định
// Phía khách
getInvite(slug: string): Promise<{ name: string; status: GuestStatus } | null>   // null = link sai
submitRsvp(slug: string, status: "accepted" | "declined"): Promise<void>
submitWish(input: { slug?: string; name: string; message: string }): Promise<void>

// Phía admin
adminLogin(email: string, password: string): Promise<void>      // lỗi thì throw Error có message tiếng Việt
adminLogout(): Promise<void>
listGuests(): Promise<Guest[]>
createGuest(name: string): Promise<Guest>
createGuestsBulk(names: string[]): Promise<Guest[]>
updateGuest(id: string, patch: { name: string }): Promise<Guest>
deleteGuest(id: string): Promise<void>
listWishes(): Promise<Wish[]>
getStats(): Promise<Stats>
buildGuestLink(slug: string): string                            // trả `${origin}/m/${slug}`
```

Mock: lưu trong biến module (hoặc `localStorage` cho admin) với khoảng 12 khách mẫu, đủ ba trạng thái, và 8 lời chúc mẫu có độ dài khác nhau (có cái rất dài, cái rất ngắn) để thử giao diện.

## 6. Các Phase

### Phase 0: Khởi tạo (không cần design)
- [ ] Tạo dự án Next.js + TypeScript + Tailwind, cài Framer Motion
- [ ] Dựng cấu trúc thư mục mục 3, tạo `content/wedding.ts`, `lib/types.ts`, `lib/api.ts` (mock)
- [ ] Thiết lập **design tokens** trong Tailwind: bảng màu (nền, chữ, nhấn, viền), 2 font (tiêu đề trang trí + nội dung dễ đọc), bo góc, bóng. Nếu chưa có Figma thì chọn tông tối giản sang trọng và ghi rõ trong `TODO.md` để thay sau.
- [ ] Component nền trong `components/ui`
- [ ] `npm run build` chạy sạch

### Phase 1: Màn mở thiệp + nhạc nền
- [ ] **Màn "Chạm để mở thiệp"** toàn màn hình (phong bì hoặc ảnh bìa), hiện tên khách ngay trên đó ("Trân trọng kính mời **{tên}**")
- [ ] Bấm vào thì: phát nhạc (trình duyệt chặn autoplay, nên **phải phát sau cú chạm này**), chạy hiệu ứng mở phong bì, rồi cuộn vào nội dung
- [ ] `MusicPlayer`: nút tròn nổi góc màn hình để bật/tắt, nhạc lặp, tăng âm lượng dần (fade-in) khi bắt đầu, tự tạm dừng khi khách chuyển tab hoặc khóa màn hình
- [ ] Nếu file nhạc lỗi hoặc chưa có thì ẩn nút nhạc, trang vẫn chạy bình thường

### Phase 2: Các phần của trang thiệp
Thứ tự từ trên xuống, mỗi phần có hiệu ứng xuất hiện khi cuộn (scroll-reveal):
- [ ] **Hero**: ảnh chính, tên cô dâu chú rể, ngày cưới
- [ ] **Cặp đôi**: ảnh và tên đầy đủ, tên bố mẹ hai bên
- [ ] **Đếm ngược** đến ngày cưới (xử lý đúng múi giờ +07:00, hiển thị "Đã diễn ra" khi qua ngày)
- [ ] **Thông tin tiệc**: ngày, giờ, địa điểm, ghi chú
- [ ] **Bản đồ**: iframe Google Maps + nút "Chỉ đường" mở app Maps. Iframe tải lười (lazy), có khung chờ.
- [ ] **Gallery**: lưới ảnh kiểu masonry, bấm vào mở lightbox, vuốt trái phải để chuyển ảnh, lazy-load
- [ ] **Xác nhận tham dự (`RsvpBox`)**: hai nút "Tôi sẽ tham dự" và "Tiếc quá, mình bận mất rồi". Có trạng thái đang gửi, thành công (kèm lời cảm ơn riêng cho mỗi lựa chọn), lỗi. Khách đã trả lời rồi thì hiện trạng thái hiện tại và cho phép đổi ý. **Chỉ hiện ở `/m/[slug]`**, không hiện ở trang chung.
- [ ] **Gửi lời chúc (`WishForm`)**: ô tên (tự điền và khóa nếu vào bằng link cá nhân), ô lời chúc giới hạn 500 ký tự có bộ đếm, trường ẩn chống spam (honeypot, bỏ qua trong mock), thông báo cảm ơn sau khi gửi
- [ ] **Mừng cưới (`GiftQR`)**: mã QR đặt trong khung trang trí đẹp (viền, hoa văn, nền giấy), tiêu đề, nút "Lưu ảnh QR" (thẻ `<a download>`), ghi chú nhỏ bên dưới
- [ ] **Chân trang**: lời cảm ơn
- [ ] **Hiệu ứng nền nhẹ**: cánh hoa rơi hoặc lấp lánh. Phải tắt khi hệ thống bật `prefers-reduced-motion`, giảm số lượng trên máy yếu.
- [ ] Link sai (`getInvite` trả `null`): trang "Link thiệp không hợp lệ" thân thiện, không lộ lỗi kỹ thuật

### Phase 3: Giao diện admin
Admin chỉ cần dùng được tốt trên **cả điện thoại và máy tính**, không cần cầu kỳ như thiệp.
- [ ] **`/admin/login`**: email và mật khẩu, báo lỗi rõ ràng. Mock: chấp nhận bất kỳ thông tin nào.
- [ ] **Layout admin**: thanh tab "Khách mời / Lời chúc / Tổng quan", nút đăng xuất
- [ ] **Tab Khách mời**:
  - Bảng: Tên | Trạng thái | Phản hồi lúc | Thao tác
  - `StatusBadge` ba màu: **Chấp nhận** (xanh), **Từ chối** (đỏ), **Chưa phản hồi** (xám). Không chỉ dựa vào màu, có kèm chữ/biểu tượng.
  - Nút **Sao chép link** cho từng dòng (có toast "Đã sao chép")
  - Thêm khách bằng ô nhập tên, **nhập hàng loạt** bằng cách dán danh sách (mỗi dòng một tên, có bước xem trước)
  - Sửa tên, xóa (có hộp xác nhận)
  - Ô tìm kiếm theo tên, bộ lọc theo trạng thái
  - Trên điện thoại: bảng chuyển thành dạng thẻ (card)
- [ ] **Tab Lời chúc**: danh sách mới nhất lên đầu, hiện tên, giờ gửi, nội dung đầy đủ (xuống dòng đúng), có ô tìm kiếm
- [ ] **Tab Tổng quan**: thẻ số liệu (tổng khách, chấp nhận, từ chối, chưa phản hồi, số lời chúc) và thanh tỉ lệ
- [ ] Mọi bảng/danh sách có đủ 3 trạng thái: đang tải (skeleton), rỗng, lỗi

### Phase 4: Hoàn thiện
- [ ] Kiểm tra responsive ở 360, 390, 430, 768, 1280px
- [ ] Hiệu năng: tổng dung lượng tải lần đầu của trang thiệp (chưa tính ảnh gallery và nhạc) dưới khoảng 500KB; ảnh dùng lazy-load; nhạc chỉ tải khi cần
- [ ] Khả năng truy cập: tương phản chữ đủ, nút có nhãn, điều hướng được bằng bàn phím trong admin, hỗ trợ `prefers-reduced-motion`
- [ ] Thẻ chia sẻ (Open Graph): tiêu đề, mô tả, ảnh xem trước. Khi gửi link qua Zalo/Messenger, **không được hiện tên khách trong thẻ xem trước** chung.
- [ ] Thêm `<meta name="robots" content="noindex">` cho `/m/*` và `/admin/*`

### Phase 5: Bàn giao
- [ ] `npm run build` và `npm run lint` sạch
- [ ] `TODO.md` liệt kê: tài nguyên còn thiếu (ảnh, nhạc, QR, link Maps, thông tin tiệc), chỗ nào đang dùng placeholder
- [ ] Viết `HANDOFF.md`: danh sách các hàm trong `lib/api.ts` còn là mock, và các chỗ phần backend cần nối (đăng nhập, RSVP, lời chúc, CRUD khách)

## 7. Quy tắc làm việc

- Làm theo thứ tự Phase, xong Phase nào thì build và commit Phase đó (`feat: phase 2 – invitation sections`).
- Không tự ý đổi tên hàm hoặc kiểu dữ liệu ở mục 5. Nếu thấy cần đổi, ghi vào `HANDOFF.md` thay vì tự sửa.
- Không đưa khóa bí mật, token hay URL dịch vụ thật vào code.
- Giữ component nhỏ, đặt tên rõ ràng, comment ngắn bằng tiếng Việt hoặc Anh đều được nhưng nhất quán.

## 8. Tiêu chí hoàn thành

1. `/m/[slug]` với slug mẫu: mở thiệp, nhạc chạy sau khi chạm, mọi phần hiển thị đúng, bấm RSVP và gửi lời chúc có phản hồi.
2. Slug sai thì ra trang "link không hợp lệ".
3. `/admin` đủ ba tab, thêm/sửa/xóa/sao chép link/nhập hàng loạt đều chạy với mock.
4. Không có chữ cứng nào của đám cưới ngoài `content/wedding.ts`.
5. Build sạch, không lỗi console, mượt trên điện thoại.
