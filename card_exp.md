# card_exp.md — Kinh nghiệm làm thiệp cưới Inviwedd

Tài liệu này tổng hợp các bài học thực tế khi làm template thiệp cưới, đặc biệt là
`Hoa Anh Đào V2`. Đọc trước khi làm template mới để tránh lặp lại lỗi.

---

## 1. Có hai hệ template, đừng trộn

### Code template (React)
- Nằm trong `templates/<id>/index.tsx`.
- Render bằng `TemplatePreviewRenderer`.
- Dùng `ThemedTemplate` hoặc component riêng.
- Có responsive thật, animation thật, logic thật.
- Không sửa được từng element trong `/ops/designer`.
- Phù hợp khi cần:
  - thiết kế phức tạp
  - hiệu ứng mở thiệp
  - layout responsive
  - can thiệp CSS sâu

### Designer template (canvas JSON)
- Nằm trong DB `designer_templates` + `designer_template_versions`.
- Sửa được trong `/ops/designer`.
- Chỉ gồm page + element absolute theo %.
- Không biểu diễn được React/CSS phức tạp.
- Phù hợp khi cần khách tự kéo thả, đổi màu, đổi ảnh.

**Kết luận:** nếu khách cần “y hệt design” thì làm code template. Nếu cần
“tự chỉnh mọi thứ” thì làm Designer template. Đừng hứa cả hai.

---

## 2. Ảnh design ≠ asset

- Ảnh mockup thường có chữ, photo, watermark baked-in.
- Không dùng nguyên ảnh mockup làm thiệp thật.
- Tách asset:
  - nền giấy
  - cành hoa
  - khung ảnh
  - QR
  - photo cưới
- Nếu thiếu asset:
  - dùng SVG/CSS thay thế
  - dùng placeholder
  - nói rõ với owner
- Không tự bịa là “giống 100%”.

---

## 3. Font tiếng Việt

### Lỗi thường gặp
- Font script như Nautigal, Pinyon, Carattere thiếu glyph tiếng Việt.
- Dấu bị rơi, chữ bị lệch, dấu câu lộn.

### Cách xử lý
- Chỉ dùng font có Vietnamese subset:
  - Playfair Display
  - Cormorant Garamond
  - Lora
  - EB Garamond
  - Be Vietnam Pro
- Fallback cho canvas cũ:
  ```css
  .invitation-theme,
  .themed-invitation {
    --font-nautigal: var(--font-playfair);
    --font-pinyon: var(--font-playfair);
    --font-carattere: var(--font-playfair);
  }
  ```
- Quote/lời dẫn dùng `font-inv-quote`, italic, không dùng `font-serif` mặc định.

---

## 4. Tên cô dâu chú rể trên cover/hero

- Chia **3 dòng**:
  ```text
  Tên chú rể
  &
  Tên cô dâu
  ```
- Không để cùng một dòng vì tên dài sẽ gãy chữ.
- Dùng `display: block` cho từng span.
- Font nhỏ hơn, italic/flowing.
- Không dùng `overflow-wrap: anywhere` cho tên.
- Dùng `break-word` + `min-width: 0`.

---

## 5. Card gia đình 2 bên

- Hai card phải **cao bằng nhau**:
  - grid `items-stretch`
  - card `h-full flex flex-col`
- Tên dài:
  - font nhỏ hơn trên mobile
  - `min-h` cố định cho vùng tên
  - `break-words`
  - không bẻ từng ký tự
- Danh xưng:
  - không hardcode “Trưởng nam” / “Ái nữ”
  - thêm field `groomTitle`, `brideTitle`
  - hiển thị `Nhà Trai · {groomTitle}`
  - dashboard cho khách tự nhập trước tên

---

## 6. Responsive thật

### Mobile
- 390px là chuẩn chính.
- Không dùng ảnh full-width không giới hạn chiều cao.
- `aspect-[3/4]` + `object-cover`.
- Text dài phải wrap.
- Không đặt `overflow-x: hidden` rồi coi như đã fix.

### Desktop
- Không kéo giãn thiệp thành 1440px.
- Dùng max-width 760–840px.
- Hero ảnh có thể 2 cột.
- Card gia đình 2 cột.
- Test 390 / 768 / 1440.

### Lưu ý khi screenshot
- Headless Chrome có thể có layout viewport rộng hơn ảnh chụp.
- Ảnh 390px có thể bị cắt giả do `innerWidth` lớn hơn.
- Phải dùng DevTools device emulation thật hoặc kiểm tra `innerWidth`.

---

## 7. Ảnh: upload, crop, zoom, pan

- Ảnh phải được nén trước khi upload.
- Khung ảnh phải có tỉ lệ cố định.
- Cho khách:
  - kéo ảnh
  - zoom
  - căn tâm
  - cắt một phần
- Crop phải trả ra file mới, không chỉ đổi CSS.
- Ảnh cuối vẫn giữ đúng tỉ lệ khung template.
- `ImageCropDialog` là component dùng chung:
  - nhận file + aspect
  - kéo/zoom
  - xuất JPEG
- Nếu chưa tích hợp crop cho mọi luồng, ghi rõ luồng nào đã có.

---

## 8. Album ảnh

- Dạng card trung tâm + loop ngang.
- Free 5 ảnh / Pro 30 ảnh.
- Có dummy card khi chưa có ảnh.
- Không hiển thị badge “5 ảnh” nếu khách không cần.
- Ảnh gallery lấy từ `photos.kind === "gallery"`.
- `DesignerAlbum` dùng animation marquee; tôn trọng reduced-motion.

---

## 9. Hộp quà

- Không dùng nút “Gửi quà mừng” kiểu trung gian.
- Hộp quà là một illustration.
- Bấm vào hộp quà mở **popup** QR/thông tin tài khoản.
- Popup phải render bằng `createPortal` ra `document.body`:
  - tránh bị `transform` của PhoneFrame làm containing block
  - tránh popup xuất hiện ở đầu preview desktop
- Không dùng slide-down inline nếu khách muốn popup.
- QR chỉ hiện với gói Pro/VIP nếu có cấu hình.

---

## 10. RSVP và lời chúc

- Không tạo form mới nếu `RsvpWishBlock` đã có.
- Form thật phải nằm đúng vị trí trang RSVP, không qua nút trung gian.
- Theme RSVP theo nền thiệp:
  - nền tối → chữ kem
  - nền sáng → chữ đậm
- Set cả `--inv-*` và `--color-inv-*`.
- Nếu form nằm ngoài `WeddingContentProvider`, bọc provider lại.
- Không duplicate RSVP section: nếu canvas có page `kind: "rsvp"`, bỏ appended block.

---

## 11. Section hiện/ẩn

