# Changelog

Newest first. One entry per update: date · what changed · why · files involved · git commit.

## 2026-11-19 · v1.14.1 · Flowery White: sửa hoa góc nền + thêm trang trí & animation ruột thiệp
- **Sửa nợ:** hai cụm hoa góc nền giờ **neo vào khung thẻ** (offset âm + `-z-10`) thay vì root overlay → luôn hiện cạnh thẻ, đúng mockup.
- **Trang trí mới:** hoa chìm opacity 10% ở hai góc **mọi section** (qua `SectionReveal`).
- **Animation mới:**
  - **Vòm cung nét đôi tự vẽ** trong Hero (SVG `pathLength`, nét olive + nét vàng kim) + hoa ở chân vòm.
  - **Đường nối timeline tự vẽ** (`scaleY` khi cuộn, lệch nhịp `index * 0.12s`).
  - Trái tim lịch: nhịp đập + quầng sáng vàng kim (đổi từ vàng chanh sang `#C9A96A`).
- **Sửa màu:** thẻ sự kiện từ nền đỏ mờ `rgba(96,14,14,0.55)` → nền kem `#FDFAF5` + viền olive; dải giờ + tiêu đề lịch theo tông olive.
- `cover.jpg` render lại (hoa góc đã hiện).
- Verified: typecheck, lint 0 error, test 78/78, build 46/46; ảnh chụp 390px bìa + ruột.
- Files: `templates/flowery-white/index.tsx`, `public/templates/flowery-white/cover.jpg`, `card_exp.md` (§30).

## 2026-11-19 · v1.14.0 · Template "Flowery White" (Xanh rêu · Hoa mộc lan)
- Thêm **`templates/flowery-white/index.tsx`** + **`public/templates/flowery-white/`** (`corner-a/b.webp`, `wreath.webp`, `name-frame.webp`, `gift.webp`, `cover.jpg`).
- **Palette (khách cấp, vì `color_code.md` rỗng):** theme `#464E25`, card `#FDFAF5`, text `#595638`, vàng kim `#C9A96A`.
- **Bìa:** nền xanh rêu + radial sáng giữa, bokeh vàng trôi chậm, hai cụm hoa mộc lan đung đưa hai góc, thẻ kem bo 10px đổ bóng, **vương miện hoa** trên tên, hoa 4 góc trong thẻ, nút viên thuốc xanh rêu viền vàng.
- **Mở thiệp:** thẻ trượt lên + mờ dần, cụm hoa góc dạt ra hai mép rồi gỡ bìa.
- **Capability:** `{ hero: false, couple: false, gallery: true }` + tone mới `flowery` cho RSVP/gift/nhạc.
- **Asset:** 3 file bị flatten nền caro → key "vô sắc + sáng" + flood từ viền (giữ được cánh hoa trắng kín).
- Verified: typecheck, lint 0 error, build 46/46; ảnh chụp 390px xác nhận bìa, vương miện hoa, nút.
- **Nợ:** hai cụm hoa ở góc **nền ngoài thẻ** chưa hiện đúng trong khung demo (container cao hơn khung) — ghi ở `card_exp.md` §30.
- Files: `templates/flowery-white/index.tsx`, `public/templates/flowery-white/*`, `templates/types.ts`, `registry.ts`, `TemplatePreviewRenderer.tsx`, `content/demo.ts`, `config/template-sections.ts`, `templates/shared/{TemplateOverlays,TemplateRsvpSection,LiveMusicFloatingButton}.tsx`, `components/invitation/GiftModal.tsx`, `card_exp.md` (§30).

## 2026-11-19 · v1.13.8 · Minimal Brown: lịch trình căn giữa
- Khối "Lịch trình ngày cưới" đang bám trái (cột nhãn `flex-1` kéo hết bề ngang). Đổi `<ol>` sang **`w-fit mx-auto`** và bỏ `flex-1` ở cột nhãn → **cả khối co lại đúng nội dung và căn giữa**, tiêu đề và timeline thẳng trục.
- Verified: typecheck, lint 0 error, build 46/46; ảnh chụp 390px xác nhận khối nằm giữa.
- Files: `templates/minimal-brown/index.tsx`.

## 2026-11-18 · v1.13.7 · Minimal Brown: bỏ huy hiệu tim, nút mảnh, mở thiệp kiểu lật mép phải + zoom
- Bỏ **huy hiệu trái tim** trên mép thẻ.
- Nút "Mở thiệp": từ khối đặc nâu → **viền mảnh `#A76B43` + nền tint 8% + chữ in hoa giãn chữ**, hợp chất giấy hơn.
- **Animation mở thiệp mới:** thẻ xoay 3D **quanh mép phải** (`transformOrigin: right center`, `rotateY: -102`, có `perspective: 1400px` trên khung cha), sau đó **toàn bộ bìa zoom lên 1.18 và mờ dần** (delay 0.55s) rồi mới gỡ bìa.
- Verified: typecheck, lint 0 error, build 46/46; chụp được **khung giữa animation** xác nhận thẻ đang xoay quanh mép phải.
- Files: `templates/minimal-brown/index.tsx`.

## 2026-11-18 · v1.13.6 · Minimal Brown: bìa làm lại theo mẫu (cành lá phủ nền)
- Bìa trước quá sơ sài (2 nhánh lá nhỏ 45% ở góc). Làm lại theo ảnh mẫu:
  - **4 cành lá lớn** phủ hai bên nền (62%/58% bề ngang, lật gương, opacity 80–95%) tạo khung tự nhiên.
  - **2 cành lá vắt chéo qua mép thẻ** (trên-trái, dưới-phải) đúng kiểu mẫu.
  - Thẻ kem `#F7F7F8` + viền chỉ kép, huy hiệu trái tim nâu, nút viên thuốc nâu `#A76B43`.
  - Chữ đặt `relative z-10` để **cành lá không che tên** (lỗi gặp ở bản đầu).
- `cover.jpg` render lại theo bìa mới.
- Verified: typecheck, lint 0 error, build 46/46; ảnh chụp 390px xác nhận tên không bị lá che.
- Files: `templates/minimal-brown/index.tsx`, `public/templates/minimal-brown/cover.jpg`.

## 2026-11-18 · v1.13.5 · Minimal Brown: chữ RSVP sang nâu #A76B43
- Khối "Xác nhận & lời chúc" đổi toàn bộ chữ sang **`#A76B43`**: heading, eyebrow, mô tả, nhãn field, giá trị ô nhập, viền ô nhập, nút phụ.
- Nút chính giữ nền `#A76B43` + chữ trắng. Ô nhập nền trắng, placeholder nâu 45%.
- Verified: typecheck, lint 0 error, build 46/46.
- Files: `templates/shared/TemplateRsvpSection.tsx`.

## 2026-11-18 · v1.13.4 · Minimal Brown: dùng đúng mã màu khách đưa
- Khách chốt palette: **main `#A76B43`**, **card `#F7F7F8`**, **button `#A76B43`**.
- Cập nhật: `BROWN`/`GOLD` = `#A76B43`, `CREAM` (thẻ) = `#F7F7F8`, `BROWN_DEEP` = `#7E4E2E`, `BEIGE` (nền trang) = `#F4EAE2`, `INK` = `#5B3B26`, `MUTED` = `#9A7A63`, `GOLD_SOFT` = `rgba(167,107,67,0.30)`.
- **Tone mới `minbrown`** cho RSVP / gift / nút nhạc (nền sáng, chữ nâu, nút nâu chữ trắng) — trước đó đang dùng `minred` (nền tối) nên lệch hẳn tông.
- `registry`: `accentSwatch` → `#A76B43`.
- Verified: typecheck, lint 0 error, build 46/46. **Chưa chụp lại được** (CDP treo) — cần khách xem trực tiếp.
- Files: `templates/minimal-brown/index.tsx`, `templates/registry.ts`, `templates/shared/TemplateOverlays.tsx`, `TemplateRsvpSection.tsx`, `LiveMusicFloatingButton.tsx`, `components/invitation/GiftModal.tsx`.

## 2026-11-18 · v1.13.3 · Minimal Brown: album dạng seamless loop ngang
- Thay lưới editorial bằng **dải ảnh chạy ngang vô tận**: 2 nhóm giống hệt nhau + `translateX(-50%)` (dùng lại `.album-track` có sẵn trong `globals.css`), ảnh 156×210, bo góc, viền vàng mảnh.
- Cùng công thức seamless đã dùng cho sổ lưu bút: **chia 2 nhóm bằng nhau**, không nhân đôi phần tử trong một flex có `gap` (sẽ lệch nửa gap ở mối nối).
- Vẫn giữ lightbox (bấm ảnh để phóng to, Esc/←/→).
- Verified: typecheck, lint 0 error, build 46/46; DOM xác nhận `animation-name: album-marquee`, dải rộng 1640px.
- Files: `templates/minimal-brown/index.tsx`.

## 2026-11-18 · v1.13.2 · Minimal Brown: 2 ảnh nằm TRÊN phong bì
- Đổi z-index hai polaroid từ `z-10` (sau phong bì) → **`z-40` (trước phong bì)** và hạ xuống ngang miệng phong bì (`bottom-[30%]` / `bottom-[34%]`) → ảnh xòe trên mặt phong bì đúng như mockup, không bị phong bì che mất.
- Verified: typecheck, lint 0 error, build 46/46; ảnh chụp 390px xác nhận 2 ảnh nằm trên phong bì.
- Files: `templates/minimal-brown/index.tsx`.

## 2026-11-18 · v1.13.1 · Minimal Brown: ảnh nằm trong bìa thư, chữ trắng, hộp quà = bao lì xì
- **Ảnh polaroid:** hạ xuống và cho chân ảnh nấp sau phong bì (`bottom-[46%]` / `bottom-[50%]`, z thấp hơn phong bì) → đúng cảm giác "ảnh nằm trong bìa thư" thay vì trôi phía trên.
- **Chữ trắng:** số ngày trong **trái tim lịch** và chữ trên nút **"Xác nhận tham dự"** đổi sang `#FFFFFF` (trước là nâu đậm trên nền nâu, khó đọc).
- **Hộp quà mừng:** dùng đúng `gift.webp` (bao lì xì) thay vì ảnh phong bì — lỗi do copy template kèm theo đường dẫn ảnh cũ.
- Verified: typecheck, lint 0 error, build 46/46; ảnh chụp 390px xác nhận polaroid đã nằm trong phong bì.
- Files: `templates/minimal-brown/index.tsx`.

## 2026-11-18 · v1.13.0 · Template "Minimal Brown" (Nâu Đất & Kem Gấm)
- Thêm **`templates/minimal-brown/index.tsx`** + **`public/templates/minimal-brown/`** (`envelope.webp`, `leafs.webp`, `gift.webp`, `cover.jpg`).
- **Palette sample từ `bìa.png`** vì `color_code.txt` để trống: be `#F1E5D9`, kem `#FBF7F0`, nâu `#5A3A22`, nâu đậm `#3A2314`, vàng nhũ `#C9A25E`.
- **Bìa:** nền be + cành lá màu nước 2 góc + bụi nhũ vàng, thẻ kem viền chỉ vàng, huy hiệu trái tim nâu, nút viên thuốc nâu.
- **Hero "Save The Date":** phong bì nâu + dấu sáp vàng, **hai ảnh chân dung trượt ra khỏi phong bì** (stagger, nghiêng nhẹ, đung đưa chậm), tên + chữ `&` mờ lớn phía sau.
- **Capability ô ảnh:** `{ hero: false, couple: true, gallery: true }` — ẩn ô "Ảnh bìa chính", **giữ 2 ô ảnh chân dung**, giữ album.
- Verified: typecheck, lint 0 error, test 78/78, build 46/46; ảnh chụp 390px bìa + hero.
- Files: `templates/minimal-brown/index.tsx`, `public/templates/minimal-brown/*`, `templates/types.ts`, `registry.ts`, `TemplatePreviewRenderer.tsx`, `content/demo.ts`, `config/template-sections.ts`, `card_exp.md` (§29).

## 2026-11-18 · v1.12.1 · Minimal Red: RSVP cùng màu thiệp + ảnh bao lì xì
- **Lỗi màu:** khối "Xác nhận & lời chúc" dùng tone `velvet` (nền `#4A0808`) nên **sáng hơn** nền thiệp `#390102`, trông như một dải lạc màu.
- **Fix:** thêm tone **`minred`** (nền `transparent` + viền vàng `#E1BC7C`, chữ `#E9D4AE`, nút kem) vào `TemplateTone`, `TemplateRsvpSection`, `LiveMusicFloatingButton`, `GiftModal`; template dùng `tone="minred"`.
- **Ảnh hộp quà → bao lì xì:** xử lý ảnh khách gửi (nền caro) thành `public/templates/minimal-red/envelope.webp` (787×700, 64KB), thay `gift-box.webp` trong template.
- Verified: typecheck, lint 0 error, build 46/46; ảnh chụp 390px xác nhận RSVP đồng màu và bao lì xì hiển thị đúng.
- Files: `templates/shared/TemplateOverlays.tsx`, `templates/shared/TemplateRsvpSection.tsx`, `templates/shared/LiveMusicFloatingButton.tsx`, `components/invitation/GiftModal.tsx`, `templates/minimal-red/index.tsx`, `public/templates/minimal-red/envelope.webp`.

## 2026-11-18 · v1.12.0 · Template "Minimal Red" + capability ô ảnh theo template
- Thêm **`templates/minimal-red/index.tsx`** + **`public/templates/minimal-red/`** (`ornament.webp`, `corner.webp`, `gift-box.webp`, `cover.jpg`).
- **Màu:** main `#390102`, vàng `#e1bc7c`; chữ vàng trên nền đỏ. Bìa: 12 sao ✦, khung chỉ vàng kép, cụm hoa vàng trên đỉnh, tên Cormorant italic, khối khách mời, **dấu triện sáp vàng** để mở, hai cánh cửa son trượt sang hai bên, chữ hiện dần bằng `clip-path`.
- **Không ảnh bìa, không ảnh chân dung** — chỉ album (đúng mô tả "minimal").
- **Capability ô ảnh (mới):** `getTemplatePhotos(templateId)` trong `config/template-sections.ts` → `{ hero, couple, gallery }`; `PhotosManager` nhận `templateId` và **ẩn ô upload** tương ứng. `minimal-red` = `{ hero:false, couple:false, gallery:true }`.
- Asset: cả 3 bị flatten nền caro → key + xoá pixel vô sắc còn sót để thành line-art vàng.
- Verified: typecheck, lint 0 error, build 46/46; ảnh chụp 390px bìa + full page, không tràn ngang.
- Files: `templates/minimal-red/index.tsx`, `public/templates/minimal-red/*`, `templates/types.ts`, `registry.ts`, `TemplatePreviewRenderer.tsx`, `content/demo.ts`, `config/template-sections.ts`, `components/dashboard/PhotosManager.tsx`, `components/dashboard/WeddingDetailView.tsx`, `app/globals.css`, `card_exp.md` (§27, §28).

