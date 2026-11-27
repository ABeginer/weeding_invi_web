# Prompt giao `agy`: Xây dựng mẫu thiệp cưới gói Standard — **"Một Thời Để Nhớ – Vintage Love Story"** (`mot-thoi-de-nho`)

## 1. Thông tin đăng ký Template (Metadata & Tier)
- **Slug**: `mot-thoi-de-nho`
- **Tên hiển thị**: `Một Thời Để Nhớ`
- **Phụ đề / Concept**: `Vintage Love Story`
- **Danh mục (Category)**: `Lãng mạn`
- **Gói (Tier)**: **`Standard`** (giữ nguyên key nội bộ `pro` — 159.000đ theo quy chuẩn platform, UI hiển thị badge `Standard`).
- **Tông màu lọc (Color filter)**: Kem / Nâu Vintage (`#F5EFE2`, `#B99976`, `#7C3629`).
- **Thư mục Asset**: Giải nén file `mot-thoi-de-nho-assets.zip` vào `public/templates/mot-thoi-de-nho/`.
  Danh sách 12 asset `.webp` đi kèm (đều đã tách nền trong suốt & nén tối ưu WebP):
  1. `bg-vintage-paper.webp` — Nền giấy kem ngả vàng texture giấy cũ (dùng làm nền xuyên suốt toàn thiệp).
  2. `kraft-note-card.webp` — Mẩu giấy nâu kraft xé tay mộc mạc (dùng cho thẻ Câu chuyện tình yêu / Ghi chú).
  3. `wax-seal-terracotta.webp` — Con dấu sáp niêm phong màu nâu đỏ ép hoa cúc nhỏ (dùng trên phong bì mở thiệp & điểm nhấn).
  4. `pressed-flowers-corner-1.webp` — Cụm hoa ép khô góc (hoa baby trắng, cúc nhỏ, lá khuynh diệp & dương xỉ khô).
  5. `pressed-flowers-corner-2.webp` — Cành lá khô, hoa baby & nụ cúc ép nhỏ (trang trí góc đối diện bất đối xứng).
  6. `vintage-stamp-postmark.webp` — Tem thư cổ `LOVE POST · FOREVER` kèm dấu bưu điện mực nâu mờ.
  7. `lace-ribbon-divider.webp` — Dải ren cotton cổ & ruy băng vải lanh màu be (ngăn cách section tinh tế).
  8. `washi-tape-beige.webp` — Dải băng keo giấy Washi Tape màu be kem mờ tự nhiên.
  9. `washi-tape-kraft.webp` — Dải băng keo giấy Washi Tape màu nâu kraft.
  10. `gift-box-closed.webp` — Hộp quà kỷ niệm giấy kraft buộc ruy băng lanh + hoa baby + dấu sáp (trạng thái đóng).
  11. `gift-box-opening.webp` — Hộp quà kỷ niệm trạng thái đang hé mở có ánh sáng ấm.
  12. `gift-box-opened.webp` — Hộp quà kỷ niệm mở hẳn hé lộ xấp thư tay & hoa cúc khô bên trong.

---

## 2. Định hướng thẩm mỹ, Bảng màu & Typography (Handmade Vintage Scrapbook)
Cảm giác tổng thể khi khách mở thiệp phải giống như **mở một cuốn nhật ký tình yêu hoặc chiếc hộp lưu giữ kỷ niệm làm bằng tay** — mộc mạc, hoài niệm, ấm áp, tinh tế và dễ đọc trên điện thoại (**tuyệt đối không** giống website hiện đại công nghiệp, **không** dùng màu rực rỡ/tương phản gắt, **không** dùng bất kỳ icon ngôi sao/sparkle nào).

### Bảng màu chủ đạo (Palette)
- **Kem giấy cũ (Nền chính)**: `#F5EFE2` (phủ lớp `bg-vintage-paper.webp` độ mờ tinh tế).
- **Be ngả vàng (Thẻ giấy / Phong bì)**: `#EDE3CE` / `#FAF6EC`.
- **Nâu kraft (Thẻ ghi chú / Nhấn nhẹ)**: `#C4A484`.
- **Nâu đất (Chữ chính & đường nét mực viết tay)**: `#4A3728` (body text `#5E493A` dễ đọc, độ tương phản tốt).
- **Nâu đỏ trầm (Điểm nhấn dấu sáp / nút chính)**: `#7C3629` (hover `#642A1F`).

### Bộ Font chữ hỗ trợ 100% tiếng Việt (Google Fonts)
- **Chữ viết tay nghệ thuật (Tên cô dâu chú rể, chú thích Polaroid, ghi chú nhật ký)**: `Dancing Script` hoặc `Playwrite VN` / `Charm` (mềm mại, tự nhiên như bút mực cổ).
- **Serif cổ điển (Tiêu đề section, ngày tháng)**: `Cormorant Garamond` / `Playfair Display` (hỗ trợ đầy đủ dấu tiếng Việt).
- **Body mộc mạc dễ đọc**: `Be Vietnam Pro` hoặc `Lora` (`15px–16px`, `line-height: 1.75`).

---