- Lưu `hiddenSections: string[]` trong `content`.
- Các key thống nhất:
  - `album`
  - `gift`
  - `calendar`
  - `map`
  - `family`
  - `dresscode`
  - `rsvp`
  - `music`
- Template đọc `data.hiddenSections`.
- Dashboard có toggle.
- Preview cũng có toggle để thấy ngay.
- Không xoá dữ liệu khi ẩn; chỉ không render.

---

## 12. Dress code

- Lưu `dressCode: string[]` (3 màu).
- Dashboard cho chọn 3 màu.
- Template dùng màu đó thay vì hardcode.
- Không hardcode tên màu nếu khách tự nhập.

---

## 13. Contrast

- Không dùng chữ đen trên nền đỏ đậm.
- Nền tối → chữ kem/gold/trắng.
- Nền sáng → chữ nâu/đỏ đậm.
- Kiểm tra:
  - tiêu đề
  - body
  - nút
  - placeholder
  - disabled
- Dùng palette có độ tương phản rõ, không chỉ đẹp trên mockup.

---

## 14. Icon và hiệu ứng

- Icon Lucide dễ làm thiệp trông “app”.
- Với thiệp lãng mạn, hạn chế icon.
- Có thể ẩn toàn bộ `.lucide` theo template:
  ```css
  [data-template-id="hoa-anh-dao-v2"] svg.lucide { display: none; }
  ```
- Hiệu ứng cánh hoa:
  - dùng CSS/SVG, không emoji
  - rơi chậm, có drift, xoay
  - tôn trọng `prefers-reduced-motion`
- Không lạm dụng particle.

---

## 15. Modal/Portal

- Modal trong container có `transform` sẽ bị định vị sai.
- Luôn dùng `createPortal(..., document.body)`.
- Khoá scroll body khi mở.
- Click backdrop đóng.
- Nút đóng rõ ràng.
- Không dùng `position: fixed` bên trong PhoneFrame nếu không portal.

---

## 16. DB và deploy

- Designer templates:
  - `designer_templates`
  - `designer_template_versions`
- Published template cần:
  - status `published`
  - version
  - row trong versions
- Dùng marker `created_by` để rollback batch.
- Không sửa template đang được wedding thật dùng nếu không có backup.
- Backup trước khi seed.
- App deploy không làm thay đổi DB; DB seed không cần deploy app.
- Cloudflare/OpenNext build cần full access trên Windows sandbox.

---

## 17. QA checklist

```text
[ ] 390px không tràn ngang
[ ] 768px không vỡ layout
[ ] 1440px không kéo giãn quá mức
[ ] tên dài không bẻ ký tự
[ ] 2 card gia đình cao bằng nhau
[ ] ảnh không tràn khung
[ ] quote tiếng Việt đúng dấu
[ ] RSVP submit được
[ ] gift popup đúng vị trí
[ ] album loop mượt
[ ] section toggle hoạt động
[ ] dress code lưu đúng
[ ] không icon thừa
[ ] không console error
[ ] build/lint/test pass
```

---

## 18. Bài học lớn nhất

1. Không hứa “y hệt 100%” khi chuyển React → canvas.
2. Không dùng ảnh mockup làm asset cuối.
3. Không hardcode danh xưng.
4. Không dùng font script thiếu tiếng Việt.
5. Modal phải portal.
6. Không để preview và thiệp thật dùng hai logic khác nhau.
7. Luôn kiểm tra mobile thật, không chỉ screenshot headless.
8. Ghi lại giới hạn thay vì che.


---

## 19. Đỏ may mắn — case study 2026-11-16

### Asset thực tế
- Bộ asset gồm: mockup bìa desktop, mockup các section, cành mẫu đơn, phong bao lì xì.
- Mockup có chữ/watermark baked-in → **không dùng làm ảnh phẳng cho thiệp thật**.
- Đã tách:
  - `floral.webp` từ asset1 (xóa nền trắng, crop);
  - `envelope.webp` từ phong bao (xóa nền trắng);
  - `cover.jpg` từ mockup bìa để làm catalog.
- Ảnh phong bao vẫn còn watermark Vecteezy/Freepik; cần asset sạch nếu muốn production hoàn hảo.

### Bài học riêng
- Cover dùng **card kem + 2 cành hoa 2 bên + tim đỏ**, không dùng ảnh mockup làm nền.
- Hero dùng **phong bì đỏ dựng CSS + photo polaroid + cành hoa**, không dùng ảnh flat.
- Info dùng panel đỏ + calendar kem.
- Album dùng carousel snap, không dùng grid 3 cột.
- Gift dùng 2 phong bao asset2; popup portal.
- RSVP dùng form thật.
- **Không được nói “giống 100%”** nếu asset gốc là mockup phẳng: chỉ có thể giống về bố cục/màu/font, không giống pixel.
- Nếu khách yêu cầu “100%”, phải:
  1. có file thiết kế tách layer;
  2. có font gốc;
  3. có ảnh gốc không watermark;
  4. chấp nhận sai khác do responsive.

### Checklist riêng
- [ ] cover không bị cành hoa che tên
- [ ] cover dùng đúng #4D1217 / #F8F1EA
- [ ] hero photo giữ tỉ lệ 4:5
- [ ] calendar đúng tháng/năm
- [ ] timeline đúng giờ
- [ ] album snap + dots
- [ ] gift portal
- [ ] RSVP thật

---

## 20. Quy ước tên & ngày (2026-11-18)

### Dấu `&`
- Tên cô dâu chú rể luôn **3 dòng**: tên chú rể / `&` / tên cô dâu. Không viết cùng dòng.
- Với dòng phụ huynh ("Ông A & Bà B"), dấu `&` phải **mở đầu dòng dưới**, render tách tại `&` và xóa luôn kí hiệu `&`:

  ```text
  Ông Lê Văn Lậu
  Bà Nguyễn Giang Mai
  ```

  Không để `&` nằm cuối dòng (dễ bị đọc thành "A &").
- `&` dùng **cùng font** với tên (serif của theme), không để font sans mặc định.
  Lỗi đã gặp: đổi font tên nhưng quên `&` nên nó vẫn là sans, trông lệch hẳn.

### Ngày cưới
- Một thiệp chỉ hiện ngày ở **2 chỗ**: khối **Sự kiện** và khối **Thông tin tiệc cưới**.
- Không lặp ngày ở hero, ở khối thông tin gia đình, hay footer (đã gặp: 3 lần cùng một ngày).
- "Sự kiện" liệt kê từng lễ; "Thông tin tiệc cưới" là tiệc chính + lịch tháng.