## 2026-11-18 · v1.11.5 · Overlay hết "nền trắng chữ trắng"
- **Nguyên nhân:** overlay portal ra `document.body` nên **mất biến `--inv-*`** (chỉ định nghĩa trong cây thiệp) → `bg-inv-olive-btn` không hợp lệ → nền trong suốt, chữ trắng trên nền trắng.
- **Fix:** dùng **màu cứng** trong overlay: xanh ô liu `rgba(94,115,63,0.88)` cho mẫu sáng (giảm độ đục ~88% cho "vừa vừa" như khách muốn), đen `rgba(0,0,0,0.78)` cho mẫu tối; nhãn "SỔ LƯU BÚT" cũng dùng màu cứng.
- Verified: typecheck, lint 0 error, test 78/78, build 46/46.
- Files: `components/invitation/WishOverlay.tsx`, `card_exp.md` (§22.28: portal làm mất biến CSS theme).

## 2026-11-18 · v1.11.4 · Sửa mất hiệu ứng mở thiệp + overlay chỉ hiện ở cuối trang
- **Bug 1 (nặng):** 3 mẫu mới (`do-truyen-thong`, `do-ruou-vang`, `long-phung`) bấm "Mở thiệp" mất animation và **mở xong không cuộn được**. Nguyên nhân: effect đồng bộ `isOpened` có deps `[isOpened, closing]`; trang công khai **không truyền `isOpened`/`onOpenedChange`** nên khi `closing` đổi, effect chạy lại và rơi vào nhánh "đóng" → reset `closing`/`opened`/`coverGone`, khiến `opened=false` (khoá cuộn) và mất nhánh animation.
  - Fix: thêm `parentOpenedRef` — **chỉ đóng khi cha thực sự chuyển từ mở → đóng** (`if (!wasOpened) return;`).
- **Bug 2:** overlay lời chúc chỉ hiện khi cuộn tới khối "Xác nhận tham dự" vì `fixed` bị neo vào tổ tiên có `transform` (`RevealSection`).
  - Fix: `createPortal` ra `document.body` khi không ở khung preview (+ `mounted` gate), vẫn render tại chỗ khi `contained` để bám khung điện thoại.
- Verified: typecheck, lint 0 error, test 78/78, build 46/46.
- Files: `templates/{do-truyen-thong,long-phung,do-ruou-vang}/index.tsx`, `components/invitation/WishOverlay.tsx`, `card_exp.md`.

## 2026-11-18 · v1.11.3 · Nhãn "Sổ lưu bút" đổi màu theme
- Nhãn "SỔ LƯU BÚT" của overlay: trắng → **xanh ô liu trùng màu chủ đạo theme**, độ đục giảm còn **75%** (trước 90%), thêm bóng sáng nhẹ để đọc được trên nền thiệp.
- Template nền tối giữ chữ trắng 65% + bóng đen (xanh ô liu trên nền đỏ/đen sẽ gần như vô hình).
- Verified: typecheck, lint 0 error, build 46/46.
- Files: `components/invitation/WishOverlay.tsx`.

## 2026-11-18 · v1.11.2 · Overlay lời chúc: bỏ khung lớn, sát đáy, dài hơn
- Bỏ **khung lớn** bao ngoài (nền, padding, header dày) — chỉ còn **từng ô lời chúc** nổi, đúng ý khách.
- Kéo **sát đáy** (`bottom-1 left-1`) để không chừa khoảng trống dưới và che luôn badge dev ở góc trái.
- Dài hơn: 340px → **360px** (mobile) / **400px** (desktop); nhãn "SỔ LƯU BÚT" + nút × thu gọn thành hàng mảnh phía trên, chữ trắng có text-shadow.
- Vẫn cuộn dọc vô tận (`wish-marquee-y`), cao 150px, nền màu theme + chữ trắng.
- Verified: typecheck, lint 0 error, build 46/46.
- Files: `components/invitation/WishOverlay.tsx`, `card_exp.md`.

## 2026-11-18 · v1.11.1 · Overlay lời chúc: nền màu theme, góc trái, cuộn dọc
- Nền overlay đổi sang **màu chủ đạo của theme**: template sáng (basic-1/2/3, pro-1) dùng `bg-inv-olive-btn` (xanh ô liu) + **chữ trắng**; template tối dùng `bg-black/80`. Bỏ kiểu nền trong suốt cũ (chữ khó đọc).
- Dời về **góc dưới-trái** (trước ở giữa), to hơn: 300px → 340px trên desktop, chữ 12px.
- Bỏ hiệu ứng "hiện 2 lời rồi mờ đổi" → **cuộn dọc vô tận** dùng lại `.wish-marquee-y` (2 nhóm giống hệt + `translateY(-50%)`), cao 164px (~2 lời chúc), pause khi hover.
- Thẻ chỉ chiếm góc nên QR/nút ở giữa vẫn bấm được; vẫn có nút × để ẩn.
- Verified: typecheck, lint 0 error, build 46/46.
- Files: `components/invitation/WishOverlay.tsx`, `card_exp.md`.

## 2026-11-18 · v1.11.0 · Hai kiểu hiển thị lời chúc: cuối thiệp / overlay
- Thêm `content.wishDisplayStyle: "box" | "overlay"` (+ zod + normalize 2 hàm + `TemplateData`).
- **Overlay** (`components/invitation/WishOverlay.tsx`): 2 lời chúc nổi ở đáy thiệp, nền màu theme **độ đục thấp** + `backdrop-blur`, tự đổi lời chúc mỗi 7s (mờ 0,42s rồi hiện), có nút × để khách ẩn. `pointer-events-none` nên **không chặn QR/nút**; `fixed` để luôn nổi khi cuộn (trong khung preview thì bám khung máy).
- **Box** (mặc định): giữ nguyên sổ lưu bút cuộn dọc ở cuối thiệp; `WishMarquee` tự ẩn khi chọn overlay.
- Tách `usePublicWishes()` dùng chung cho cả hai kiểu (1 chỗ fetch, 1 chỗ kiểm tra điều kiện bật/ẩn section).
- Dashboard: bộ chọn **"Cuối thiệp / Overlay trên thiệp"** ở cả tab Nội dung và tab Lời chúc; xám khi tính năng tắt.
- Verified: typecheck, lint 0 error, test 78/78, build 46/46.
- Files: `components/invitation/WishOverlay.tsx` (mới), `components/invitation/usePublicWishes.ts` (mới), `components/invitation/WishMarquee.tsx`, `components/invitation/RsvpWishBlock.tsx`, `templates/shared/TemplateRsvpSection.tsx`, `components/dashboard/WishList.tsx`, `components/dashboard/WeddingInfoEditor.tsx`, `components/dashboard/WeddingDetailView.tsx`, `lib/wedding-types.ts`, `lib/wedding-data.ts`, `card_exp.md`.

## 2026-11-18 · v1.10.5 · Xoá lời chúc (đơn lẻ + hàng loạt)
- Thêm `DELETE /api/weddings/[id]/wishes` nhận `{ ids: string[] }` (lọc UUID, tối đa 500, luôn kèm `wedding_id` của chủ thiệp).
- `lib/api.ts`: `deleteWishes(weddingId, ids)`.
- Tab **Lời chúc**: mỗi thẻ có **checkbox** và **nút thùng rác** (xoá 1 lời); khi chọn ≥1 hiện thanh công cụ "Đã chọn N lời chúc" + `Chọn tất cả` / `Bỏ chọn` + nút **Xoá đã chọn**.
- Có **popup xác nhận** ("Xoá N lời chúc? … Không thể hoàn tác") với `Trở lại` / `Xoá vĩnh viễn`; xoá xong cập nhật danh sách ngay, không cần tải lại.
- Verified: typecheck, lint 0 error, build 46/46.
- Files: `app/api/weddings/[id]/wishes/route.ts`, `lib/api.ts`, `components/dashboard/WishList.tsx`, `card_exp.md`.

## 2026-11-18 · v1.10.4 · Sổ lưu bút to hơn + nút duyệt có chữ
- Tiêu đề "Sổ lưu bút - nơi lưu giữ lời yêu thương": `10px` → **14px** (mobile) / **15px** (desktop), vẫn uppercase giãn chữ.
- Khung cuộn lời chúc cao **gấp đôi**: `h-[250px] sm:h-[270px]` → **`h-[500px] sm:h-[540px]`**.
- Nút duyệt từng lời chúc: bỏ kiểu **icon con mắt trần** (khó hiểu với người dùng phổ thông) → **button có chữ**: "Hiện trên thiệp" / khi đã duyệt là "Đang hiện trên thiệp", vẫn kèm icon và hiệu ứng hover.
- Verified: typecheck, lint 0 error, build 46/46.
- Files: `components/invitation/WishMarquee.tsx`, `components/dashboard/WishList.tsx`, `card_exp.md`.

## 2026-11-18 · v1.10.3 · Sổ lưu bút cuộn DỌC, cao bằng ô xác nhận
- Khách yêu cầu cuộn **dọc** chứ không phải chạy ngang → đổi `translateX(-50%)` thành `translateY(-50%)`, hai nhóm xếp dọc, thẻ lời chúc **full width** (3 dòng chữ).
- Khung cuộn cao **bằng ô xác nhận tham dự**: `h-[250px] sm:h-[270px]` (tham số `heightClassName` để chỉnh nhanh).
- CSS: thay `.wish-marquee` bằng `.wish-marquee-y` + `@keyframes wish-marquee-y-scroll`; vẫn pause on hover và tắt khi reduced-motion.
- Verified: typecheck, lint 0 error, build 46/46; keyframes có trong CSS build ra.
- Files: `components/invitation/WishMarquee.tsx`, `app/globals.css`, `card_exp.md`.

## 2026-11-18 · v1.10.2 · Sổ lưu bút không còn biến mất sau khi xác nhận
- **Bug:** dải lời chúc nằm *trong* form RSVP nên khi khách đã xác nhận (form bị thay bằng thẻ xác nhận) thì dải biến mất — khách không xem được lời chúc của người khác nữa.
- **Fix:** chuyển `WishMarquee` ra **cuối block**, ngay dưới nút "Thay đổi lựa chọn hoặc gửi thêm lời chúc", luôn hiển thị ở cả 3 nhánh (public / personal / đã xác nhận) trong `RsvpWishBlock` và `TemplateRsvpSection`.
- Thêm tiêu đề **"Sổ lưu bút - nơi lưu giữ lời yêu thương"**, dải rộng bằng khung chứa (`w-full`, thẻ 268–300px, 3 dòng chữ), **tên người gửi in đậm**.
- Verified: typecheck, lint 0 error, build 46/46.
- Files: `components/invitation/WishMarquee.tsx`, `components/invitation/RsvpWishBlock.tsx`, `templates/shared/TemplateRsvpSection.tsx`, `card_exp.md`.

## 2026-11-18 · v1.10.1 · Đặt lại chỗ nút "Hiển thị lời chúc trên thiệp"
- Nút đầu tiên bị đặt trong "card năng lực template" (dưới danh sách kéo thả) nên chủ thiệp không thấy khi đang nhìn cụm "Hiện / ẩn phần trên thiệp".
- Chuyển về **ngay dưới lưới 8 công tắc, sát mục "Xác nhận & lời chúc"**, phía trên "Thứ tự các phần đang hiện"; xoá bản trùng ở card năng lực để chỉ còn một công tắc.
- Vẫn xám + không bấm được khi "Xác nhận & lời chúc" đang tắt.
- Verified: typecheck, lint 0 error, test 78/78, build 46/46.
- Files: `components/dashboard/WeddingInfoEditor.tsx`.

## 2026-11-18 · v1.10.0 · Một người một lời chúc + duyệt + dải lời chúc chạy trên thiệp
- **Lỗ hổng đã vá:** trước đây `POST /api/wishes` và phần lời chúc của `POST /api/rsvp` insert mù nên một khách có thể gửi vô hạn lời chúc (thoát ra vào lại là thêm bản ghi).
  - Migration `supabase/migration_v18_wish_once.sql`: thêm `wishes.author_key`, gộp bản ghi trùng (giữ mới nhất), unique index `(wedding_id, author_key)`, `wishes.approved`.
  - `lib/server/wishes.ts` → `saveWishOnce()`: tìm theo khoá rồi update, chưa có mới insert, bắt 23505; **lùi về `guest_id`** nếu DB chưa chạy migration.
  - Khoá: `guest:<id>` (link riêng) / `anon:<uuid>` (link chung, `lib/wish-author.ts`, lưu localStorage).
  - Form tự điền lời chúc cũ qua `GET /api/wishes?...&authorKey=`, hiện nhắc "sửa lại để cập nhật".
- **Tính năng mới "Hiển thị lời chúc trên thiệp":**
  - Content flags `showWishesOnCard`, `wishApprovalMode` (+ zod + normalize + `TemplateData`).
  - API: `GET /api/wishes` trả lời chúc đã duyệt (chỉ khi bật và section không bị ẩn); `PATCH /api/weddings/[id]/wishes` duyệt từng lời; `POST` với `action: "auto" | "manual"`.
  - Dashboard: toggle ở tab Nội dung **và** đầu tab Lời chúc (xám khi section "Xác nhận" bị ẩn); nút tick từng lời chúc có hover + tooltip; nút `Duyệt tay / Duyệt tự động` kèm **popup cảnh báo** trước khi bật tự động.
  - Card: `components/invitation/WishMarquee.tsx` — dải chạy ngang seamless (2 nhóm giống hệt + `translateX(-50%)`), pause on hover, tôn trọng reduced-motion; gắn vào `RsvpWishBlock` (mọi mẫu dùng `WeddingInvitationContent` + designer) và `TemplateRsvpSection` (các mẫu code mới) → **áp dụng toàn bộ thiệp**.