## 3. Hiệu ứng mở thiệp (Chậm rãi, tự nhiên, giàu cảm xúc)
Khi khách truy cập link thiệp:
1. Hiển thị toàn màn hình nền giấy kem cũ ấm áp với **một phong thư vintage màu kem** căn giữa, có đường gấp nắp tam giác tinh tế, tem thư `vintage-stamp-postmark.webp` dán lệch góc phải trên và **con dấu sáp nâu đỏ `wax-seal-terracotta.webp`** niêm phong ngay mũi nắp thư kèm dòng chữ viết tay nhỏ *"Chạm mở lá thư kỷ niệm"*.
2. **Khi khách chạm/click vào phong thư**:
   - **Gọi `triggerInvitationOpened()` đồng bộ ngay trong `onClick`** (từ `useInvitationExperience()`) để phát nhạc nền vintage lập tức (tương thích 100% Safari iOS & Zalo) và bật SFX mở phong bì giấy nhẹ nhàng.
   - **Chuỗi animation chậm rãi (~1.4s tổng)**:
     1. Con dấu sáp mờ/tách nhẹ → nắp phong thư mở từ từ lên trên (`rotateX` mượt bằng Framer Motion / CSS 3D).
     2. Một **tấm thiệp giấy kem nhỏ** có tên cô dâu chú rể **trượt nhẹ lên trên** từ bên trong phong bì.
     3. Toàn bộ màn mở thư **fade nhẹ** (`opacity: 1 → 0`) để lộ trang bìa scrapbook chính bên dưới, sau đó Auto-Scroll mượt bắt đầu tự chạy.

---

## 4. Cấu trúc đầy đủ 7+ phần nội dung trong thiệp (Scrapbook Layout)
Bố trí các asset trang trí (`pressed-flowers`, `washi-tape`, `vintage-stamp`, nét vẽ doodle SVG bút chì mảnh như trái tim nhỏ/mũi tên cong/nhánh lá) **một cách tự nhiên, hơi bất đối xứng** như dán thủ công — **không** đối xứng cứng nhắc và **không** che chữ hay cắt mặt ảnh.

1. **Bìa thiệp (Scrapbook Cover Hero)**:
   - Nền giấy kem cũ `bg-vintage-paper.webp`, khung giấy có viền sờn/giấy xé nhẹ (`clip-path` hoặc border SVG mép giấy xé tự nhiên).
   - Phía trên: dòng nhỏ tinh tế **`Our Wedding Invitation`**.
   - Chính giữa là điểm nhấn lớn nhất: **Tên Cô Dâu & Chú Rể** bằng font viết tay mềm mại màu nâu đất đậm, kèm ngày cưới gọn gàng bên dưới.
   - Góc trên trái điểm nhẹ `pressed-flowers-corner-1.webp`, góc trên phải dán `vintage-stamp-postmark.webp` hơi nghiêng `4deg`, góc dưới đối diện điểm nhẹ `pressed-flowers-corner-2.webp` — giữ khoảng thở rộng để **tên hai bạn là tâm điểm chính**.
   - Khung ảnh bìa (Hero Photo) dán nghiêng nhẹ `-1.5deg` bằng 2 miếng `washi-tape-beige.webp` ở 2 góc trên.
2. **Lời mời tham dự lễ cưới & Hai bên gia đình**:
   - Văn phong mộc mạc, trân trọng, ấm áp (tuyệt đối không dùng `"gia tộc"`, `"thân sinh:"`, `"bố mẹ:"`, `"sự kiện trọng đại"`).
   - Hiển thị thông tin Nhà Trai & Nhà Gái gọn gàng (1 cột chuẩn trên Mobile, 2 cột cân đối trên Desktop), ngăn cách bằng dải ren & ruy băng `lace-ribbon-divider.webp`.
3. **Câu chuyện tình yêu (Love Story — Mẩu giấy ghi chú nhật ký)**:
   - Trình bày như **những mẩu giấy ghi chú viết tay** đặt trên nền `kraft-note-card.webp` và giấy kẻ dòng mờ, đính bằng `washi-tape-kraft.webp`, điểm thêm vài nét vẽ doodle SVG mảnh (trái tim vẽ tay, đường chấm gạch nối mốc thời gian) kể ngắn gọn hành trình yêu thương của hai bạn.