### Ảnh hero
- Ảnh cưới phải **trọn người** trong màn hình đầu sau khi mở thiệp — không để khung cắt ngang.
- Nếu chữ trang trí ("LOVE NEVER FAILS") chiếm một dòng riêng, hãy đặt đè lên đỉnh vòm để tiết kiệm chiều cao.

---

## 21. Mỗi template có bộ thành phần riêng (2026-11-18)

- Dashboard **chỉ được hiện nút điều khiển cho phần mà template đó thực sự render**. Hiện nút cho phần không có thì khách bật/tắt mà thiệp không đổi gì — mất niềm tin và rối.
- Nguồn duy nhất: `config/template-sections.ts` → `getTemplateSections(templateId)`, gồm:
  - `sections`: những key `hiddenSections` / `sectionOrder` mà template có.
  - `couplePhotos`: có khối ảnh cô dâu/chú rể riêng trong phần gia đình hay không.
  - `hostFirst`: có hai cột hai họ để chọn nhà nào đứng trước hay không.
- Template mới: **khai báo ngoại lệ trong `TEMPLATE_OVERRIDES`**, không sửa dashboard.
- Key phải **khớp chính xác** giữa dashboard và template. Lỗi đã gặp: template dùng `"events"` còn dashboard dùng `"map"` → phần "Sự kiện" luôn bị đẩy xuống cuối trang, và nút ẩn/hiện không có tác dụng.
- Bảng key chuẩn: `family` · `calendar` · `map` · `dresscode` · `album` · `albumQr` · `gift` · `rsvp` · `music`.
- `map` hiển thị là **"Sự kiện và chỉ đường"** (không còn "Sự kiện & bản đồ").
- Ví dụ: `do-truyen-thong` không có ảnh cặp đôi riêng trong phần gia đình → `couplePhotos: false`, dashboard ẩn nút "Hiện ảnh cô dâu & chú rể".
- **Phần phụ thuộc gói** khai báo cùng chỗ (`PLAN_GATED_SECTIONS`): `albumQr` chỉ có từ Pro trở lên. Thiệp Free không render phần đó nên dashboard cũng **không được hiện nút**; nếu vẫn hiện thì khách bật/tắt mà không có gì xảy ra. Khi nâng gói, nút tự xuất hiện vì danh sách tính lại theo `wedding.plan`.
- Danh sách **thứ tự các phần** lấy từ cùng danh sách đã lọc đó, nên phần bị ẩn theo gói cũng không nằm trong danh sách kéo thả (giá trị cũ trong `sectionOrder` vẫn giữ nguyên trong DB, nâng gói là hiện lại đúng chỗ).
- Nút "Nâng cấp lên Pro" chỉ đặt **một chỗ** trong mỗi khối (dưới cùng), không lặp ở header; không thêm dòng "Chỉ gói Pro/VIP" khi đã có nút nâng cấp.
- **Kéo thả thứ tự phải dùng Pointer Events**, không dùng HTML5 `draggable` — HTML5 drag không chạy trên cảm ứng nên mobile không kéo được. Tay nắm cần `touch-action: none`, kích thước ≥ 32px, có viền/nền để nhìn thấy rõ.
- Nút điều hướng đặt trong overlay có cùng `max-width` với khung nội dung, nếu không sẽ trôi ra sát mép khi màn hình rộng.

---

## 22. Nhật ký lỗi & cách tránh (2026-11-18)

Ghi lại toàn bộ bug đã gặp khi làm `do-truyen-thong` và các mẫu trước, dạng **triệu chứng → nguyên nhân → cách fix** để lần sau không lặp.

### 22.1 Key giữa dashboard và template lệch nhau
- **Triệu chứng:** kéo "Sự kiện" lên đầu nhưng thiệp vẫn để ở cuối; nút ẩn/hiện không có tác dụng.
- **Nguyên nhân:** template dùng key `"events"`, dashboard dùng `"map"`; `orderOf()` không tìm thấy nên trả 99.
- **Fix:** dùng đúng bộ key chuẩn (§21), gate `!hidden.has("map")`.
- **Bài học:** template mới phải copy nguyên bộ key từ `config/template-sections.ts`, không tự đặt tên mới.

### 22.2 `order` trong flex nuốt footer
- **Triệu chứng:** footer chen ngay sau "Thông tin gia đình", các section còn lại nằm dưới footer.
- **Nguyên nhân:** mọi section có `style={{ order }}`, footer không có nên mặc định `0`; các section khác ≥ 2.
- **Fix:** đưa footer ra ngoài flex container.
- **Bài học:** phần tử không tham gia sắp xếp thì đừng để chung container flex có `order`.

### 22.3 Bìa `absolute` trong trang dài
- **Triệu chứng:** bìa trong preview chỉ thấy hai cánh đỏ, khối tên/biểu tượng biến mất.
- **Nguyên nhân:** bìa `absolute inset-0` phủ toàn bộ trang dài, `items-center` đặt khối chữ ở giữa trang (ngoài khung điện thoại).
- **Fix:** khi `contained` dùng `items-start pt-[12vh]`; trang thật dùng `fixed inset-0`.
- **Bài học:** overlay trong preview phải neo theo đỉnh khung, không căn giữa container dài.

### 22.4 Ảnh lazy không có kích thước
- **Triệu chứng:** khung hộp quà chiếm chỗ nhưng trống; layout nhảy khi ảnh tải xong.
- **Nguyên nhân:** `loading="lazy"` dưới màn hình đầu có `naturalHeight = 0`, `clientHeight = 0`.
- **Fix:** khai báo `width`/`height` (hoặc `aspect-ratio`) để trình duyệt giữ chỗ.
- **Bài học:** mọi ảnh lazy phải có khung kích thước trước khi tải.

### 22.5 Bảng quá rộng trên desktop nhỏ
- **Triệu chứng:** phải kéo ngang mới thấy nút Sửa/Xoá.
- **Nguyên nhân:** 7 cột + nút chữ ("Chép link", "Chép lời mời") + `whitespace-nowrap`.
- **Fix:** nút icon; cột Thao tác `sticky right-0`; giảm padding; ẩn cột phụ dưới `xl`; chặn nội dung dài bằng `max-w` + `truncate`.
- **Bài học:** `max-width` đặt lên `<td>` gần như không tác dụng với `table-layout: auto` — phải đặt lên **phần tử con bên trong**.

### 22.6 Tiếng Việt hỏng khi sửa file bằng PowerShell
- **Triệu chứng:** file TSX đầy `Cá»­a má»Ÿ…` sau khi sửa.
- **Nguyên nhân:** `Get-Content`/`Set-Content` của Windows PowerShell 5.1 đọc UTF-8 bằng bảng mã ANSI rồi ghi lại.
- **Fix:** dùng `[System.IO.File]::ReadAllText/WriteAllText` với `UTF8Encoding($false)`, hoặc công cụ edit của agent.
- **Bài học:** tuyệt đối không round-trip file có tiếng Việt qua `Get-Content | Set-Content`.