- Verified: typecheck, lint 0 error, test 78/78, build 46/46.
- **Chưa kiểm chứng bằng dữ liệu thật:** cần chạy migration v18 rồi thử luồng gửi 2 lần / duyệt / duyệt tự động trên thiệp thật.
- Files: `supabase/migration_v18_wish_once.sql` (mới), `lib/server/wishes.ts` (mới), `lib/wish-author.ts` (mới), `components/invitation/WishMarquee.tsx` (mới), `app/api/wishes/route.ts`, `app/api/rsvp/route.ts`, `app/api/weddings/[id]/wishes/route.ts`, `components/dashboard/WishList.tsx`, `components/dashboard/WeddingDetailView.tsx`, `components/dashboard/WeddingInfoEditor.tsx`, `components/invitation/RsvpWishBlock.tsx`, `templates/shared/TemplateRsvpSection.tsx`, `lib/api.ts`, `lib/types.ts`, `lib/wedding-types.ts`, `lib/wedding-data.ts`, `lib/server/mappers.ts`, `app/globals.css`, `card_exp.md`.

## 2026-11-18 · v1.9.2 · Sửa nút "Đóng bì thư" không hoạt động
- **Bug:** 3 template code (`long-phung`, `do-ruou-vang`, `do-truyen-thong`) chỉ đồng bộ prop `isOpened` một chiều — `if (!isOpened) return;` — nên khi dashboard đặt `isOpened = false` (nút "Đóng bì thư") thì `coverGone` vẫn `true` và bìa không quay lại.
- **Fix:** effect xử lý cả hai chiều; nhánh đóng reset `closing`, `opened`, `coverGone` để bìa mount lại với đúng trạng thái ban đầu.
- **Verified:** thêm tạm nút "Đóng bì thư" trên trang demo rồi bấm bằng CDP — cả 3 mẫu trả bìa về đúng ở cả 2 luồng (mở sẵn → đóng; mở tay → đóng); sau đó đã gỡ nút tạm.
- Files: `templates/long-phung/index.tsx`, `templates/do-ruou-vang/index.tsx`, `templates/do-truyen-thong/index.tsx`, `card_exp.md`.

## 2026-11-18 · v1.9.1 · Ảnh bìa thật cho catalog + `og:image`
- **Vấn đề:** `coverImage` của 3 mẫu mới là **SVG vẽ tay**, trong khi nó được dùng cho cả thumbnail catalog (`previewImage ?? coverImage`) và thẻ `og:image`. Hệ quả: thẻ "Long Phụng" trong `/thiep-cuoi` không có rồng/phượng dù bìa thật có; và SVG không được Zalo/Facebook render khi chia sẻ.
- **Fix:** render chính bìa thật bằng CDP (clip đúng khung thẻ, chừa lề cho hoa tràn ra ngoài), xuất JPG rộng 720px; trỏ `coverImage` sang `cover.jpg` và bỏ `cover.svg`.
- Áp dụng cho `long-phung` (95KB), `do-truyen-thong` (57KB), `do-ruou-vang` (70KB).
- Verified: typecheck, lint 0 error, build 46/46; trang `/thiep-cuoi` hiển thị đúng ảnh bìa thật cho cả 3 mẫu.
- Files: `templates/registry.ts`, `public/templates/{long-phung,do-truyen-thong,do-ruou-vang}/cover.jpg`, `card_exp.md`.

## 2026-11-18 · v1.9.0 · Template mới "Đỏ Rượu Vang" (Hoàng Kim II Đỏ)
- Thêm **`templates/do-ruou-vang/index.tsx`** (~1.440 dòng) + **`public/templates/do-ruou-vang/`** (`rose.webp`, `garland.webp`, `cover.svg`).
- **Màu khách đưa:** `#390202` nền, `#E5E4D0` chữ; dòng `golder outline: #390202` là lỗi copy nên viền vàng dùng champagne `#E5C787` (theo mô tả) + burgundy `#6E0B14`/`#8F111D` cho thẻ.
- **Bìa**: nền rượu vang + **12 sao 4 cánh ✦** nhấp nháy lệch chu kỳ, thẻ bo góc **viền kép vàng**, hai cụm hoa hồng ở góc đối xứng (trượt vào + scale 90→100%, góc dưới lật ngang), tim trong vòng kem, tên Playfair, nút kem "Mở thiệp".
- **Mở thiệp**: cả bìa fade + scale 1.04 (đúng mô tả "Fade & Scale Out"), ruột trượt lên.
- **Ruột**: hero vòm, gia đình 2 cột có chấm ✦, sự kiện thẻ viền vàng, **đếm ngược** ngày/giờ/phút/giây cập nhật mỗi giây, lịch tháng tim vàng, **album coverflow có chấm điều hướng** (tự chuyển 4,2s), dải hoa garland trước phần lời chúc, RSVP.
- **Tone mới `ruby`** cho `TemplateRsvpSection` / `LiveMusicFloatingButton` / `GiftModal` (nền `#390202`, chữ `#E5E4D0`, nút kem `#F7E7CE`); giữ nguyên `red` và `velvet`.
- **Xử lý asset**: cả 4 file PNG đều bị flatten nền caro với alpha = 255. Key theo độ vô sắc + flood-fill toàn viền + bít lỗ; `Image.fromarray` phải `.copy()` mới flood được; asset có hoa chạm mép phải mirror-pad rồi cắt lại. Kết quả: `rose.webp` 65KB, `garland.webp` 115KB.
- Đăng ký: `templates/types.ts`, `registry.ts`, `TemplatePreviewRenderer.tsx`, `content/demo.ts` (Duy Khang & Thu Hà), `config/template-sections.ts` (`couplePhotos: false`).
- Verified: typecheck, lint 0 error, build 46/46; ảnh chụp 390px (bìa + full page) không tràn ngang (`sw === iw`), đếm ngược chạy đúng.
- Files: `templates/do-ruou-vang/index.tsx`, `public/templates/do-ruou-vang/*`, `templates/types.ts`, `templates/registry.ts`, `templates/TemplatePreviewRenderer.tsx`, `content/demo.ts`, `config/template-sections.ts`, `templates/shared/TemplateRsvpSection.tsx`, `templates/shared/LiveMusicFloatingButton.tsx`, `templates/shared/TemplateOverlays.tsx`, `components/invitation/GiftModal.tsx`, `card_exp.md`.

## 2026-11-18 · v1.8.1 · Long Phụng dùng đúng mã màu khách đưa
- Khách cung cấp: **main `#69100F`, text `#E9CE91`** (trước đó `color_code.txt` rỗng nên tạm sample `#680E0E` / `#E9CE9E` từ mockup).
- Thay toàn bộ: constants template, gradient bìa, glow/hạt bụi (`rgba(233,206,145,…)`), tone `velvet` trong `TemplateRsvpSection`/`LiveMusicFloatingButton`/`GiftModal`, `accentSwatch` trong `registry.ts`, `cover.svg`.
- Suy ra: nền `#2A0605`, card đậm `#4A0B0A`, vàng đậm `#C6A45E`; chữ trên nút vàng vẫn `#3B0A0D`.
- Verified: typecheck, lint 0 error, build 46/46; computed style trong preview = `rgb(42,6,5)` nền và `rgb(233,206,145)` chữ.
- Files: `templates/long-phung/index.tsx`, `templates/shared/TemplateRsvpSection.tsx`, `templates/shared/LiveMusicFloatingButton.tsx`, `components/invitation/GiftModal.tsx`, `templates/registry.ts`, `public/templates/long-phung/cover.svg`, `card_exp.md`.

## 2026-11-18 · v1.8.0 · Template mới "Long Phụng" (Long Phụng Đỏ)
- Thêm **`templates/long-phung/index.tsx`** (~1.340 dòng) + **`public/templates/long-phung/`** (`dragon.webp`, `phoenix.webp`, `gift-box.webp`, `cover.svg`).
- **Palette** sample từ mockup vì `color_code.txt` để trống: nền `#280303`, card `#680E0E`, vàng `#E9CE9E`, kem `#FAF3E8`, mực `#3B0A0D`. Ruột thiệp **nền đỏ trầm** theo mockup pic1–pic4.
- **Bìa**: rồng trái + phượng phải (line-art vàng tách từ `asset1`), trượt vào từ hai mép, nhấp nhô lệch pha, parallax theo con trỏ, 14 hạt bụi vàng, ánh kim quét chéo, seal 囍, tên chữ nghiêng, nút vàng "Mở thiệp".
- **Mở thiệp**: rồng/phượng xoay nhẹ và dạt ra hai bên, cụm chữ scale+fade, bìa mờ dần (trễ 0.25s), ruột thiệp zoom 96%→100%.
- **Ruột**: hero khung vòm (ảnh trượt lên + ken burns 8s), sự kiện thẻ viền vàng + góc hoa văn, block ngày, lịch tháng có **tim vàng glow một lần**, dress code + timeline, **album lưới editorial** (1 ngang + 2 dọc, stagger 0.15s, tilt 3D), hộp quà, RSVP.
- **Tone mới `velvet`** cho `TemplateRsvpSection`, `LiveMusicFloatingButton`, `GiftModal` (nền đỏ trầm, chữ kem, nút vàng) — giữ nguyên tone `red` cũ.
- **Font**: Charm/Srisakdi không có glyph tiếng Việt → dùng Cormorant Garamond italic cho tên, Playfair tiêu đề, Lora nội dung.
- Đăng ký: `templates/types.ts`, `registry.ts`, `TemplatePreviewRenderer.tsx`, `content/demo.ts` (Hoài Nam & Ngọc Linh), `config/template-sections.ts` (`couplePhotos: false`).
- Verified: typecheck, lint 0 error, build 46/46, test 78/78; ảnh chụp 390 (cover, full page, 3 khung chuyển động) + 1280 (trang demo), không tràn ngang (`sw === iw`).
- Files: `templates/long-phung/index.tsx`, `public/templates/long-phung/*`, `templates/types.ts`, `templates/registry.ts`, `templates/TemplatePreviewRenderer.tsx`, `content/demo.ts`, `config/template-sections.ts`, `templates/shared/TemplateRsvpSection.tsx`, `templates/shared/LiveMusicFloatingButton.tsx`, `templates/shared/TemplateOverlays.tsx`, `components/invitation/GiftModal.tsx`, `card_exp.md`.

## 2026-11-18 · v1.7.4 · "QR album khách" chỉ hiện khi gói đã lên Pro/VIP
- **Trước đây chưa xử lý**: `getTemplateSections(templateId)` chỉ lọc theo template, nên thiệp Free vẫn thấy toggle "QR album khách" và dòng đó vẫn nằm trong danh sách kéo thả — bật/tắt không có tác dụng vì template đã gate `plan !== "free"`.
- **Nay**: `getTemplateSections(templateId, plan)` nhận thêm gói và lọc qua `PLAN_GATED_SECTIONS` (`albumQr` chỉ từ Pro). Thiệp Free không còn toggle đó; nâng gói xong tải lại dashboard là nút xuất hiện, giữ đúng vị trí cũ trong `sectionOrder`.
- Cả hai danh sách (grid toggle ở `WeddingInfoEditor`, panel nhanh ở `WeddingDetailView`) đều truyền `wedding.plan`.
- Thêm test `tests/template-sections.test.ts` (4 ca: Free/Pro/VIP, phần khác không đổi, mặc định, `do-truyen-thong`).
- Verified: typecheck, lint 0 error, test **78/78**, build 46/46.
- Files: `config/template-sections.ts`, `components/dashboard/WeddingInfoEditor.tsx`, `components/dashboard/WeddingDetailView.tsx`, `tests/template-sections.test.ts` (mới), `card_exp.md`.

## 2026-11-18 · v1.7.3 · Ghi kinh nghiệm fix bug vào `card_exp.md`
- Thêm **§22 Nhật ký lỗi & cách tránh** vào `card_exp.md`: 19 mục dạng triệu chứng → nguyên nhân → fix, gồm key dashboard/template lệch nhau, `order` trong flex nuốt footer, bìa absolute trong trang dài, ảnh lazy thiếu kích thước, bảng rộng, hỏng UTF-8 do PowerShell, backtick trong here-string, Chrome headless cắt ảnh, HTML5 drag trên mobile, prefetch làm tăng lượt xem, VietQR lộ gói Free, Motion/LazyMotion, animation hai lớp, góc xoay cộng dồn, reduced-motion, ref trong render, mẹo test `?opened=1`, checklist thêm section, và môi trường build/deploy (EPERM, nhãn Low integrity, wrangler login).
- `SKILL.md`: thêm `card_exp.md` vào mục "Where to look" để session sau đọc trước khi làm mẫu mới.
- Files: `card_exp.md`, `.dsh/skills/inviwedd-project-map/SKILL.md`.

## 2026-11-18 · v1.7.2 · Kéo thả thứ tự trên mobile + nút album rõ hơn
- **Kéo thả section**: HTML5 `draggable/onDragStart` không chạy trên cảm ứng nên mobile không kéo được. Đổi sang **Pointer Events** (`pointerdown` trên tay nắm + `pointermove` + `elementFromPoint`), thứ tự tạm giữ ở state, **nhả tay mới ghi `sectionOrder`** nên không spam `onDraftChange`.
- **Tay nắm rõ hơn**: icon `GripVertical` trong ô 32×32 có viền/nền, `touch-action: none`, hover + active đổi màu; hàng đang kéo có viền accent + nền accent-soft.
- **Album**: hai nút trước/sau đổi từ nền kem mờ sang **nền đỏ `#800000`, mũi tên màu ngà `#ffeed2`**, 40×40 + đổ bóng; đặt trong overlay `max-w-[560px]` nên bám khung album thay vì trôi ra mép khi màn hình rộng; vẫn **ẩn ở mobile**.
- Verified: typecheck, lint 0 error, test 74/74, build 46/46; CDP: nút `display:none` ở 390px, `flex` ở 1280px, nền `rgb(128,0,0)`, icon `rgb(255,238,210)`.
- Files: `components/dashboard/WeddingInfoEditor.tsx`, `templates/do-truyen-thong/index.tsx`.