4. **Album ảnh kỷ niệm (Scrapbook Gallery — 5 đến 7 vị trí ảnh đa khung thủ công)**:
   Thiết kế bố cục scrapbook xen kẽ cực có gu với **6 vị trí ảnh mặc định** (hỗ trợ linh hoạt 5–7+ ảnh do khách tải lên, click ảnh mở Lightbox xem to) kết hợp **đủ cả 4 kiểu khung khách yêu cầu** (tuyệt đối bảo đảm ảnh nằm gọn trong khung `overflow-hidden`, không bị viền cắt ngang mặt):
   - **Khung Polaroid (2 ảnh)**: viền trắng dày đáy rộng, xoay nghiêng nhẹ `-2deg` / `+1.5deg`, dán góc trên bằng `washi-tape-beige.webp`, bên dưới có dòng chú thích viết tay nhỏ (*"Ngày chung đôi"*, *"Một thời để nhớ"*...).
   - **Khung giấy xé không đều (1–2 ảnh)**: ảnh đặt trên lớp giấy kem/kraft có mép xé răng cưa tự nhiên (`SVG mask` / `clip-path`), cố định bằng băng keo `washi-tape-kraft.webp`.
   - **Khung album cổ 4 góc giữ ảnh (1–2 ảnh)**: 4 góc tam giác da nâu cổ điển (photo corners vẽ bằng CSS/SVG) giữ 4 góc bức ảnh trên trang giấy kem.
   - **Dải ảnh phim cổ (Film Strip — 2–3 ảnh nối tiếp)**: dải phim nâu đen cổ điển (lỗ phim nằm **ngoài** vùng ảnh, tuyệt đối không đè lên ảnh) cuộn ngang mượt hoặc xếp nghiêng nhẹ như cuộn phim kỷ niệm ngày xưa.
5. **Thông tin Thời gian, Địa điểm & Bản đồ chỉ đường (Hỗ trợ đầy đủ Đa Lễ)**:
   - **Bắt buộc tuân thủ luật Đa Lễ**: dùng helper `getVisibleEventsForGuest(weddingData, guest)` và `.map()` hiển thị **đầy đủ tất cả các lễ** khách được mời (1, 2, 3+ lễ — tuyệt đối không hardcode `events[0]`).
   - Mỗi lễ trình bày như một **tấm bưu thiếp / phiếu mời giấy kem** có đóng dấu sáp nhỏ hoặc tem góc, hiển thị đầy đủ: Tên lễ, Ngày dương lịch (+ âm lịch), Thứ & Giờ, Tên địa điểm, Địa chỉ chi tiết, kèm **nút Chỉ đường Google Maps** (và/hoặc khung bản đồ chỉ đường gọn gàng) trỏ đúng địa điểm riêng của lễ đó.
   - Kèm **Lịch tháng vintage** khoanh tròn bằng nét bút mực tay (SVG vòng tròn vẽ tay) vào tất cả các ngày có lễ trong `visibleEvents`, và **Đồng hồ đếm ngược** phong cách giấy lịch xé cổ điển tính theo lễ gần nhất sắp diễn ra.
6. **Hộp Quà (3 trạng thái chuẩn `useGiftBoxInteraction`)**:
   - Tiêu đề gọn sạch: **`HỘP QUÀ`** (không lặp eyebrow thừa).
   - Hiển thị chính giữa bộ 3 trạng thái hộp quà kỷ niệm giấy kraft (`gift-box-closed.webp` → `gift-box-opening.webp` → `gift-box-opened.webp`) dùng chung `useGiftBoxInteraction` có độ trễ **`700ms`** + SFX trước khi mở `GiftModal` QR mừng cưới.
7. **Xác nhận tham dự (RSVP) & Lời chúc**:
   - Tiêu đề gọn sạch: **`XÁC NHẬN THAM DỰ`** (không thêm dòng phụ thừa `"RSVP · ĐẶT CHỖ..."`).
   - Thiết kế form như một **tấm bưu thiếp phản hồi vintage** (ô nhập gạch chân kiểu dòng kẻ thư tay, nút gửi màu nâu đỏ trầm `#7C3629` kèm dấu sáp nhỏ).
   - Nếu template có khối Dress Code thì **chỉ hiển thị các chấm tròn màu sắc (color swatches)** theo bảng màu kem – be – nâu đất – nâu đỏ, tuyệt đối không in mã hex `#XXXXXX` hay tên màu hardcode.

---

## 5. Yêu cầu kỹ thuật & QA bắt buộc (Tuân thủ `card_exp.md`)
- Dùng `useInvitationExperience()` dùng chung: mở phong thư là phát nhạc ngay + chạy Auto-Scroll mượt (tự dừng ngay khi khách cuộn tay hoặc focus ô RSVP / mở Modal).
- Không dùng bất kỳ icon ngôi sao / sparkle nào (`Star`, `Sparkles`, `✨`) trong toàn bộ template.
- Không lặp eyebrow trùng nghĩa với heading.
- Chạy `npx tsc --noEmit`, `npm run build` và kiểm tra `/browser` trên cả **Desktop (`1440×900`)** và **Mobile (`375×812`)** với bộ dữ liệu test **2 lễ** để xác nhận:
  - Phong bì mở mượt, tấm thiệp trượt lên, fade sang bìa scrapbook, nhạc phát & Auto-Scroll chạy ổn định.
  - Đủ 4 kiểu khung ảnh scrapbook (Polaroid, giấy xé, 4 góc ảnh cổ, dải phim) hiển thị đẹp, không cắt mặt, không tràn ngang trên Mobile `375px`.
  - Hiển thị đầy đủ cả 2 lễ + 2 nút Google Maps riêng biệt.
  - Hộp quà 3 trạng thái căn giữa, mở đúng 700ms + modal QR.
  - Chụp lại ảnh bìa `cover.webp` (chuẩn không dính badge `N`, không lệch phải) và gắn vào danh mục `Lãng mạn` gói `Standard` (`pro`).