### 22.7 Backtick trong here-string PowerShell
- **Triệu chứng:** code fence trong markdown bị biến thành tab.
- **Nguyên nhân:** trong `@"…"@`, dấu backtick là ký tự escape.
- **Fix:** dùng here-string đơn `@'…'@` hoặc ghi file bằng công cụ edit.

### 22.8 Chụp ảnh mobile bằng Chrome headless bị cắt
- **Triệu chứng:** ảnh 390px bị cắt, nội dung lệch phải.
- **Nguyên nhân:** Chrome kẹp chiều rộng cửa sổ (~500px) và dùng layout viewport lớn hơn.
- **Fix:** dùng CDP `Emulation.setDeviceMetricsOverride` (`mobile: true`), rồi log `innerWidth` / `scrollWidth` để xác nhận.
- **Bài học:** không tin ảnh chụp bằng `--window-size`; luôn kiểm tra `innerWidth === scrollWidth`.

### 22.9 Kéo thả thứ tự trên mobile
- HTML5 `draggable/onDragStart` **không chạy** trên cảm ứng → mobile không kéo được.
- Fix: Pointer Events + `elementFromPoint`, tay nắm `touch-action: none`, ≥ 32px.

### 22.10 Prefetch làm tăng lượt xem
- **Triệu chứng:** `view_count` tăng dù chưa ai mở thiệp.
- **Nguyên nhân:** `<Link href="/m/…">` prefetch RSC → server render chạy `trackGuestView`.
- **Fix:** `prefetch={false}`; link mở tab mới thì dùng `<a target="_blank">`.

### 22.11 VietQR lộ ở gói Free
- **Triệu chứng:** khách Free vẫn có QR chuyển khoản → mất giá trị Pro.
- **Nguyên nhân:** `VietQRGiftBox` render cho mọi gói.
- **Fix:** chỉ render khi `plan !== "free"` **và** chỉ cho bên chưa có ảnh QR riêng; bên đã tự tải ảnh thì ẩn VietQR.
- **Bài học:** tính năng "tự sinh" phải gate ngay ở **component render**, không chỉ ở dashboard.

### 22.12 Motion: bundle và LazyMotion
- `motion` chỉ là wrapper của `framer-motion`; `motion.div` → `m.div` + `LazyMotion(domAnimation)` giảm ~31% engine (48,9 → 33,6 KB gzip).
- Provider đặt ở **biên render template**, không đặt root layout (tránh tải animation cho landing/ops).
- `strict` giúp lỗi thiếu provider lộ ra lúc prerender thay vì animation im lặng.

### 22.13 Animation "nhão" do hai lớp
- **Triệu chứng:** section vừa trượt cả khối vừa trượt từng phần tử, trông mờ nhòe.
- **Nguyên nhân:** wrapper Motion + CSS children cùng animate một vùng.
- **Fix:** chọn một lớp — khối chỉ mờ, con trượt; hoặc chỉ con trượt.
- **Bài học:** không animate cùng một vùng bằng hai engine.

### 22.14 Góc xoay bị cộng dồn
- **Triệu chứng:** polaroid nghiêng quá nhiều.
- **Nguyên nhân:** `-rotate-[3.5deg]` ở class + `rotate: -3.5` trong variant.
- **Fix:** chỉ giữ một chỗ (variant), bỏ class.

### 22.15 Reduced-motion và no-JS
- `.olive-reveal` thiếu override `prefers-reduced-motion` và không có fallback `<noscript>` → nội dung có thể kẹt `opacity: 0`.
- **Fix:** luôn thêm `@media (prefers-reduced-motion: reduce)` cho mọi hiệu ứng CSS tự viết; component dùng `useReducedMotion`.

### 22.16 Ref cập nhật trong render
- **Triệu chứng:** lint báo `react-hooks/refs: Cannot update ref during render`.
- **Fix:** đồng bộ ref trong `useEffect`, không gán `ref.current = x` ngay trong thân component.

### 22.17 Test nhanh một mình thiệp
- `/mau/<id>?opened=1` để bỏ bìa khi QA/chụp ảnh.
- `/mau/<id>?embed=1` **luôn mở sẵn** thiệp (dùng cho landing) → đừng dùng `embed` để test trạng thái bìa.

### 22.18 Checklist khi thêm section mới
1. Khai báo key trong `config/template-sections.ts` (nếu template chưa có).
2. Template đọc `hiddenSections` + `sectionOrder` với **đúng key**.
3. Dashboard hiện toggle + kéo thả tương ứng.
4. Thêm vào `ALL_SECTION_KEYS` + `SECTION_LABELS` trong `config/template-sections.ts` nếu là section mặc định.
5. Chụp ảnh 390 + 1280; kiểm tra `innerWidth === scrollWidth`.
6. Kiểm tra gói Free có bị lộ tính năng Pro không.

### 22.19 Môi trường build/deploy
- Next.js type-check và Chrome headless đều `spawn` tiến trình con có pipe → sandbox chặn `EPERM`; build/verify cần quyền đầy đủ.
- Agent chạy `npm install` trong sandbox để lại **nhãn Low integrity** cho `esbuild.exe` / `next-swc` → `npm run deploy` lỗi `Access is denied` ở `%TEMP%`. Fix: `icacls node_modules /setintegritylevel Medium /T`.
- `npx wrangler login` là lệnh cục bộ, không chạy được trong sandbox; cần owner đăng nhập hoặc set `CLOUDFLARE_API_TOKEN`.

### 22.20 `whileInView` đặt trên phần tử bị clip kín thì không bao giờ chạy
- **Triệu chứng:** ảnh trong khung vòm không hiện; kiểm tra thì `transform` vẫn là `translateY(100%)` (trạng thái `initial`), tức `whileInView` chưa từng bắn.
- **Nguyên nhân:** phần tử được đặt `initial={{ y: "100%" }}` **bên trong** khung `overflow-hidden` → ở trạng thái đầu nó bị cắt kín nên `IntersectionObserver` trả 0 giao điểm.
- **Fix:** đặt `whileInView` trên **khung ngoài** (luôn nhìn thấy), cho phần tử con chạy theo `variants`.
- **Bài học:** phần tử được quan sát phải luôn nằm trong khung nhìn; chỉ cho **con** của nó bị dịch/che.