## 2026-11-18 · v1.7.1 · "Sự kiện" hết kẹt cuối trang + dashboard chỉ hiện phần có thật
- **Gốc lỗi**: template dùng key `events` còn dashboard dùng `map` → `orderOf("events")` trả 99 nên luôn nằm cuối trang, và toggle ẩn/hiện `map` không có tác dụng. Nay template dùng `map`, gate `!hidden.has("map")`, default order đổi `events` → `map`.
- **Đổi tên**: nhãn dashboard "Sự kiện & bản đồ" → **"Sự kiện và chỉ đường"**, gom về `SECTION_LABELS`.
- **Capability map**: thêm `config/template-sections.ts` (`sections`, `couplePhotos`, `hostFirst`). Cả **hai** danh sách toggle (grid trong `WeddingInfoEditor` và panel nhanh trong `WeddingDetailView`) đều lọc theo template; `do-truyen-thong` khai báo `couplePhotos: false` nên ẩn nút "Hiện ảnh cô dâu & chú rể".
- **`hostFirst` hoạt động thật**: `FamilySection` đổi cột trái/phải theo `data.hostFirst` (trước đây bỏ qua, nút bấm không có tác dụng).
- **UI nhạc**: bỏ pill "Nâng cấp lên Pro để upload file nhạc" ở header và bỏ dòng "Chỉ gói Pro/VIP."; chỉ còn nút nâng cấp trong khối "Nhạc riêng của bạn".
- **`card_exp.md`**: thêm §21 — mỗi template có bộ thành phần riêng, key phải khớp dashboard, khai báo ngoại lệ tập trung, nút nâng cấp chỉ đặt một chỗ.
- Verified: typecheck, lint 0 error, test 74/74, build 46/46.
- Files: `config/template-sections.ts` (mới), `components/dashboard/WeddingInfoEditor.tsx`, `components/dashboard/MusicEditor.tsx`, `templates/do-truyen-thong/index.tsx`, `card_exp.md`.

## 2026-11-18 · v1.7.0 · Giới hạn 30 **lượt mở** mỗi link thiệp Free
- **Đổi cách đếm**: trước đây đếm unique browser bằng cookie `invite_view_key` (cùng máy F5 bao nhiêu lần cũng = 1). Nay đếm **mỗi lượt mở**: RPC `track_guest_view_open(p_guest_id uuid)` `+1` vào `guests.view_count` và trả tổng. Vẫn fail-open khi migration chưa chạy.
- **Bỏ cookie**: xoá khối set cookie trong `proxy.ts` và hằng `INVITE_VIEW_COOKIE`; `/m/[slug]` chỉ còn đọc `user-agent` để bỏ qua bot/Zalo/Facebook preview.
- **UI dashboard**: thêm dòng nhắc nhỏ ngay **dưới thanh tìm kiếm** trong tab Khách mời, chỉ hiện với gói Free: “Mỗi link thiệp custom có **30 lần xem** tất cả. Nâng cấp lên Pro để miễn giới hạn này.” kèm nút **“Nâng cấp lên gói Pro”** (link `/#bang-gia`).
- **Migration v17 (rev 2)**: thay hàm cũ bằng `track_guest_view_open`, `drop function if exists track_guest_view(uuid, text)`; giữ nguyên bảng `guest_views` cũ (không xoá dữ liệu).
- **Chống đếm ảo**: `SeatingLookupClient` dùng `<Link href="/m/...">` nên Next prefetch sẽ render server và cộng lượt dù khách chưa mở — đã thêm `prefetch={false}`. Các link `/m/` còn lại trong dashboard đều là `<a target="_blank">` nên không prefetch.
- Verified: typecheck, lint 0 error, build 46/46. Chưa chạy migration nên giới hạn vẫn **chưa có hiệu lực** trên production.
- Files: `supabase/migration_v17_invite_limits.sql`, `lib/server/invite-limits.ts`, `app/m/[slug]/page.tsx`, `proxy.ts`, `components/dashboard/GuestTable.tsx`.

## 2026-11-18 · v1.6.2 · Sửa bố cục "Đỏ - Truyền thống" theo phản hồi
- **Dấu `&` tách dòng**: dòng phụ huynh render tách tại `&` → "Ông A" / "& Bà B" (không để `&` nằm cuối dòng); tên cô dâu chú rể giữ 3 dòng; `&` dùng chung font serif với tên.
- **Bỏ lần hiện ngày đầu tiên**: khối gia đình không còn ngày/giờ/địa điểm (đổi tiêu đề thành "Thông tin gia đình"); ngày chỉ còn ở **Sự kiện** và **Thông tin tiệc cưới**.
- **Hero gọn để trọn ảnh trong màn hình đầu**: "LOVE NEVER FAILS" đặt đè lên đỉnh vòm thay vì chiếm dòng riêng; khung ảnh 3:4 → **2:3** (thấy nhiều hơn), `max-w` 280/340/420; giảm padding và bỏ dòng tên sự kiện.
- **Album**: tự chuyển 1 ảnh mỗi **1,5 giây** (thay vì trôi liên tục), vòng lặp modulo nên không khựng; giữ 2 nút trước/sau nhưng **ẩn trên mobile** (`hidden sm:flex`); tạm dừng khi hover / tab ẩn / ra khỏi màn hình; chỉ ảnh giữa bấm được.
- **`card_exp.md`**: thêm §20 quy ước tên & ngày (3 dòng tên, `&` mở đầu dòng phụ huynh, ngày chỉ 2 chỗ, ảnh hero trọn người).
- Verified: typecheck, lint 0 error, test 74/74, build 46/46; CDP ở 390px: nút album `display:none`, ở 1280px `display:flex`; transform ảnh đổi sau 1,7s → auto-advance chạy.
- Files: `templates/do-truyen-thong/index.tsx`, `card_exp.md`.

## 2026-11-18 · v1.6.1 · Vá lỗ hổng VietQR + hoàn thiện "Đỏ - Truyền thống"
- **VietQR trở thành tính năng Pro/VIP**: `GiftModal` chỉ render `VietQRGiftBox` khi `plan !== "free"`; gói Free không còn QR tự sinh (chỉ số tài khoản / lời chúc). Bên nào đã tự tải ảnh QR thì **bỏ VietQR của bên đó** để không hiện trùng.
- **Bìa**: bỏ đường kẻ vàng giữa hai cánh (đổi gradient hai cánh cùng chiều nên không lộ mối nối); thêm tiếng "ting" tổng hợp bằng Web Audio khi bấm Mở thiệp — không thêm file âm thanh.
- **Animation theo `animation_guide`**: thêm `SectionReveal` (fade-in up 0,75s, chạy một lần) cho mọi section — trước đó thiệp gần như không có hiệu ứng cuộn.
- **Hero**: bỏ dòng tên sự kiện dưới ảnh; khung vòm trên desktop lớn hơn (`md:max-w-[440px]`), viền mảnh 2px màu `#fff7eb`.
- **Chữ "&"** ở khối tên dùng chung font serif với tên; **lịch**: bỏ chấm tròn, thay bằng trái tim đỏ lớn + số ngày màu trắng.
- **Album**: coverflow vòng liền mạch bằng `requestAnimationFrame` (vị trí thực + khoảng cách modulo, ~24s/vòng), tạm dừng khi hover / tab ẩn / ra khỏi màn hình; reduced-motion dùng chế độ tĩnh có nút điều hướng.
- Verified: typecheck, lint 0 error, test 74/74, build 46/46; chụp ảnh 390px **và** 1280px; mở popup hộp quà ở gói Free bằng CDP → `VietQR: false`, 0 ảnh vietqr.
- Files: `components/invitation/GiftModal.tsx`, `templates/do-truyen-thong/index.tsx`.

## 2026-11-18 · v1.6.0 · Template mới "Đỏ - Truyền thống" (`do-truyen-thong`)
- **Template code mới** `templates/do-truyen-thong/`: bìa hai cánh trượt + 12 chữ 囍 trôi (khoá cuộn, tôn trọng reduced-motion), hero ảnh vòm + chữ "LOVE NEVER FAILS" theo cung, thông tin lễ 2 họ, **Sự kiện** (mỗi lễ một thẻ chỉ vàng theo theme), tiệc + lịch tháng có tim + "Thêm vào lịch", dress code + **lịch trình lấy từ `data.timeline`** (sửa ở dashboard), **album coverflow 3D + lightbox portal**, QR album, hộp quà mở popup, RSVP.
- **Meal lock**: `TemplateRsvpSection` đọc `data.mealMode` — `meat`/`veg` khoá đúng 1 lựa chọn, `both` mới cho chọn (trước đây chỉ `RsvpWishBlock` có; nay cả 2 hệ thống cùng quy tắc).
- **QR album theo gói**: chỉ render khi `plan !== "free"` **và** có `weddingSlug` **và** không nằm trong `hiddenSections` (dashboard đã có toggle "QR album khách").
- **Tone `red` mới** cho `GiftModal`, `TemplateRsvpSection`, `LiveMusicFloatingButton`, khớp #800000 / #fff7eb / #c9a24a.
- **Album phá cách**: coverflow 3D (`perspective` + rotateY/scale), dots + nút mũi tên, lightbox `createPortal` (Esc/←/→, khoá scroll).
- **Asset**: `gift-box.webp` 80KB (tách nền trắng từ asset khách bằng flood-fill + Pillow), `cover.svg` cho catalog.
- **Demo**: thêm cặp Gia Khánh/Quỳnh Anh; `/mau/<id>?opened=1` mở sẵn thiệp để QA/chụp ảnh.
- Verified: typecheck, lint 0 error, test 74/74, build 46/46; chụp ảnh thật ở đúng 390px bằng CDP (layout width 390, không tràn ngang).
- Files: `templates/do-truyen-thong/index.tsx` (mới), `public/templates/do-truyen-thong/{cover.svg,gift-box.webp}` (mới), `templates/{types,registry,TemplatePreviewRenderer}.ts(x)`, `templates/shared/{TemplateRsvpSection,TemplateOverlays,LiveMusicFloatingButton}.tsx`, `components/invitation/GiftModal.tsx`, `components/demo/template-demo-viewer.tsx`, `app/mau/[templateId]/page.tsx`, `content/demo.ts`.

## 2026-11-17 · v1.5.3 · Xóa hàng loạt khách mời + bảng khách gọn trong 1 màn hình
- **Thanh thao tác hàng loạt** có thêm nút **Xóa** (variant `danger`) cạnh "Bỏ chọn" và "Gán buổi lễ"; bấm vào mở Dialog xác nhận, xóa xong tự bỏ chọn, cập nhật tổng và lùi trang nếu trang hiện tại trống.
- **API:** thêm `DELETE /api/weddings/[id]/guests/bulk` nhận `{ ids: string[] }`, lọc UUID hợp lệ, `.eq("wedding_id")` để không xóa chéo thiệp, tối đa 500/lần. Client: `deleteGuests()` trong `lib/api.ts`.
- **Bảng khách vừa 1 màn hình:** cột "Thao tác" thành `sticky right-0` (luôn thấy, không phải kéo ngang) + nền theo `group-hover`; hai nút "Chép link"/"Chép lời mời" chuyển sang `size="icon"` có `title`/`aria-label`; padding `px-4 → px-3`; header rút gọn ("Bài hát", "Lễ mời", "Phản hồi"); cột "Phản hồi" ẩn dưới `xl`; tên khách `max-w-[180px] truncate`, bài hát `max-w-[140px]`, chip lễ mời `max-w-[220px]` + `truncate` để nội dung dài không đẩy bảng rộng ra.
- Verified: typecheck, lint 0 error, test 74/74, build 46/46.
- Files: `components/dashboard/GuestTable.tsx`, `lib/api.ts`, `app/api/weddings/[id]/guests/bulk/route.ts`.

## 2026-11-17 · v1.5.2 · Vườn Ô Liu: mềm hơn + hiện từng phần tử
- **Nhịp chậm lại:** hero spring `stiffness 85 / damping 17 / mass 1,05` (trước 130/20/0,9, dưới ngưỡng tới hạn nên không nảy); polaroid `70/16/1,2`; stagger `0,075 → 0,11`; `delayChildren 0,04 → 0,08`; dấu "&" trễ `0,5s`.
- **Bìa:** cửa `0,65 → 0,8s`, cửa phải trễ `80ms`, `ENVELOPE_DISMISS_MS 620 → 820`, nền nội dung `420 → 560ms`.
- **Bỏ hiệu ứng cả khối (đúng yêu cầu "từng phần tử"):** với `basic-1`, `RevealSection` không còn animate khối (`animate={undefined}`); một effect sau mount gán `--olive-delay` tăng dần cho từng `h1–h4 / p / label / img` (`95ms`, chặn ở 8 phần tử), CSS đọc bằng `animation-delay: var(--olive-delay)`. `olive-text-slide 0,8 → 1,15s` (translate `18 → 16px`), `olive-image-fade 0,8 → 1,2s`.
- Template khác giữ nguyên hành vi cũ (mọi thay đổi nằm sau điều kiện `isOlive`).
- Verified: typecheck, lint, test 74/74, build 46/46; `/mau/basic-1` 200 (8 section `.olive-reveal`), CSS build có `animation-delay:var(--olive-delay,0s)`.
- Sự cố đã xử lý: một lần round-trip `Get-Content`/`Set-Content` của PowerShell làm hỏng UTF-8 của `InvitationShell.tsx`; đã `git checkout` khôi phục rồi làm lại bằng công cụ edit. Không còn mojibake trong repo.

