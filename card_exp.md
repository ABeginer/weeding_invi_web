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