### 22.21 `useEffect` theo `isOpened` giết hiệu ứng mở thiệp
- **Triệu chứng:** bấm "Mở thiệp" là bìa biến mất ngay, không thấy cảnh rồng/phượng tách sang hai bên.
- **Nguyên nhân:** `handleOpen` gọi `onOpenedChange(true)` → prop `isOpened` đổi → effect `setCoverGone(true)` ngay, unmount bìa trước khi animation kịp chạy.
- **Fix:** trong effect chỉ gỡ bìa khi **không** phải do chính thiệp mở (`if (!closing) setCoverGone(true)`), thêm timer dự phòng 1,1s.

### 22.22 Breakpoint `sm:` sai trong khung preview có bề rộng cố định
- **Triệu chứng:** trên desktop, khung điện thoại 390px vẫn hiện gạch trang trí hai bên tiêu đề và tiêu đề bị xuống dòng.
- **Nguyên nhân:** `sm:` tính theo **viewport trình duyệt** (1280), không theo bề rộng khung preview (390).
- **Fix:** đừng đặt gạch hai bên tiêu đề; dùng gạch trên/dưới hoặc container query.

### 22.23 Ảnh khách gửi bị "flatten" nền caro thay vì có alpha
- **Triệu chứng:** file `.png` mở ra thấy nền caro xám nhưng `alpha` toàn 255 → caro được vẽ vào RGB.
- **Cách xử lý:** key theo độ "vô sắc" (`max-min <= 6`, sáng ≥ 150) + **flood-fill từ toàn bộ viền** + **bít lỗ bên trong**.
- **Ba cái bẫy:** `Image.fromarray` trả buffer read-only → `floodfill` im lặng không chạy (phải `.copy()`); chỉ seed 4 góc sẽ sót "túi" nền bị hoa chặn; nới ngưỡng để bắt hết caro thì nước tràn vào cánh hoa chạm viền (dùng mirror-pad rồi cắt lại).

### 22.24 `coverImage` vừa là thumbnail vừa là `og:image`
- **Triệu chứng:** thẻ mẫu trong `/thiep-cuoi` không có hoạ tiết của bìa thật; chia sẻ link không ra ảnh.
- **Nguyên nhân:** `coverImage` dùng cho cả thumbnail catalog và `og:image`; tôi để file **SVG vẽ tay**, mà SVG không được crawler xã hội render.
- **Fix:** render chính bìa thật bằng CDP, xuất **JPG**, trỏ `coverImage` vào đó.

### 22.25 Nút "Đóng bì thư" không có tác dụng
- **Nguyên nhân:** effect đồng bộ prop chỉ xử lý một chiều (`if (!isOpened) return;`) nên khi cha đặt `isOpened = false` thì `coverGone` vẫn `true`.
- **Fix:** xử lý cả hai chiều, nhánh đóng reset `closing`, `opened`, `coverGone`.
- **Bài học:** prop điều khiển trạng thái mở/đóng phải xử lý **cả hai giá trị**.

---

## 23. Mẫu "Long Phụng" (2026-11-18)

- Nguồn: thư mục `card_design/long_phung/` (mô tả + mockup + 2 asset).
- **Mã màu chính thức (khách cung cấp):** `main #69100F`, `text #E9CE91`. Suy ra: nền `#2A0605`, card đậm `#4A0B0A`, vàng đậm `#C6A45E`, kem `#FAF3E8`, mực `#3B0A0D`.
- **Font:** Charm/Srisakdi không có glyph tiếng Việt → dùng Cormorant Garamond italic cho tên, Playfair cho tiêu đề, Lora cho nội dung.
- **Ruột thiệp nền đỏ trầm**, không phải kem — cả 4 mockup đều nền tối.
- **Asset rồng/phượng:** file gốc là một ảnh đen chứa cả hai, có viền khung. Tách đôi theo khe giữa, dò đường viền để cắt khung, rồi **luminance → alpha** được line-art vàng trong suốt (~85KB mỗi file).
- Album dùng **lưới editorial**: cứ 3 ảnh thì 1 ảnh ngang 3:2 + 2 ảnh dọc 3:4, hiện so le 0,15s.
- Lịch tháng: ngày cưới là **trái tim vàng có glow pulse một lần**.

---

## 24. Mẫu "Đỏ Rượu Vang" (2026-11-18)

- Nguồn: `card_design/Đỏ_rượu_vang/` (mô tả, `color_code.txt`, bìa + 4 mockup, 4 asset).
- **Mã màu khách đưa:** `theme main #390202`, `text #E5E4D0`. Dòng `golder outline: #390202` là **lỗi copy** nên viền vàng dùng champagne `#E5C787` theo mô tả; phụ: burgundy `#6E0B14`/`#8F111D`.
- **Font tên:** Playfair italic (mockup là serif, có dấu tiếng Việt) — không dùng Pattaya.
- **Ruột nền rượu vang trầm**, không phải kem như mô tả.
- **Asset:** 4 file đều flatten nền caro (xem §22.23). Dùng `rose.webp` cho cả hai góc bìa, `garland.webp` làm dải hoa trước phần lời chúc.
- **Album:** coverflow theo mockup (mô tả ghi "editorial grid" nhưng mockup thể hiện rõ coverflow).
- **Đếm ngược:** cập nhật mỗi giây, chỉ render sau khi mount để không lệch hydration.
- **Tone `ruby`** cho RSVP/gift/nút nhạc.

---

## 25. Lời chúc: một người một lời, duyệt, và chạy ngang trên thiệp (2026-11-18)

### 25.1 Lỗ hổng: một người gửi được vô hạn lời chúc
- **Triệu chứng:** khách thoát ra vào lại rồi gửi tiếp → mỗi lần một bản ghi mới, có thể spam 1000 lời chúc.
- **Nguyên nhân:** `POST /api/wishes` và phần lời chúc trong `POST /api/rsvp` đều `insert` mù, không có khoá định danh người gửi.
- **Fix 2 lớp:**
  1. **DB:** cột `wishes.author_key` + unique index `(wedding_id, author_key)` (migration `v18_wish_once.sql`). Khoá: `guest:<guest_id>` cho link riêng, `anon:<uuid>` cho link chung (uuid sinh một lần, lưu localStorage).
  2. **API:** `saveWishOnce()` trong `lib/server/wishes.ts` — tìm bản ghi theo khoá rồi **update**, chưa có mới insert; bắt lỗi 23505 để xử lý race.
- **Chưa chạy migration thì vẫn chặn được** link cá nhân: helper tự lùi về tra theo `guest_id`.
- **UI:** khi mở form, gọi `GET /api/wishes?...&authorKey=` để **điền sẵn lời chúc cũ** và hiện dòng nhắc "Bạn đã gửi lời chúc trước đó — sửa lại rồi gửi để cập nhật".
- **Bài học:** mọi form gửi công khai đều cần một khoá định danh ổn định **ở server**; localStorage chỉ giúp tìm lại bản ghi, không phải lớp bảo vệ.