## 2026-11-17 · v1.5.1 · tinh chỉnh animation Vườn Ô Liu (local, chưa deploy)
- **Hero:** spring thay tween 1,5s (`stiffness 130 / damping 20 / mass .9`); stagger `.16→.075`, `delayChildren .12→.04`, `y 22→18`; polaroid rơi + nghiêng `−8° → −3,5°` (bỏ `-rotate-[3.5deg]` ở div trong để hai góc không cộng lại); dấu "&" nảy trễ 0,35s; thêm guard `useReducedMotion`.
- **Bìa:** cửa `0,9s → 0,65s`, ease `.16,1,.3,1`, cửa phải trễ 60ms; `ENVELOPE_DISMISS_MS 900 → 620`; nền nội dung `850ms → 420ms` ⇒ thời gian chờ tới khi hero đứng yên ~3,16s → ~1,9s.
- **Petals:** 3 lớp chiều sâu (far/mid/near) khác size, blur, zIndex, tốc độ; 10→7 cánh desktop, 5→4 mobile.
- **Reveal:** Vườn Ô Liu bỏ trượt hai lớp — khối chỉ mờ `0,45s`, chữ/ảnh bên trong `olive-text-slide 1,5s → 0,8s` (translate 22→18px). Template khác giữ nguyên 1,5s (đổi có điều kiện `isOlive`).
- **CSS:** thêm `prefers-reduced-motion` cho `.olive-reveal` (trước đây thiếu → vẫn chạy 1,5s); heartbeat `1,13 → 1,06`; `inv-pill-pulse` (animate `box-shadow` = repaint mỗi frame) → `.inv-cta-pulse` dùng `::after` opacity/transform trên compositor, 3,2s.
- Verified: typecheck, lint 0 error, test 74/74, build 46/46; `/mau/basic-1` 200; CSS build chứa `inv-cta-ring` + `olive-text-slide .8s`.
- Files: `components/invitation/{OliveGardenHero,Envelope,InvitationShell,Petals,RevealSection,EventDetails}.tsx`, `app/globals.css`.

## 2026-11-17 · v1.5.0 · Motion v14 thay framer-motion + LazyMotion
- `framer-motion@12.43.0` → `motion@14.14.0` (cùng engine; `motion` chỉ là wrapper của `framer-motion`). 13 file đổi `from "framer-motion"` → `from "motion/react"`, `motion.*` → `m.*`.
- Thêm `MotionProvider` (`LazyMotion features={domAnimation} strict`) và bọc tại đúng 2 điểm render: `TemplatePreviewRenderer` + nhánh `basic-1` của `LiveTemplateRenderer` (không bọc root layout để khỏi tải animation cho landing/dashboard/ops).
- Đo bằng esbuild (cùng import, minify+gzip): `motion` 48.9KB → `m`+`domAnimation` 33.6KB (−15.3KB, −31%).
- Designer giữ nguyên CSS keyframes, không đụng tới `element-animator.tsx`/`animation-catalog.ts` (xem decisions "Template motion").
- Verified: typecheck 0, lint 0 error, test 74/74, build 46/46 route; `/` prerender qua provider `strict`, `/mau/basic-2` 200.
- Môi trường: `/w/aaaaa` 500 vì Supabase "Unregistered API key" trong `.env.local` (có sẵn, không liên quan thay đổi này).
- Files: `package.json`, `package-lock.json`, `components/theme/MotionProvider.tsx` (mới), `templates/TemplatePreviewRenderer.tsx`, `templates/LiveTemplateRenderer.tsx`, 8 template + 5 `components/invitation/*`.

## 2026-11-15 · v1.4.9 · map card theo mẫu + màu map/RSVP
- `DesignerMapBlock` mới: title lễ, “Vào lúc giờ · thứ”, ngày lớn `DD`, tháng/năm hai bên có đường kẻ, âm lịch, venue + địa chỉ, nút **CHỈ ĐƯỜNG** dạng pill.
- Dữ liệu event: `eventTitle`, `eventTime`, `eventWeekday`, `eventDay/Month/Year`, `eventLunar`, `eventVenueName`, `eventAddress`; lấy từ `wedding.events`.
- Designer chỉnh **màu chữ, màu nền, màu nút map**; thêm **Màu nhấn nút / RSVP** toàn thiệp (`canvas.accentColor`), RSVP dùng accent đó.
- Verified typecheck, lint 0 error, test 54/54, build; deploy `babddcad`.
- Follow-up `5d3ddef9`: thêm dòng lễ 2 + link chỉ đường lễ 2 trong map card.

## 2026-11-15 · v1.4.8 · mở khoá scroll sau bìa + palette RSVP sáng
- **Scroll sau bìa:** body/html bị `overflow:hidden` khi cover mount; component chỉ `return null` sau animation nên cleanup không chạy. Thêm `restorePageScroll` gọi khi `hidden` và lưu previous overflow.
- **RSVP light theme:** `.designer-rsvp-theme` set đủ `--inv-*` sáng; RSVP không còn chữ trắng/ô chọn trắng trên nền sáng.
- Bổ sung trực tiếp `--color-inv-*` trong `.designer-rsvp-theme` (Tailwind dùng biến `--color-*`; chỉ set `--inv-*` không đủ) → deploy `c79d4ca3`.
- Verified typecheck, lint 0 error, test 54/54, build; deploy `c30eeb30`.

## 2026-11-15 · v1.4.7 · calendar không bị che
- Thu gọn `DesignerCalendar`: bỏ ô `aspect-square`, dùng cell 12px, font 7–10px, gap 1px; header tháng/ngày và lưới nằm gọn trong block `hPct`.
- Verified typecheck, lint 0 error, test 54/54, build; deploy `b6ee72de`.

## 2026-11-15 · v1.4.6 · /w designer, blocks thật, RSVP chuẩn, cover fix
- **`/w/<slug>`:** bỏ `includeDesignerTemplate: false`; link chung/mở trang thiệp giờ render đúng mẫu Designer, không còn rơi về template code “Ô Liu xanh”.
- **Block calendar:** lưới tháng thật, tô ngày cưới + trái tim, weekday/giờ; `dateIso` truyền từ content. Editor có **Màu nền khối**.
- **Block map:** lấy `values.venue` từ event/địa điểm dashboard, nút **Chỉ đường** dùng `mapDirectionsUrl` hoặc Google Maps query.
- **Block RSVP:** anchor `#rsvp-wishes`; `DesignerInvitation` tự render `RsvpWishBlock` chuẩn (RSVP + lời chúc) khi có `data`, kể cả khi canvas không có block RSVP.
- **Cover:** upload dùng asset kind `background` (tránh CHECK constraint `cover` gây 500), có icon select + preview full khung 390×844.
- Verified test 54/54 (updated designer values expected), typecheck, lint 0 error, build; deploy `5a0140b3`.
- Follow-up `72cf8f02`: map block supports second ceremony (`venue2`/`mapUrl2`); production `/w/thiep` and `/m/c791755a4ddb` verified Designer + RSVP, no code fallback.

## 2026-11-15 · v1.4.5 · /ops retry + custom photo slot + photos-tab fields
- **/ops không cần F5:** `OpsLayout` retry `getOpsMe` 4 lần (250/500/750/1000ms) khi Auth0 v4 chưa kịp trả access token; chỉ 404 sau khi hết retry.
- **Khung ảnh:** thêm slot `custom` — “Ảnh tùy chọn (khách tự tải)”; ảnh mới mặc định custom + `guestField`, tránh duplicate hero/groom/bride. Input **Xoay (độ)** cho cả ảnh PNG và khung ảnh; renderer/canvas đã áp rotation.
- **Dashboard tab Ảnh cưới:** section “Ảnh theo mẫu thiết kế” hiện theo `Nhãn ô ảnh`; upload nén → lưu ngay `content.designerFields` qua `updateContent`; parent đồng bộ draft/content.
- `buildDesignerInviteValues` map custom fields thành `field:<elementId>`; public renderer thay ảnh.
- Verified typecheck, lint 0 error (124 warning), test 54/54, build; deploy `180b48a9` (retry window 6 attempts).

## 2026-11-15 · v1.4.4 · dashboard preview Designer dữ liệu thật
- Bỏ iframe sample `/mau/designer/<id>/embed` trong dashboard; render `DesignerInvitation` trực tiếp từ `designerCanvas` + `draftContent`.
- Đổi tên cô dâu/chú rể, ngày, ảnh custom → preview cập nhật ngay; cover ẩn (`showCover={false}`).
- `handleDesignerAssignment` refetch wedding để lấy `designerCanvas` mới, field ảnh xuất hiện ngay.
- Verified typecheck, lint 0 error (124 warning), test 54/54, build; deploy `d5c7eebb`.

## 2026-11-15 · v1.4.3 · picker đồng nhất + preview Designer + field ảnh khách
- **Bỏ badge “Designer”** khỏi dashboard; chỉ còn plan (Free/Pro/VIP) và theme filter. Designer subtitle dùng ritual, không còn “Thiết kế riêng”.
- **Dashboard phone preview** dùng iframe `/mau/designer/<id>/embed` khi thiệp gán Designer; hết cảnh preview hiện template code.
- **Create flow** nhận `designerTemplate`, fetch option công khai, hiển thị đúng tên/plan và preview Designer; chọn lại mẫu code thì bỏ Designer. Không còn mặc định “Vườn Ô Liu”.
- **Field ảnh khách:** `DesignerElementBase.guestField`; property panel Ảnh/Khung ảnh có “Khách thay ảnh” + nhãn. `WeddingContent.designerFields` lưu data URL đã nén; API wedding detail trả `designerCanvas`; dashboard hiện section “Ảnh theo mẫu Designer”; renderer public dùng `field:<elementId>` từ `buildDesignerInviteValues`.
- Verified typecheck, lint 0 error (124 warning), test 54/54, build; deploy `7d82fa3b`.

## 2026-11-15 · v1.4.2 · dashboard gộp mẫu Designer vào picker
- Bỏ card “Mẫu thiết kế Designer” riêng trong dashboard; `WeddingInfoEditor` tải `listDesignerTemplateOptions` và gộp mẫu Designer vào cùng danh sách “Mẫu giao diện thiệp” với 25 mẫu code.
- Search/theme filter áp dụng chung; “phấn đào” tìm thấy Đào Phấn. Chọn Designer gán ngay qua API; chọn mẫu code tự bỏ gán Designer; hiển thị badge Designer/Đang gán.
- Header picker hiển thị mẫu Designer đang dùng + version mới nhất; bỏ nút “Cập nhật lên vN”.
- Verified typecheck, lint 0 error (124 warning), test 54/54, build; deploy `dedab4f2`.

## 2026-11-15 · v1.4.1 · dùng mẫu designer trực tiếp + tự động bản mới nhất
- **“Dùng thiệp này”** cho mẫu designer chuyển từ `/dashboard` sang `/tao-thiep?designerTemplate=<id>`; tạo thiệp xong tự gọi `assignDesignerTemplate` với version mới nhất. Draft sau login giữ `designerTemplateId` để `SaveDraftPageClient` gán tiếp.
- **Bỏ pin cũ khi đọc thiệp công khai:** `getPinnedDesignerTemplate` luôn lấy version mới nhất (`getDesignerVersion(id)`), nên publish v10 là thiệp khách tự dùng v10; không cần “Cập nhật lên vN”.
- Xóa nút “Cập nhật lên vN” và copy “đang ghim” trong dashboard; hiển thị “Tự động dùng bản mới nhất”.
- Verified typecheck, lint 0 error (124 warning), test 54/54, build; deploy `4c667601` (final badge/flow build).

## 2026-11-15 · v1.4.0 · bộ bìa thiệp + 3 animation mở thiệp
- Thêm `DesignerCanvasContent.cover` (`template`, `imageUrl`, `title`, `subtitle`, `buttonLabel`); canvas tab **Bìa** để chọn mẫu, upload ảnh (asset kind `cover`), sửa chữ.
- 3 mẫu bìa: **Rèm đôi** (kéo hai bên hoặc bấm), **Thiệp mở** (xoay mở như thiệp giấy), **Mờ dần** (fade vào nội dung).
- Bìa là bộ animation riêng (`components/designer/designer-cover.tsx`), không dùng `ElementAnimator`; khóa scroll nền khi bìa mở; tự unmount sau animation.
- `DesignerInvitation` nhận `showCover` (default true); `/mau/designer/<id>/embed` truyền `showCover={false}` để preview catalog không bị chặn.
- Manual CDP test 390×844: cả 3 mẫu mở được; split kéo từ giữa sang phải mở được.
- Verified typecheck, lint 0 error (124 warning), test 54/54, build; deploy `0aa25e96`.

## 2026-11-15 · v1.3.9 · sidebar 2 tab Element / Layer
- Panel phải chia **Tab Element** và **Tab Layer**; tab header sticky trong panel scroll.
- **Tab Element:** bảng “Thứ tự element” ở trên (số thứ tự, badge L1/L2, ↓/↑/đáy/đỉnh), thuộc tính element đang chọn ở dưới; nút “+ Text box placeholder” cuối tab.
- **Tab Layer:** chỉ bảng layer (Layer 1..n, số element, dropdown chuyển layer, + Thêm layer).
- Canvas vẫn layout cũ 390×844, trang cuộn bình thường, panel sticky + `max-h` scroll.
- Verified typecheck, lint 0 error (124 warning), test 54/54, build; deploy `b7efe796`.

## 2026-11-15 · v1.3.8 · quay lại canvas cũ, giữ panel thuộc tính scroll
- Revert auto-scale/one-screen (`a571239a`): artboard quay lại **390×844 cố định**, trang cuộn bình thường; bỏ `ResizeObserver`, outer scaled wrapper, fixed viewport height.
- Giữ **aside Thuộc tính sticky** (`lg:sticky lg:top-4`) với `lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto`; panel dài tự cuộn, không kéo canvas.
- Giữ 2 bảng “Thứ tự element” + “Layer 1..n”, layer sort, publish-save, falling click-through.
- Verified typecheck, lint 0 error (124 warning), test 54/54, build; deploy `4d34615e`.

## 2026-11-15 · v1.3.7 · canvas gọn 1 màn hình + bảng thứ tự & bảng layer
- **Editor desktop gọn 1 viewport**: page `lg:h-[calc(100dvh-8rem)]`, grid `flex-1 min-h-0`; artboard 390×844 auto-scale (`ResizeObserver`, transform scale) để luôn nằm trong vùng trái; panel phải `overflow-y-auto` cuộn riêng.
- Local 1917×926: `document.scrollHeight = 926` (không scroll trang), board 266×576 (scale 0.683), board rect không đổi khi click; sidebar 600px client / 1800px scroll.
- **Data model:** `DesignerElementBase.layer` (mặc định 1; layer lớn hơn nằm trên). `sortDesignerElementsByLayer` dùng chung cho canvas, renderer public và export.
- **2 bảng riêng:** “Thứ tự element” (z-order, ↓/↑/đáy/đỉnh, badge L1/L2) và “Layer (n)” (group Layer 1..n, dropdown đổi layer, + Thêm layer). Có thể đưa ảnh xuống layer dưới box/text.
- **Falling effect:** public wrapper/canvas `pointer-events:none`, khách bấm được RSVP/nút phía dưới; trong editor vẫn chọn được. Layer thường nằm trên nút có thể chặn click.
- Verified typecheck, lint 0 error (124 warning), test 54/54, build; deploy `a571239a`.

## 2026-11-15 · v1.3.6 · canvas không còn giãn khi chọn field
- **Root cause:** grid/flex items mặc định `stretch`; khi panel Thuộc tính mở rộng, cột phải cao lên → cột trái và artboard bị kéo cao từ 844px lên 1633.75px; `aspect-ratio` bị bỏ qua, `top:%` giãn ra → field “tách ra xa”.
- Fix: `grid items-start`, flex `items-start`, board `self-start`; width vẫn `390px`, height giữ 844px.
- Local CDP verify: board/selected text rect y giữ nguyên trước/sau click; height 844 cả hai.
- Deploy `1e6c865b`.

## 2026-11-15 · v1.3.5 · canvas ổn định kích thước + layer reorder + falling click-through
- **Canvas không còn co/giãn khi chọn field**: artboard đổi từ `w-full max-w-[390px]` sang **390px cố định** (`max-w-full` chỉ co trên màn hình hẹp), thêm `touch-manipulation`; panel/layers không làm đổi container query nên text không bị “phóng to”.
- **Layer reorder**: panel Layers có nút xuống/lên/đáy/đỉnh cho từng element; array order = z-order (sau nằm trên). Ảnh có thể đưa ra sau box/text; badge animation giữ nguyên.
- Falling effect vẫn **pointer-events:none** trên thiệp công khai (cả box lẫn page scope), nên khách bấm được RSVP/nút bên dưới; chỉ trong editor mới chọn được.
- Verified: typecheck, lint 0 error (124 warning), test 54/54, build; deploy `fb3de3ff`.

## 2026-11-15 · v1.3.4 · auto preview mẫu designer trên homepage
- **Selected designer card tự chạy preview trên desktop**, không cần hover: carousel mount một iframe `/mau/designer/<id>/embed`, tự cuộn body; hover card khác vẫn preview; mobile giữ cover trang đầu.
- Designer templates prepend vào carousel/grid cùng 25 mẫu code; homepage current card = Đào Phấn.
- `TemplatePreviewDialog` dùng `embedUrl` cho designer; CTA dashboard.
- Verified production `5efc28cb`: 78 carousel cards (26×3), auto iframe transform `translateY(-790px)`/max 1498, no separate designer section.
- Data still: published Đào Phấn v7 has 0 animation fields; must reapply and republish after the save-first fix.

## 2026-11-15 · v1.3.3 · merge designer vào bộ sưu tập chính + publish lưu canvas
- **Bỏ mục riêng “Thiệp được thiết kế riêng” khỏi trang chủ.** Mẫu designer đã publish được gộp vào chính carousel **“Chọn mẫu thiệp của bạn”** và grid `/thiep-cuoi`, đứng trước 25 mẫu code; tổng production 26 mẫu (78 card carousel = 26×3).
- `LiveTemplateCollection` tải `/api/public/designer-templates` sau mount, map cover/embedUrl/kind/version; `TemplateCarousel` và `TemplateGridBrowser` dùng chung.
- Hover/popup mẫu designer dùng `/mau/designer/<id>/embed` (nội dung thật + animation); mẫu code dùng `/mau/<id>?embed=1`; CTA designer về dashboard.
- **Fix publish mất animation:** nút “Xuất bản” giờ PATCH `canvas_json` hiện tại trước khi tạo version; trước đây publish đọc bản đã lưu cũ nên animation vừa áp dụng không vào version.
- 25 mẫu code dùng `coverImage` (không còn `/preview.webp` thiếu); card carousel/grid hiện ảnh.
- Verified: typecheck, lint 0 error (124 warning), 54/54 test, build; deploy `4a78e7fb`; production home current card = Đào Phấn, 78 cards, grid có 25 tên; hover designer iframe transform `translateY(-538px)`/max 1498.
- **Data finding:** published Đào Phấn v7 has 57 elements, **0 `animation` fields** — animation chưa từng được lưu vào canvas/version. Cần apply lại + bấm Xuất bản (bản mới đã lưu trước) rồi chờ cache 60s.

## 2026-11-14 · v1.3.2 · preview auto-scroll thật + ẩn scrollbar
- Fix hover/popup “đứng im”: template nhúng khoá scroll body/html nên `window.scrollTo`/`scrollTop` không tác dụng. Auto-scroll chuyển sang **dịch body iframe bằng transform** (`translateY(-offset)`), vẫn tính theo chiều cao thật và dừng ở cuối.
- Ẩn scrollbar trong mọi preview: CSS `scrollbar-width:none` + `::-webkit-scrollbar` cho embed code/designer; frame popup thêm `no-scrollbar`; iframe carousel dùng body transform.
- Áp dụng cho carousel code template, popup code template, card designer và popup designer.
- Verified local CDP: hover Vườn Ô Liu → `iframe body transform translateY(-477px)`, max 4324; typecheck/lint 0, test 53/53; deployed **a8847a17**.
- Production `/`, `/mau-thiep`, `/mau/basic-1?embed=1`, API đều 200.

## 2026-11-14 · v1.3.1 · code-template live preview + cover fix
- **Fix ảnh card trắng/“Chưa có ảnh xem trước”**: `getTemplateCollection()` dùng `coverImage` làm `previewImage`/`snapshotImage` thay vì file `preview.webp`/`snapshot.webp` không tồn tại.
- **Hover carousel code templates**: card mount iframe `/mau/<id>?embed=1`, tự cuộn nội dung thật từ trên xuống; mobile vẫn cover trang đầu.
- **Popup code templates**: `TemplatePreviewDialog` render iframe thiệp thật thay ảnh snapshot, tự cuộn, thêm nhạc `/media/wedding.mp3`, nút tạm dừng + bật/tắt nhạc.
- **Embed mode**: `/mau/[templateId]?embed=1` render `TemplatePreviewRenderer` đã mở, không toolbar/header, dùng cho hover/popup.
- Verified: typecheck, lint 0, test 53/53, build, deploy **a0054fed**; production `/`, `/mau-thiep`, `/api/public/designer-templates`, `/mau/basic-2?embed=1`, cover, designer embed đều 200.
- **Chưa làm:** nhạc riêng từng mẫu; iframe tải full app khi hover/popup; cover code template là ảnh tĩnh, hover mới live.

## 2026-11-14 · v1.3.0 · public designer catalog + live preview + font preload
- **Trang chủ có mục “Mẫu thiết kế mới”**: client fetch `/api/public/designer-templates` (chỉ published), card cover + hover iframe chạy đúng nội dung thiệp từ trên xuống; mobile chỉ hiện trang đầu (cover), fallback iframe nếu cover lỗi.
- **Trang `/mau-thiep`**: catalog đầy đủ, link “Xem tất cả mẫu thiết kế” từ trang chủ; thêm vào sitemap.
- **Popup xem thiệp**: iframe `/mau/designer/[id]/embed` render đúng version published với dữ liệu mẫu; tự cuộn, có nút tạm dừng, phát nhạc `/media/wedding.mp3` (autoplay sau click; fallback nút Bật nhạc), thông tin gói/version/ritual, CTA “Dùng mẫu này” → dashboard.
- **API public mới**: `GET /api/public/designer-templates`, cache `max-age=60/s-maxage=60`, chỉ trả metadata (không canvas), tránh lộ draft.
- **Embed route**: `/mau/designer/[id]/embed`, noindex, render `DesignerInvitation` toàn bộ trang.
- **Performance**: bỏ preload 7 font trang trí (`preload:false`), chỉ preload Be Vietnam + Playfair; cover lazy, iframe chỉ mount khi hover/click hoặc khi cover lỗi; API cache 60s. OpenNext bundle giảm còn ~18,4 MiB / 4,03 MiB gzip.
- Verified: typecheck, lint 0, test 53/53, `npm run build`, OpenNext + wrangler dry-run; local screenshot: API trả Đào Phấn v3, card fallback render trang đầu, dialog mở iframe + thông tin + nút nhạc (headless chặn autoplay). **Deployed version `c859ae3c`** — production `/`, `/mau-thiep`, API, embed, public detail, `/m/998c376174ee` đều 200; cover 200 image/webp.
- **Chưa làm:** nhạc riêng theo từng mẫu (đang dùng một track chung); hover/dialog tải iframe full app (chỉ một cái tại một thời điểm); catalog cập nhật sau publish tối đa 60s; “Dùng mẫu này” chỉ mở dashboard, chưa gán trực tiếp.

## 2026-11-14 · v1.2.2 · canvas/preview dùng Bearer API thay vì cookie RSC
- **Fix production canvas 404:** `/ops/designer/[id]` và `/ops/designer/[id]/preview` chuyển từ server page dùng `requireOpsPageRole()` (cookie Auth0) sang **client page** tải mẫu qua `GET /api/ops/designer/templates/[id]` với Bearer token. API vẫn chặn admin/designer; trang không còn phụ thuộc cookie session trong RSC.
- Thêm `getOpsDesignerTemplate()` vào `lib/ops-api.ts`; preview dùng `window.location.search` cho `?p=` và renderer client.
- Lý do: `/ops` là client layout check Bearer, còn canvas server guard check cookie — hai đường khác nhau. Production `/ops` vào được nhưng canvas 404 khi cookie session không đọc được.
- Verified: typecheck, lint 0, test 53/53, `npm run build`, `opennextjs-cloudflare build` + `wrangler deploy --dry-run` (~18,7 MiB / 4,09 MiB gzip).
- **Cần deploy** để áp dụng production. Nếu sau deploy vẫn 404, kiểm tra id mẫu tồn tại và `/api/ops/designer/templates/<id>` trả 200 với Bearer.

## 2026-11-14 · v1.2.1 · animation Phase 5 + fill fix
- **Exit effects:** `fadeOut`, `slideOut` (direction/distance), `zoomOutExit`; tab "Ra"; out wrapper riêng ngoài entrance; observer theo dõi rời/trở lại; `once=false` reset + replay entrance sau khi out (sửa lỗi visible callback reset liên tục bằng `leftRef`); reduced-motion không ẩn element.
- **Shimmer mask:** ảnh/photo truyền `shimmerMaskUrl`; pseudo `::after` dùng `mask-image` theo alpha ảnh (mask-size contain) thay vì dải sáng chung.
- **Auto-apply:** toolbar "Tự động áp dụng" thêm `fadeIn` cho mọi element tĩnh, delay `index*120`, bỏ qua fallingEffect.
- **Badge:** element đang chọn có animation hiện badge "Hiệu ứng" trên canvas.
- **Fix quan trọng:** wrapper trong `ElementAnimator` không còn `h-full` cho text/image (chỉ box/photo/block cần `fill`); trước đó text/image bị đo IntersectionObserver sai, exit không kích hoạt.
- Verified: typecheck, lint 0, test 53/53, build; CDP/Chrome 430×600: text slideOut rời màn hình (outPlay true/opacity 0), trở lại top reset opacity 1; shimmer maskImage là URL ảnh; box fadeOut đúng.
- **Chưa làm:** multi-select thật/áp dụng preset cho nhiều element; editor replay đúng element/"Phát tất cả" (vẫn mở preview page); export layer cho animated element.
- Files: `components/designer/{element-animator,animation-catalog,designer-template-renderer}.tsx`, `components/ops/{designer-animation-panel,designer-canvas,designer-types}.tsx`, `app/globals.css`, `tests/designer-animation.test.ts`.

## 2026-11-14 · v1.2.0 · animation Phase 3 + Phase 4 (falling effect)
- **Phase 3:** loop/emphasis `float/pulse/heartbeat/breathe/sway/spin/twinkle/shimmer/kenBurns`; tab "Lặp" + amount/duration/easing; parallax slider (shared scroll listener, CSS var, không đụng wrapper vị trí); loop bắt đầu sau entrance, tạm dừng off-screen/tab ẩn, tối đa 12 loop gần tâm màn hình; `typewriter` (Intl.Segmenter grapheme + NFC), `wordsIn` (stagger), `flipIn`.
- Wrapper structure đúng spec: parallax → vào → lặp → nội dung; text typewriter/wordsIn giữ đủ text trong DOM cho screen reader, `[data-text-play="false"]` ẩn trước khi chạy; `<noscript>` hiện chữ/khôi phục final state.
- **Phase 4:** element `fallingEffect` + `FallingEffectCanvas`: 9 preset built-in, scope "Trong khung"/"Cả trang" (fixed overlay), count/size/speed/direction/wind/sway/spin/opacity/depth, canvas DPR≤2, sprite offscreen cache, time-based rAF, fade-in 600ms, recycle, pause off-screen/tab, giảm hạt theo area/hardware, tắt reduced-motion, tối đa 2 effect/thiệp (chặn ở editor).
- **Phase 4 nguồn tùy chỉnh:** tối đa 4 nguồn hạt — preset, icon (10 icon picker, màu mặc định vàng), hoặc ảnh PNG/WebP upload qua `/api/ops/designer/assets` (client thu 256px, chặn >512KB, không nhận SVG); mỗi hạt chọn nguồn ngẫu nhiên; icon vẽ bằng canvas path, ảnh dùng sprite contain + cache.
- Editor: toolbar "Hiệu ứng rơi", panel `DesignerFallingPanel`, static sample mặc định + switch "Xem hiệu ứng khi chỉnh"; public/renderer tự chạy live; export không bake falling effect (giữ live như countdown/guestName).
- **Verified:** typecheck, lint 0 error, test 52/52 (thêm test loop/falling), `next build`; CDP/Chrome 430×2200: 63/63 ký tự typewriter, 21/21 từ wordsIn, 9/9 loop chạy, 2 canvas đúng kích thước (398×2041 box, 430×2200 page), reduced-motion 0 hidden/0 animation.
- **Chưa làm:** shimmer mask theo alpha PNG, editor replay đúng element/"Phát tất cả"/badge animated, color picker cho từng icon source; export layer cho element animated vẫn là giới hạn cũ (TODO B5).
- Files: `components/designer/{element-animator,animation-catalog,falling-effect-canvas,falling-effect-presets}.tsx`, `components/ops/{designer-animation-panel,designer-falling-panel,designer-canvas,designer-types}.tsx`, `components/designer/designer-template-renderer.tsx`, `app/globals.css`, `tests/designer-animation.test.ts`.