### 25.2 Duyệt lời chúc (moderation)
- `wishes.approved boolean` + `content.showWishesOnCard` + `content.wishApprovalMode: "manual" | "auto"`.
- **Phụ thuộc:** ẩn section "Lời chúc / Xác nhận" (`hiddenSections` có `rsvp`) thì coi như tắt luôn hiển thị — chặn ở cả API (`wishesHidden`), component, và nút trong dashboard (xám, không bấm được).
- **Duyệt tự động** phải có **popup cảnh báo** trước khi bật; khi bật thì duyệt toàn bộ lời chúc hiện có + lời chúc mới tự duyệt.
- Nút tick từng lời chúc chỉ hoạt động khi tính năng bật; có hover scale + tooltip "Hiển thị lời chúc trên thiệp".
- **Xoá lời chúc ác ý:** mỗi lời chúc có checkbox + nút thùng rác; chọn nhiều thì hiện thanh "Đã chọn N" với `Chọn tất cả` / `Bỏ chọn` / `Xoá đã chọn`. Luôn có **popup xác nhận** vì xoá là vĩnh viễn. API `DELETE /api/weddings/[id]/wishes` nhận `{ ids }`, lọc UUID và luôn kèm `wedding_id` để không xoá chéo thiệp.
- **Hai kiểu hiển thị** (`wishDisplayStyle`):
  - `box` (mặc định): sổ lưu bút cuộn dọc ở cuối thiệp — an toàn, dễ đọc, không che gì.
  - `overlay`: **từng ô lời chúc** nổi ở góc dưới-trái (không có khung lớn bao ngoài), nền **màu chủ đạo của theme** (ô liu với mẫu sáng, đen mờ với mẫu tối) + **chữ trắng**, **cuộn dọc vô tận**, rộng 360–400px, sát đáy, có nút × để ẩn. Chỉ hiện lời chúc đã duyệt.
  - Cả hai dùng chung `usePublicWishes()` — một chỗ fetch, một chỗ kiểm tra điều kiện bật/ẩn section, tránh lệch hành vi.

### 25.3 Sổ lưu bút **cuộn dọc** vô tận (seamless)
- **Đúng ý khách là cuộn DỌC**, không phải chạy ngang như marquee quảng cáo. Khung cuộn cao **bằng ô xác nhận tham dự** (`h-[250px] sm:h-[270px]`), rộng bằng khung chứa.
- **Công thức chuẩn:** render **hai nhóm giống hệt nhau** xếp dọc, mỗi nhóm cùng `gap`/`padding`, rồi `@keyframes` dịch `translateY(0) → translateY(-50%)` (phần trăm tính theo chiều cao của chính phần tử = đúng một nhóm). Nếu chỉ nhân đôi phần tử trong **một** flex có `gap`, dịch -50% sẽ lệch nửa gap và thấy mối nối.
- Pause khi hover/focus; `prefers-reduced-motion` thì tắt animation; 1 lời chúc thì căn giữa, không chạy.
- Đặt component ở **block lời chúc dùng chung** (`RsvpWishBlock`, `TemplateRsvpSection`) để mọi mẫu có cùng hành vi thay vì sửa từng template.
- **Phải đặt NGOÀI form và NGOÀI nhánh "đã xác nhận"**: sau khi khách gửi RSVP/lời chúc, form bị thay bằng thẻ xác nhận — nếu khối lời chúc nằm trong form thì nó biến mất, khách không còn thấy lời chúc của người khác. Vị trí đúng: cuối block, ngay dưới nút "Thay đổi lựa chọn hoặc gửi thêm lời chúc".
- Mỗi lời chúc là một thẻ **full width** (dễ đọc hơn thẻ hẹp), tiêu đề "Sổ lưu bút - nơi lưu giữ lời yêu thương" ở trên; **tên người gửi in đậm**.

### 25.4 Checklist khi thêm cờ nội dung mới
1. `lib/wedding-types.ts`: thêm field vào `WeddingContent` **và** zod schema.
2. `lib/wedding-data.ts`: thêm default, normalize ở **cả hai** hàm (dễ sót hàm thứ hai), map sang `TemplateData` nếu thiệp cần đọc.
3. Dashboard đọc/ghi qua `draftContent`; template đọc qua `TemplateData`.

### 22.26 Reset trạng thái mở khi prop KHÔNG đổi — làm mất hiệu ứng mở và khoá cuộn
- **Triệu chứng:** 3 mẫu mới (Đỏ Truyền Thống, Đỏ Rượu Vang, Long Phụng) bấm "Mở thiệp" **không có animation** và **mở xong không cuộn được**.
- **Nguyên nhân:** effect đồng bộ prop có deps `[isOpened, closing]`. Trang thiệp công khai **không truyền `isOpened`** (luôn `false`) và không truyền `onOpenedChange`, nên khi `handleOpen` đổi `closing` → effect chạy lại → thấy `isOpened === false` → rơi vào nhánh "đóng" và **reset `closing`/`opened`/`coverGone`**. Kết quả: mất nhánh animation, và `opened = false` khiến effect khoá cuộn `body` → không lướt được. Timer 1,1s vẫn gỡ bìa nên thiệp trông như "mở nhưng đơ".
- **Fix:** chỉ đóng khi **CHA thực sự chuyển từ mở → đóng**, dùng ref giữ giá trị trước:
  ```tsx
  const parentOpenedRef = React.useRef(isOpened);
  React.useEffect(() => {
    const wasOpened = parentOpenedRef.current;
    parentOpenedRef.current = isOpened;
    if (isOpened) { setOpened(true); if (!closing) setCoverGone(true); return; }
    if (!wasOpened) return;      // ← chưa từng được cha mở thì đừng reset
    setClosing(false); setOpened(false); setCoverGone(false);
  }, [isOpened, closing]);
  ```
- **Bài học:** effect đồng bộ prop phải phân biệt "cha đổi giá trị" với "effect chạy lại vì dep khác". Chỉ reset khi giá trị **thực sự chuyển**.

### 22.27 `fixed` bị biến thành `absolute` vì tổ tiên có transform
- **Triệu chứng:** overlay lời chúc chỉ hiện khi cuộn tới khu "Xác nhận tham dự".
- **Nguyên nhân:** overlay đặt trong block RSVP; tổ tiên (`RevealSection` của Motion) có `transform` → theo spec, phần tử `fixed` bị neo vào **tổ tiên đó** thay vì viewport, nên nó nằm ở cuối trang.
- **Fix:** `createPortal` ra `document.body` khi không ở khung preview (`!contained`), còn trong preview thì render tại chỗ để vẫn bám khung điện thoại. Cần `mounted` gate để không lệch hydration.
- **Bài học:** muốn overlay "luôn nổi" thì phải portal ra body; đừng tin `fixed` khi tổ tiên có transform/filter/perspective.

### 22.28 Portal ra body làm mất biến CSS của theme
- **Triệu chứng:** overlay lời chúc "nền trắng, chữ trắng" — không đọc được.
- **Nguyên nhân:** overlay portal ra `document.body`, nhưng `--inv-*` / `--color-inv-*` chỉ được định nghĩa **trong cây thiệp** (hoặc trong `.designer-rsvp-theme`). Ra khỏi cây đó thì `var(--inv-olive-btn)` không còn giá trị → `background-color` không hợp lệ → nền trong suốt, chữ trắng trên nền trắng của trang.
- **Fix:** phần tử portal phải dùng **màu cứng** (hoặc truyền màu qua props/inline style từ trong cây thiệp). Không dùng class `bg-inv-*` / `text-inv-*` cho nội dung portal.
- **Bài học:** portal = ra khỏi ngữ cảnh CSS. Mọi biến theme phải được "mang theo" bằng inline style.

### 25.5 Bài học UI/UX khi làm tính năng lời chúc
- **Nút chỉ có icon thì người dùng phổ thông không hiểu.** Con mắt trần để "duyệt lời chúc" là ví dụ: khách không biết bấm để làm gì. Với hành động quan trọng hoặc khó đảo ngược, dùng **button có chữ**: "Hiện trên thiệp", "Đang hiện trên thiệp", "Xoá đã chọn".
- **Xoá là vĩnh viễn → luôn có popup xác nhận** nêu rõ số lượng và hậu quả ("Xoá N lời chúc? … không thể hoàn tác"). Không dùng `confirm()` của trình duyệt.
- **Chọn nhiều phải có "Chọn tất cả" và "Bỏ chọn"** ngay trên thanh công cụ, thanh chỉ hiện khi đã chọn ≥ 1, và xoá xong phải cập nhật danh sách ngay (không bắt tải lại).
- **Chữ trắng trên nền trong suốt = không đọc được.** Nền overlay phải là **màu đặc hoặc độ đục cao (≈85–90%)** của màu chủ đạo + chữ trắng. Để 100% trên nền sáng thì thành "nền trắng chữ trắng" (đã gặp thật).
- **Không bọc khung lớn cho overlay**: chỉ từng ô lời chúc, sát mép, rộng 360–400px. Khung lớn chiếm chỗ và trông như một khối UI lạc vào thiệp.
- **Cuộn dọc liên tục dễ chịu hơn "hiện rồi mờ đổi"** với nội dung dài; kiểu đổi theo nhịp chỉ hợp khi mỗi mục rất ngắn.
- **Ưu tiên "an toàn trước, đẹp sau"**: overlay phải nằm ở góc, không phủ QR/nút, chỉ hiện lời chúc đã duyệt.

---

## 26. Giữ `card_exp.md` không bị hỏng (bài học rất đắt)

- **Đã từng mất §23 và §24** (mẫu Long Phụng, Đỏ Rượu Vang) chỉ vì một lần `edit` báo `ReplaceFileW EIO`, sau đó đọc lại file rồi ghi đè — mà bản đọc được đã bị cắt cụt từ trước.
- **Nguyên nhân phụ:** ghi tiếng Việt qua here-string của PowerShell rồi để Node đọc lại → **mojibake** (`Ä‘áº·t`, `má»‡nh`) do encoding bị đổi giữa chừng.
- **Quy tắc an toàn khi sửa file này:**
  1. Soạn nội dung tiếng Việt bằng công cụ `write` (UTF-8 chuẩn) ra file tạm, rồi dùng Node **chỉ để nối file** — không nhúng tiếng Việt vào script.
  2. Trước khi ghi đè: **kiểm tra số mục** (`^## `, `^### 22\.`, `^### 25\.`) để phát hiện file đã bị cắt.
  3. Sau khi ghi: **grep mojibake** (`Ã`, `áº`, `á»`) và đọc lại ~20 dòng cuối.
  4. Nếu `edit` báo EIO hoặc không ghi được: **đọc lại toàn bộ file** rồi mới quyết định, đừng append mù.
  5. Nội dung dài soạn ở file tạm; `card_exp.md` chỉ là nơi ráp lại.
- **Bài học chung:** file tài liệu quan trọng cũng cần "kiểm chứng sau khi ghi" giống như code — số mục, encoding, và nội dung cuối.

---

## 27. Ảnh cưới: mỗi mẫu chỉ cho upload ô ảnh mà thiệp thật sự hiển thị (2026-11-18)

- **Vấn đề:** tab "Ảnh cưới" luôn hiện đủ 3 ô (ảnh bìa chính, ảnh chú rể, ảnh cô dâu) + album, bất kể template có dùng hay không → khách tải ảnh lên mà thiệp không hề hiển thị.
- **Giải pháp:** thêm capability vào `config/template-sections.ts`:
  ```ts
  type TemplatePhotoSlots = { hero: boolean; couple: boolean; gallery: boolean };
  getTemplatePhotos(templateId)   // mặc định true hết, ngoại lệ ở PHOTO_OVERRIDES
  ```
- `PhotosManager` nhận thêm `templateId`, lọc `SINGLE_SLOTS` theo `hero`/`couple` và tắt album khi `gallery === false`.
- Hiện tại: `minimal-red` = `{ hero: false, couple: false, gallery: true }`.
- **Quy ước:** template mới **không có ảnh hero** hoặc **không có ảnh chân dung** thì khai báo trong `PHOTO_OVERRIDES`, **không sửa `PhotosManager`**.
- **Phân biệt rất dễ lẫn:**
  - `TemplateSections.couplePhotos` = có khối ảnh cô dâu/chú rể **trong phần gia đình** hay không.
  - `TemplatePhotoSlots.couple` = có **ô upload** ảnh chân dung trong tab Ảnh cưới hay không.
  - Hai thứ khác nhau; đừng dùng lẫn (mẫu có thể có ảnh hero mà vẫn không có ảnh chân dung, hoặc ngược lại).

---

## 28. Mẫu "Minimal Red" (2026-11-18)

- Nguồn: `card_design/đỏ_minimal/` (3 guide + `bìa` + 4 mockup + 3 asset).
- **Màu:** main `#390102`, nút/nhãn vàng `#e1bc7c`. Trên nền đỏ dùng **chữ vàng**; `#390102` chỉ dùng cho chữ trên nền sáng/nút. (File `color_code` ghi `text #390102` — hiểu là màu chữ trên nền kem, không phải chữ trên bìa.)
- **Không ảnh bìa, không ảnh chân dung**, chỉ có album → khai báo ở §27.
- **Animation theo guide:**
  - Khung chỉ vàng kép hiện bằng **scale + fade** (dùng `border` trên div).
  - Chữ hiện dần kiểu **mask reveal** bằng CSS `clip-path` (`@keyframes minred-wipe`).
  - Mở thiệp: **hai cánh cửa son trượt sang hai bên**, nội dung mờ dần; dấu **triện sáp vàng** thay cho nút thường.
  - 12 ngôi sao ✦ nhấp nháy ở hậu cảnh.