## 2026-11-14 · v1.1.9 · tối ưu production cho 100 DAU + capacity plan
- Supabase client singleton theo isolate (`lib/server/supabase.ts`) thay vì tạo client mỗi query.
- React `cache()` cho `getPublicWeddingByGuestSlug` / `getPublicWeddingBySlug`: metadata + page dùng chung một lần đọc DB/request (giảm ~50% query trang thiệp).
- Cache API cho `/media/[...key]` (R2 key bất biến) + `s-maxage`: bỏ đọc R2 cho lượt xem lại; vẫn tính Worker request.
- Cache API cho `getDesignerVersion` khi có version cụ thể: canvas JSON bất biến, cache 1 ngày; `/m` và preview không tải lại canvas.
- `/w/<slug>` bỏ hẳn truy vấn designer version (trang dùng template code), thêm option `includeDesignerTemplate` cho public fetcher.
- Bỏ binding `IMAGES` không dùng khỏi `wrangler.jsonc`.
- Thêm `PRODUCTION_CAPACITY.md`: giới hạn Supabase/R2/Workers, ước tính 100 DAU, ngưỡng nâng cấp và phương án migration. Kết luận chính: Workers Paid $5 là bắt buộc vì CPU free 10 ms, không phải vì bundle (16,7 MiB < 64 MiB); Supabase Free và R2 Free đủ cho 100 DAU.
- Verified: typecheck, lint 0 error, 50/50 test, `next build`, `next start` smoke (`/`, `/m` designer, `/w`, `/media` 404, `/api/ops/me`), `opennextjs-cloudflare build`, `wrangler deploy --dry-run` (~18,7 MiB total / 4,08 MiB gzip, không còn IMAGES).
- **Chưa làm:** Cache Rule `/media/*`, full HTML cache, font route-group split, backup `pg_dump`, giảm ảnh/dọn version cũ (TODO B6).

## 2026-11-14 · v1.1.8 · editor animations Phase 1 + kiểu chữ
- Thêm `animation.in` (optional) cho mọi element designer: preset `fadeIn/slideIn/rise/zoomIn/zoomOut/pop/bounceIn/blurIn/rotateIn/wipe`, duration, delay, easing, direction, distance, `once`, `threshold`; `loop/out/parallax` chỉ là field giữ chỗ (engine chưa đọc).
- `components/designer/element-animator.tsx`: wrapper nội dung tách khỏi wrapper vị trí/rotation; một IntersectionObserver dùng chung (root viewport, rootMargin -8%), stagger 150ms + 120ms cho màn hình đầu, `once`, reset khi `once=false`, `will-change` chỉ khi chạy, fallback 3s khi observer không chạy; start state có trong SSR markup.
- CSS keyframes/hidden states trong `app/globals.css`; chỉ transform/opacity/clip-path/filter; `prefers-reduced-motion` hiện final state và tắt animation; `<noscript>` trong renderer hiện toàn bộ nội dung khi tắt JS. Wipe ẩn bằng opacity (clip-path kín làm IntersectionObserver không thấy element).
- Renderer công khai (`DesignerTemplateRenderer`) bọc từng element để animation chạy trên `/m/<slug>` và trang preview, không chỉ editor.
- Panel "Hiệu ứng" trong canvas (tab Vào; Lặp/Ra để giai đoạn sau), áp dụng cho mọi loại element.
- Phase 2 một phần: nhóm font theo Script/Serif/Sans từ các family self-host sẵn (Nautigal, Pinyon, Carattere, Playfair, Cormorant, Lora, EB Garamond, Viaoda, Be Vietnam Pro); 6 kiểu chữ có sẵn (tên cô dâu chú rể, tiêu đề, lời mời, ngày cưới, địa điểm, nội dung) + giãn dòng/khoảng chữ; dòng test tiếng Việt trong panel. Không thêm family mới (chưa xác minh subset/license), chưa có "Bộ chữ"/hiệu ứng chữ.
- Verified: typecheck, lint 0 error, 50/50 test (6 test mới), build; CDP/Chrome: 10/10 preset chạy ở 430×1600, element dưới màn hình ẩn rồi chạy khi scroll, reduced-motion 0 hidden/0 animation, no-JS hiện đủ nội dung.
- **Chưa làm:** Phase 3 (loop/parallax/typewriter/wordsIn/flipIn), Phase 4 (falling effect), Phase 5 (exit/shimmer/auto-apply/multi-select); export vẫn bake element có animation vào một ảnh nền (cần layer storage/API mới — không đổi backend theo prompt).
- Files: `components/ops/designer-types.ts` (animation fields), `components/designer/{element-animator,animation-catalog,designer-fonts,designer-template-renderer}.tsx`, `components/ops/{designer-canvas,designer-animation-panel}.tsx`, `app/globals.css`, `tests/designer-animation.test.ts`.

## 2026-11-14 · v1.1.7 · ops: tab Template + phân quyền admin/designer
- Thêm tab **Template** (`/ops/templates`) dạng grid + search cho các mẫu designer đã publish (đang chạy production): đổi `name` (tên thiết kế nội bộ), `display_title` (title khách hàng thấy trong dashboard chọn mẫu), upload ảnh bìa (R2 + `snapshot_key` + `designer_assets` kind `snapshot`), hiện số thiệp đang dùng mẫu. Ảnh bìa cũng là cover trong danh sách chọn mẫu của dashboard.
- Phân quyền ops theo email: `ops_members` (migration v16) với role `admin`/`designer`; `ADMIN_EMAIL`/`ADMIN_EMAILS` vẫn là super-admin. `opsRoute()` = admin, mới `opsDesignerRoute()` = admin/designer. Trang **Phân quyền** (`/ops/roles`) cho admin cấp/thu hồi role, chặn tự hạ quyền và hạ quyền env admin, ghi audit log.
- Designer chỉ thấy **Template** + **Thiết kế mẫu**: sidebar lọc, layout redirect mọi path khác, API chặn; thêm `requireOpsPageRole` cho các trang server `/ops/designer/[id]` và preview để không lộ canvas trong RSC payload. Header hiện badge role.
- Migration `migration_v16_ops_roles_template_meta.sql` (ops_members + `designer_templates.display_title`) **chưa chạy**; code hạ cấp: chỉ env admin hoạt động, trang Template cảnh báo và tạm tắt sửa title, `/ops/roles` cảnh báo.
- Verified: typecheck, lint 0 error, test 44/44 (5 test mới cho `lib/ops-roles.ts`), `npm run build`; `next start`: `/ops/templates` + `/ops/roles` 200 shell, `/api/ops/templates` + `/api/ops/roles` 403 khi chưa auth, `/api/ops/me` trả role null, trang designer server trả 404 UI và không chứa dữ liệu mẫu khi chưa auth. **Chưa kiểm thử UI có đăng nhập** (cần Auth0 + migration v16).
- Files: `supabase/migration_v16_ops_roles_template_meta.sql`, `lib/ops-roles.ts`, `lib/server/ops.ts`, `lib/server/ops-members.ts`, `lib/server/ops-page.ts`, `lib/server/designer.ts`, `app/api/ops/{me,templates,roles}/**`, `app/api/ops/designer/**`, `app/ops/{layout.tsx,templates,roles,designer}`, `components/ops/{OpsSidebar,OpsHeader,OpsRoleContext}.tsx`, `lib/ops-api.ts`, `lib/types.ts`, `components/dashboard/DesignerTemplateCard.tsx`, tests.

## 2026-11-14 · v1.1.6 · sửa build deploy OpenNext trên Windows
- `npm run deploy` chết ở bước compile `open-next.config.ts`: `Failed to write to output file: ...\open-next-tmp*\open-next.config.mjs: Access is denied`. Nguyên nhân: `node_modules\@esbuild\win32-x64\esbuild.exe` bị sandbox/agent gắn **Low mandatory integrity label**, nên tiến trình esbuild chạy low-IL và không ghi được ra `%TEMP%` (Medium). Đã đặt lại label cho toàn bộ `node_modules` + esbuild về Medium; build chạy được **không cần** `ESBUILD_BINARY_PATH`.
- Hết lỗi temp thì lộ lỗi thứ hai: `Could not resolve "critters"` trong `pages-turbo.runtime.prod.js` (Next 16 middleware tham chiếu tĩnh tới `critters` dù `optimizeCss` tắt; OpenNext chưa externalize trong Node-middleware bundle). Thêm `vendor/critters-stub` dạng `file:` dependency + `.npmrc` `install-links=true` (npm junction bị OpenNext copy thành symlink tương đối gãy). Stub ném lỗi rõ nếu ai bật `optimizeCss`.
- Verified: `npx opennextjs-cloudflare build` OK, `npx wrangler deploy --dry-run` OK (18.485 KiB / 4.051 KiB gzip; bản critters thật là 4.296 KiB gzip), `npm run build`, typecheck, lint (0 error), test 38/38.
- **Chưa deploy:** `wrangler whoami` báo chưa đăng nhập; owner cần `npx wrangler login` hoặc `CLOUDFLARE_API_TOKEN`. (Đính chính ở v1.1.9: giới hạn chặn là CPU 10 ms của Workers Free, không phải bundle size; cần Workers Paid.)
- Files: `package.json`, `package-lock.json`, `.npmrc`, `vendor/critters-stub/**`, `README.md`, docs.

## 2026-11-14 · v1.1.5 · mẫu Đào Phấn hoàn chỉnh + căn chữ trong designer
- Thêm `align` (left/center/right) cho text element của designer: type, renderer thiệp thật, canvas editor và bước xuất ảnh nền; property panel có nút Trái / Giữa / Phải. Lý do: mẫu căn giữa kiểu thiệp cưới không dựng được nếu text luôn bám trái.
- Thiết kế lại mẫu **Đào Phấn** từ đầu: 3 trang (Bìa / Nội dung / Cảm ơn), 42 element, palette `#FAF3F0` / `#5A2B33` / `#7A3B44` / `#8C4A46` (nhấn `#B87D74` chỉ cho đường kẻ/icon), font Playfair + The Nautigal + Be Vietnam Pro; placeholder đủ 6 loại, không dùng block tương tác (chờ giai đoạn sau).
- Publish v1 rồi v2 (chỉnh tim giữa hai đường kẻ) đúng luồng version: version row bất biến, `designer_templates.version = 2`.
- Gán mẫu cho thiệp test `aaaaa` (slug) ở version 2. Đã chứng minh ghim version: khi publish v2, `/m/998c376174ee` vẫn render v1; sau khi đổi pin sang v2, HTML đổi sang v2. Kiểm tra bằng ảnh chụp headless Chrome (430×2800) và so khớp HTML.
- Verified: `/m/<guest>` trả 200 với dữ liệu thật (Văn A & Thị B, 01.01.2027, tên khách, "Trân trọng mời"), **không** còn giá trị mẫu (White Palace / Minh Khôi / Thảo Nguyên / Bạn Thanh Mai) và không có placeholder ảnh; preview `/mau/designer/<id>?v=2&p=0..2` trả 200.
- Files: `components/ops/designer-types.ts`, `components/ops/designer-canvas.tsx`, `components/designer/designer-template-renderer.tsx`, dữ liệu `designer_templates` / `designer_template_versions` / `weddings.designer_template_*`; docs `.dsh/skills/inviwedd-project-map/references/*` + `.dsh/skills/card-design/SKILL.md`.

## 2026-11-14 · v1.1.4 · xác nhận migration designer đã chạy
- Owner chạy `migration_v14_designer.sql` + `migration_v15_designer_versions.sql`.
- Verified read-only through `lib/server/supabase.ts` (service key, no secrets printed): `designer_templates` 37 rows (all `draft`), `designer_template_versions` 0, `designer_assets` 0, `weddings.designer_template_id`/`designer_template_version` selectable on 4 weddings (0 pinned).
- Consequence recorded: the dashboard picker is empty and `/m` still uses code templates until a designer publishes a template.
- Files: `references/db-schema.md`, `references/env-and-deploy.md`, `references/open-items.md`, `SKILL.md`.

## 2026-11-14 · v1.1.3 · gán mẫu designer + render thiệp theo version ghim
- Dashboard: `DesignerTemplateCard` (tab “Thông tin cưới”) liệt kê mẫu designer đã publish, gán/bỏ gán, hiện “Đang ghim vN” và nút “Cập nhật lên vN” khi mẫu có bản mới. Ghi `weddings.designer_template_id` + `designer_template_version`; `template_id` vẫn giữ làm fallback.
- API mới: `GET /api/designer-templates` (JWT, chỉ trả mẫu `published` + cover url) và `PATCH /api/weddings/[id]/designer-template` (JWT+owner; chặn mẫu chưa publish, sai gói; ghim đúng version được yêu cầu; 503 kèm hướng dẫn khi DB chưa chạy migration v14/v15).
- `/m/<slug>`: thiệp có mẫu designer thì render toàn bộ trang của **đúng version đã ghim** bằng `DesignerTemplateRenderer` (variant `plain`), đổ dữ liệu thật vào placeholder: tên khách, xưng hô (`buildSalutation`), ngày (dot date), địa điểm lễ đầu tiên. Placeholder thiếu dữ liệu để trống thay vì hiện giá trị mẫu; thiếu layout/version thì rơi về template code.
- Hạ tầng đọc thiệp công khai giờ thử cột giàu → nghèo (`suspended`, cột designer) nên vẫn chạy trên DB cũ; guest query lấy thêm `relationship_group`/`custom_pronoun_*` với fallback.
- Thêm `lib/designer-invite.ts` (thuần, có test) + 9 test designer (tổng 38).
- Lint: bọc `eslint-disable-next-line react-hooks/refs` cho khối element của `designer-canvas.tsx` (ref chỉ đọc trong pointer handler; lỗi có từ commit resize/rotate trước đó) — CI về 0 error.
- Verified: `npm run typecheck`, `npm run lint` (0 error), `npm run test` 38/38, `npm run build` ok (có `/api/designer-templates`, `/api/weddings/[id]/designer-template`), `next start` smoke: `/` 200, `/m/<slug lạ>` 200 (trang link không hợp lệ, query DB chạy), `/api/designer-templates` 401, `/api/public/wedding/abc` 404, `/mau/designer/<uuid lạ>` 404.
- Chưa kiểm chứng được bằng browser: giao diện card trong dashboard và thiệp designer thật (cần đăng nhập + một mẫu đã publish; xem v1.1.4 — DB đã có schema nhưng chưa có mẫu publish).

## 2026-11-14 · v1.1.2 · template collection page + preview popup
- Added `/thiep-cuoi` (`app/thiep-cuoi/page.tsx`): flat focus carousel over the template registry, keyboard/swipe/arrow controls, `aria-current`, live region, counter and dots; no 3D transforms.
- Added `components/templates/template-preview-dialog.tsx`: glass panel (`bg-surface/90` + `backdrop-blur-[16px]`), focus trap + ESC/overlay close + focus return, auto-scrolling snapshot with pause button and reduced-motion fallback, feature lists and the two action buttons (`/mau/<id>` demo, `/tao-thiep?template=` with login-then-return).
- Added `config/template-features.ts` (single source for base/Pro/VIP features, `comingSoon` flags matching pricing) and optional `previewImage`/`snapshotImage`/`demoUrl`/`extraFeatureIds` fields on the registry plus `getTemplateCollection()`.
- Homepage: removed the template grid; replaced with a teaser section linking to `/thiep-cuoi`. Navbar and footer link to the new page; sitemap includes it.
- Verified: tsc clean, lint 0 errors, build ok (`/thiep-cuoi` static), page 200 with h1/carousel/live region, homepage has no template cards, sitemap + canonical present. Images for all 24 templates are still missing (placeholders).

## 2026-11-14 · v1.1.1 · dev mode survives blocked workerd
- `next dev` crashed on Windows when the repo sits under Desktop/OneDrive: workerd could not `CreateDirectory` its state dirs (Defender Controlled Folder Access), and the unhandled Miniflare rejection killed the process.
- `next.config.ts` now persists Miniflare state under `os.tmpdir()` and catches the startup failure, logging one actionable warning; the dev server keeps running (R2/KV/cache bindings unavailable, `/media` 404).
- Added `CLOUDFLARE_DEV_BINDINGS=0` to skip workerd entirely and documented the Defender exclusion / move-out-of-Desktop fixes in README.
- Verified: `next dev` stays up, `/`, `/cong-cu`, `/w/<slug>`, `/m/<slug>` return 200, `/dashboard` 307.

## 2026-11-14 · v1.0.9 · fonts, static landing, ESLint 16, validation tests
- Removed the Google Fonts `@import`; the six families used by the themed templates are now self-hosted through `next/font` and referenced as CSS variables in `theme-configs.ts` (78 woff2 files, no external font CSS).
- `/` is static again: removed `force-dynamic`, read the session client-side with `useUser()`, and apply the theme cookie with a pre-paint inline script that `ThemeProvider` then mirrors into state.
- Upgraded `eslint-config-next` to 16.4.6 and migrated `eslint.config.mjs` to its flat config; fixed two `react-hooks/refs` violations, downgraded `set-state-in-effect` to warn (98 existing occurrences).
- Extracted `lib/rsvp-input.ts` and `lib/gift-input.ts` (used by the RSVP + gift routes) and added 7 validation tests — 29 total.
- Gallery compression lowered to 1600px; removed the duplicate `du-tru-chi-phi` page (redirect stays), unused `qr.jpg`, duplicate `FORBIDDEN_WEDDING_SLUGS`, the hardcoded `isImplementedTemplateId`, and the unused `critters` dependency.
- Verified: tsc clean, lint 0 errors, 29/29 tests, build ok with `/` static, smoke test ok.
- Files: `app/layout.tsx`, `app/page.tsx`, `components/theme/ThemeProvider.tsx`, `components/landing/landing-page-client.tsx`, `templates/themed/theme-configs.ts`, `lib/{rsvp-input,gift-input,image/compress}.ts`, `lib/server/http.ts`, `templates/registry.ts`, `eslint.config.mjs`, `package.json`, tests.

## 2026-11-14 · v1.0.8 · ops client rewritten (no mock)
- `lib/ops-api.ts` reduced from 1,101 to 368 lines: all fabricated users/weddings/orders/transactions/audit data and the localStorage store are deleted; every function is now a thin fetch against `/api/ops/*`.
- `mergeOpsUser` validates the reason and throws `NOT_SUPPORTED` (the server route does not exist; the UI button is already hidden).
- `getOpsUser` maps the API response (no identities/mergedFrom yet) to the detail shape; 404 maps to `null`.
- Verified: tsc/lint clean, 22/22 tests, build ok, `next start` smoke (`/ops` 200, `/api/ops/me` 200 `isAdmin:false`, `/api/ops/stats` 403).
- Files: `lib/ops-api.ts`, `TODO.md`, `references/open-items.md`.

## 2026-11-14 · v1.0.7 · batch 5: headers, tests, dead code
- Added HSTS and a CSP to `next.config.ts` (Turnstile, Cloudflare Analytics, Google Fonts, Google Maps; inline styles/scripts allowed until a nonce setup exists).
- Added 22 unit tests for rate limiting, pagination and payment helpers (`tests/rate-limit.test.ts`, `pagination.test.ts`, `payments.test.ts`).
- Removed unused `authClient()` and `SUPABASE_PUBLISHABLE_KEY`; updated `.env.example`.
- Verified: tsc/lint clean, 22/22 tests, build ok, headers present on a live `next start`.
- Files: `next.config.ts`, `lib/server/supabase.ts`, `.env.example`, `tests/*.test.ts`, `TODO.md`, `HANDOFF.md`.

## 2026-11-14 · v1.0.6 · migrations applied + end-to-end verification
- Owner ran migrations v11, v12 and v13. Verified through the service-key REST API: guest preference columns selectable (200), `gifts` selectable/insertable (200/201), `photos.kind = 'album'` insertable (201).
- Created a temporary user + Pro wedding + album photo + gift, rendered `/a/<slug>` (200, heading, photo link, `noindex`) and `/w/<slug>` (200), then deleted everything: 0 remaining wedding/gift rows and `/a/<slug>` returns 404.
- Authed gift CRUD routes were not exercised end-to-end (no Auth0 session in the agent environment); the DB layer and page rendering were.
- Skill updated: migrations marked APPLIED, owner-blocked item removed, retention runtime still pending a real deploy.
- Files: `references/{db-schema,env-and-deploy,open-items,changelog}.md`, `SKILL.md`.

## 2026-11-14 · v1.0.5 · batch 4 (code `04192e7`)
- Built **Sổ mừng**: `gifts` table (migration v12), GET/POST/PATCH/DELETE routes gated to Pro/VIP, nav/page restored.
- Built **Album**: migration v13 allows `kind = 'album'`, upload enabled, public `noindex` page at `/a/[slug]`, dashboard link.
- Built **retention job**: `purgeExpiredFreeWeddings()` (30 days, batch 50, R2 + DB, dry-run) + `POST /api/ops/retention/run` + daily cron 03:00 UTC through `worker-entry.ts`; validated with `wrangler deploy --dry-run`.
- **Guest list pagination**: server-side `q`/`status` filters, 50 per page, `count`-based `totalPages`, pager in the UI; legacy API shape kept.
- Owner must run migrations v11, v12, v13.
- Files: `app/a/[slug]/page.tsx`, `app/api/weddings/[id]/gifts/**`, `app/api/ops/retention/run/route.ts`, `app/api/weddings/[id]/{guests,photos}/route.ts`, `lib/server/{retention,mappers,storage}.ts`, `lib/api.ts`, `worker-entry.ts`, `wrangler.jsonc`, `components/dashboard/**`, `supabase/migration_v1{1,2,3}*.sql`.

## 2026-11-14 · v1.0.4 · batch 3 (code `b06ebad`)
- Untracked build output and local state: `.open-next/` (2,342 files, ~53 MB), `.wrangler/` and `scratch/` removed from the index and gitignored; tracked files went from 2,778 to 396.
- Rewrote `README.md` (UTF-8), `HANDOFF.md`, `TODO.md`, `INTEGRATION.md`; marked `DESIGN_PLAN.md` historical.
- Added `typecheck` and `test` scripts (`node --test --test-isolation=none`) and `.github/workflows/ci.yml` (install → typecheck → lint → test → build).
- Ops pages now surface API failures: `lib/ops-api.ts` dispatches `ops-api-error`, `app/ops/layout.tsx` renders a dismissible banner with retry.
- Verified: tsc/lint clean, 8/8 tests, build ok, `next start` smoke test ok.
- Files: `.gitignore`, `package.json`, `.github/workflows/ci.yml`, `README.md`, `HANDOFF.md`, `TODO.md`, `INTEGRATION.md`, `DESIGN_PLAN.md`, `lib/ops-api.ts`, `app/ops/layout.tsx`.

## 2026-11-14 · v1.0.3 · batch 2 (code `db98d6c`)
- Public RSVP enforces the plan guest limit; `songRequest`/`rideNeeded` persist end-to-end (new `migration_v11_guest_preferences.sql`, **not applied yet**), are returned by the invite API and prefilled in every template; `map_embed_url` is preserved on event edit.
- Added in-memory rate limiting for RSVP, wishes, invite and check-slug with 429 + `Retry-After`; verified 10×400 → 429 in a live smoke test.
- Added `lib/server/pagination.ts` and removed the silent 1,000-row PostgREST truncation in guest lists, dashboard stats and ops lists; ops stats switched to head counts + month-bounded revenue.
- Pricing copy now matches shipped features (template counts, MP3/album/Excel marked "Sắp có", gift QR stated as shipped, logo row removed); `/w/[slug]` is `noindex`; `.env.example` lists every variable name.
- Owner replaced the Supabase secret key; DB-backed smoke tests (pages + public/invite APIs) now pass locally.
- Files: `app/api/{rsvp,wishes,invite,w/[slug],weddings,ops}/**`, `lib/server/{rate-limit,pagination,mappers}.ts`, `lib/types.ts`, `config/pricing.ts`, `templates/**`, `components/{dashboard,invitation}/**`, `.env.example`, `supabase/migration_v11_guest_preferences.sql`.

## 2026-11-14 · v1.0.2 · owner confirmations + env diagnosis
- Owner confirmed all committed migrations are applied; `db-schema.md` now records APPLIED for v2, v3, v4, v5, v10 and notes that no v6–v9 files exist.
- Owner confirmed Auth0 SDK config lives in the local env (`AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`), the bank webhook is sent by a Google Apps Script project outside the repo, `ADMIN_EMAIL` is configured, and the 30-day free-plan retention commitment stays.
- Diagnosed the local DB failure: `SUPABASE_URL` is the correct project (`xklihgeirdxyormuxcoh.supabase.co`) with no old URL and no OS-level override; `SUPABASE_SECRET_KEY` is a well-formed `sb_secret_` key but the project answers `401 Unregistered API key`, so the URL/key pair is mismatched. Key replacement is owner-blocked.
- Added `ADMIN_EMAIL` to `.env.local` (value not recorded here). No other env value was read aloud or stored.
- Files: `references/{db-schema,env-and-deploy,decisions,open-items,changelog}.md`, `SKILL.md`; `\.env.local` (gitignored).

## 2026-11-14 · v1.0.1 · batch 1 unblock fixes (code `0c3c7e5`)
- Fixed the eight blockers recorded at v1.0.0:
  - Sổ mừng: nav entry removed; page renders a "đang hoàn thiện" notice (no route/table existed).
  - Album: upload disabled with an explicit message until the DB kind and `MEDIA_KEY_RE` support it.
  - Bulk event assignment: calls the existing nested route instead of a missing `/api/guests/[id]/events`.
  - Single-slot photos: the API now uploads the new object first and replaces the old row afterwards (no delete-first data loss), keyed by the content photo id.
  - Turnstile: a failed script load is retryable and shows a visible error instead of silently locking the form.
  - `/m/[slug]`: renders immediately from server data; the per-guest fetch only hydrates RSVP status and never blocks first paint.
  - Ops: the client mock fallback is gone, `/api/ops/me` fails closed when `ADMIN_EMAIL` is unset, the merge button is hidden (no route), and no fabricated data is displayed.
  - Suspended weddings: blocked on `/w`, `/m`, `/api/public/wedding/[slug]`, `/api/invite/[slug]`, RSVP and wishes; `suspended` is read with a fallback to `content.suspended` when migration v10 has not run.
- `next.config.ts`: Miniflare/workerd starts only for `next dev`, so production builds no longer need the Workers runtime.
- Verified: `tsc --noEmit` and `eslint .` clean; `next build` succeeds; `next start` smoke test passed for `/`, `/cong-cu*`, `/m/<invalid>`, `/ops`, `/sitemap.xml`, `/robots.txt`, `/dashboard` (307 to login), and 404 paths for `/w/ab`, `/api/public/wedding/ab`, `/api/invite/ab`, `/media/*`.
- New known issue: the local Supabase credential is rejected ("Unregistered API key"), so every DB-backed route returns 500 locally; owner must rotate/update it. Not caused by these changes.
- Files: `app/api/{invite,rsvp,wishes,ops/me}/**`, `app/api/weddings/[id]/photos/route.ts`, `app/dashboard/so-mung/page.tsx`, `app/m/[slug]/page.tsx`, `app/ops/users/[id]/page.tsx`, `components/{TurnstileWidget,dashboard/*,invitation/InvitePageClient}.tsx`, `lib/{api,ops-api}.ts`, `lib/server/{weddings,public-wedding}.ts`, `next.config.ts`.

## 2026-11-14 · v1.0.0 · initial skill creation
- Created `inviwedd-project-map` on the owner's request, because context is lost between sessions and the repository had no durable project map.
- Recorded: architecture and repo layout, all 37 `route.ts` files / 47 handlers with their auth layer, the 5 committed migrations and the tables they create (plus the three tables used by code but absent from migrations), the 20 environment variable names and where each is read, the product/technical decisions with reasons, and the open blockers found in a read-only review.
- Verified from a read-only pass at git `868ac95`; `tsc --noEmit` and `eslint .` both pass. No source file modified, no `.env*` read, no migration executed.
- Files: `.dsh/skills/inviwedd-project-map/SKILL.md`, `references/{api-routes,db-schema,env-and-deploy,decisions,open-items,changelog}.md`.