- **Bài học SVG:** KHÔNG dùng `preserveAspectRatio="none"` cho khung viền — nét ngang bị kéo giãn thành **vạch dày** cắt ngang chữ (đã gặp thật). Dùng `border` hoặc `vector-effect="non-scaling-stroke"`.
- **Asset:** cả 3 file đều bị flatten nền caro (§22.23). Với hoa văn: key theo độ vô sắc + flood toàn viền, rồi **xoá hẳn pixel vô sắc còn sót** để thành line-art vàng sạch (nếu chỉ tô vàng sẽ còn vệt caro trong cánh hoa).
- **Tone riêng `minred`:** khối RSVP/gift/nhạc của mẫu này phải dùng nền **transparent** + viền vàng, không dùng tone có nền đỏ khác (ví dụ `velvet` nền `#4A0808`) vì sẽ thành một dải lệch màu giữa thiệp.
- **Ảnh bao lì xì:** khách gửi ảnh hai phong bì vàng (nền caro) → key thành `envelope.webp` và thay cho hộp quà ở mục "Hộp quà mừng".

---

## 29. Mẫu "Minimal Brown" — Nâu Đất & Kem Gấm (2026-11-18)

- Nguồn: `card_design/nâu_minimal/` (`guide.md`, `animation.md`, `color_code.txt` **để trống**, `bìa` + 5 mockup, 3 asset).
- **Palette sample từ `bìa.png`** (vì color_code rỗng): nền be `#F1E5D9`/`#EBDBCC`, thẻ kem `#FBF7F0`, nâu `#5A3A22`, nâu đậm `#3A2314`, vàng nhũ `#C9A25E`, chữ phụ `#8A7360`.
- **Ô ảnh (khác minimal-red):** `{ hero: false, couple: true, gallery: true }` — **không có ảnh chung ở hero**, nhưng **có 2 ảnh chân dung riêng** (đúng như bìa thư + hai polaroid trong mockup).
- **Hero "Save The Date":** phong bì nâu + con dấu sáp vàng, hai ảnh polaroid trượt ra khỏi phong bì (stagger 0.15s, nghiêng nhẹ, đung đưa chậm), tên hai người hiện dưới với chữ `&` mờ lớn phía sau.
- **Bìa:** nền be + cành lá màu nước hai góc + bụi nhũ vàng, thẻ kem viền chỉ vàng, huy hiệu trái tim nâu, nút viên thuốc nâu chữ trắng.
- **Bài học quan trọng:** khi đổi palette từ tối sang sáng, phải sửa **cả `backgroundImage` gradient của root**, không chỉ `backgroundColor`. Đã gặp lỗi: chữ nâu trên nền nâu vì root vẫn còn `radial-gradient` tối từ template cũ.
- **Đổi tên hằng số:** copy template rồi đổi `RED → BROWN`, `RED_DEEP → BROWN_DEEP`, `BG_DARK → BEIGE`, `ON_RED → ON_BROWN` bằng regex `\b` để không sót chỗ dùng; nhớ **xoá khối font bị trùng** do splice palette đè lên.

---

## 30. Mẫu "Flowery White" — Xanh Rêu & Hoa Mộc Lan (2026-11-19)

- Nguồn: `card_design/flowery_white/` (`guide.md` 88 dòng, `bìa` + 5 mockup, 5 asset). `color_code.md` **rỗng** → dùng mã khách cấp: theme `#464E25`, card `#FDFAF5`, text `#595638`.
- **Ô ảnh:** `{ hero: false, couple: false, gallery: true }` — không ảnh hero, không ảnh chân dung, chỉ album.
- **Bìa (làm kĩ theo guide):** nền xanh rêu đậm có radial sáng giữa, bokeh vàng kim trôi chậm, hai cụm hoa mộc lan đung đưa ở hai góc, thẻ kem `#FDFAF5` bo 10px đổ bóng mềm, **vương miện hoa (wreath)** trên tên, hoa ở bốn góc trong thẻ, tên Playfair xanh rêu, nút viên thuốc xanh rêu viền vàng.
- **Animation mở thiệp:** thẻ **trượt lên + mờ dần**, hai cụm hoa góc **dạt ra hai mép** (vén màn vườn hoa) rồi mới gỡ bìa — đúng mô tả guide.
- **Asset:** `asset1_khung_tên` và `asset2_vòng_hoa` đã có alpha thật → chỉ resize. `asset3/4/5` bị flatten nền caro → key theo "vô sắc + sáng" rồi flood từ viền; **hoa trắng nằm trong vùng kín vẫn giữ được** nhờ flood chỉ từ biên.
- **Bài học asset trắng trên nền caro:** nếu key theo ngưỡng sáng hẹp (190–247) sẽ còn **nền trắng**; phải mở ngưỡng (`mx >= 185`) và flood từ viền để không ăn mất cánh hoa.
- **ĐÃ SỬA (2026-11-19):** hai cụm hoa góc nền không hiện vì lớp `absolute inset-0` của bìa bị neo vào container cao hơn khung điện thoại. **Cách sửa đúng: gắn hoa vào chính khung thẻ** (`relative max-w-[368px]`) với offset âm + `-z-10` → hoa luôn nằm cạnh thẻ dù container cao bao nhiêu.
  - **Bài học:** decoration phải neo vào **phần tử đã xác định được vị trí** (khung thẻ), không neo vào root overlay.
- **Trang trí + animation ruột thiệp đã thêm:** hoa chìm (opacity 10%) ở hai góc **mọi section** qua `SectionReveal`; **vòm cung nét đôi tự vẽ** (SVG `pathLength`) + hoa ở chân vòm trong Hero; **đường nối timeline tự vẽ** (`scaleY` theo cuộn, lệch nhịp từng mốc); trái tim lịch nhịp đập + quầng sáng vàng kim.
- **Sửa màu thẻ sự kiện:** đang dùng nền đỏ mờ `rgba(96,14,14,0.55)` (di sản từ mẫu đỏ) → đổi sang nền kem `#FDFAF5` + viền olive, chữ olive.
- **Kết quả kiểm chứng:** ảnh chụp 390px xác nhận hoa hai góc nền đã hiện, thẻ sự kiện đúng tông, lịch + nút xác nhận đúng màu.
