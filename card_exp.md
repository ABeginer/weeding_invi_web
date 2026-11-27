# card_exp.md — Chuẩn Kiến Trúc & Kinh Nghiệm Xây Dựng Thiệp Cưới Inviwedd

> **Mục đích:** Đây là tài liệu chuẩn bắt buộc dành cho AI/Developer khi tạo mới, nâng cấp hoặc bảo trì các mẫu thiệp cưới trên Inviwedd. Đọc kỹ tài liệu này **kết hợp với `AGENTS.md`, `lib/wedding-types.ts` và `config/template-sections.ts`** trước khi viết code.

---

## PHẦN I: KIẾN TRÚC HỆ THỐNG & HỢP ĐỒNG DỮ LIỆU

### 1. Hai hệ thống template (Tuyệt đối không trộn lẫn)
* **Code Template (`templates/<id>/index.tsx`):**
  * Render thông qua `TemplatePreviewRenderer` (dùng `ThemedTemplate` hoặc custom React component).
  * Hỗ trợ responsive thực, animation phức tạp (Framer Motion / CSS), hiệu ứng mở phong bì, Web Audio, và logic tương tác sâu.
  * **Giới hạn:** Không thể chỉnh sửa từng element bằng kéo-thả trong `/ops/designer`.
* **Designer Template (Canvas JSON trong DB `designer_templates` & `designer_template_versions`):**
  * Chỉnh sửa trực quan trong `/ops/designer` (tọa độ phần trăm `%`).
  * **Giới hạn:** Không biểu diễn được hiệu ứng React/CSS phức tạp.
* **Nguyên tắc:** Khách yêu cầu thiết kế độc bản & hiệu ứng cao cấp $\rightarrow$ làm **Code Template**. Khách cần tự kéo-thả bố cục $\rightarrow$ làm **Designer Template**.

### 2. Kiến trúc Khung Xem Trước (`PhoneFrame` & Iframe Sandbox)
* Trang xem thử (`/mau/[templateId]`) và trình chỉnh sửa dùng **Iframe Sandbox Viewport** cho chế độ điện thoại:
  * Iframe tải `/mau/<id>?embed=1` với chiều rộng mobile thực ($\approx 360\text{px} - 390\text{px}$), giúp các breakpoint `sm:`, `md:` hoạt động chuẩn như trên điện thoại thật mà không bị dính độ phân giải desktop.
  * Giao tiếp trạng thái mở/đóng bìa giữa trang cha và iframe qua `postMessage` (`inviwedd:demo:opened`) và prop điều khiển `isOpened` / `onOpenedChange`.
* **Các tham số URL hỗ trợ QA:**
  * `/mau/<id>?opened=1`: Bỏ qua màn hình bìa, mở thẳng ruột thiệp để test nhanh.
  * `/mau/<id>?embed=1`: Chế độ nhúng preview.

### 3. Quy tắc Tiêu thụ Dữ liệu & Zero Fallback Shims
* **Không tổng hợp fallback object giả tạo trong component:** Nếu dữ liệu từ CMS/API thiếu hoặc `null`, component xử lý bằng điều kiện render sạch (`if (!data.button?.link) return null;`), tuyệt đối không tự bịa text/link mẫu hardcode trong JSX.
* **Đồng bộ trạng thái mở/đóng (`isOpened`):** Phải xử lý hai chiều. Dùng `useRef` lưu giá trị `isOpened` trước đó của trang cha để chỉ reset trạng thái bìa khi trang cha **thực sự chuyển từ `true` sang `false`** (tránh lỗi re-render làm mất animation mở thiệp và khóa cuộn trang).
* **Khi thêm trường dữ liệu mới:** Cập nhật đồng bộ 3 nơi:
  1. `lib/wedding-types.ts` (`WeddingContent` & Zod schema).
  2. `lib/wedding-data.ts` (giá trị mặc định, hàm normalize, và mapper sang `TemplateData`).
  3. Dashboard editor & Template component.

### 4. Khai báo Capabilities của Từng Template (`config/template-sections.ts`)
Mỗi template có cấu trúc section và slot ảnh khác nhau. Dashboard **chỉ hiển thị nút điều khiển cho những phần template thực sự hỗ trợ**:
1. **Section & Thứ tự (`getTemplateSections(templateId)`):**
   * Bộ key chuẩn: `family`, `calendar`, `map`, `dresscode`, `album`, `albumQr`, `gift`, `rsvp`, `music`, `story`.
   * Template đọc `data.hiddenSections` và `data.sectionOrder` theo đúng bộ key này.
   * **Lưu ý Flexbox `order`:** Đưa `<footer>` ra ngoài container flex có thuộc tính `order`, nếu không footer có `order: 0` sẽ nhảy lên đầu trang.
   * **Kéo-thả sắp xếp trên mobile:** Dùng Pointer Events (`touch-action: none`, vùng chạm $\ge 32\text{px}$), không dùng HTML5 `draggable`.
2. **Slot Ảnh Cưới (`getTemplatePhotos(templateId)` & `PHOTO_OVERRIDES`):**
   * Phân biệt rõ:
     * `TemplatePhotoSlots` (`{ hero: boolean; couple: boolean; gallery: boolean }`): Quyết định tab "Ảnh cưới" trong Dashboard hiện ô upload nào. Mẫu không có ảnh bìa hoặc không có ảnh chân dung cô dâu/chú rể **bắt buộc** khai báo trong `PHOTO_OVERRIDES` để ẩn ô upload thừa.
     * `TemplateSections.couplePhotos`: Quyết định có hiển thị khối ảnh chân dung trong phần thông tin gia đình hay không.
3. **Phân quyền Gói Dịch Vụ (Quy ước tên hiển thị ↔ mã code trong DB/TS):**
   * **Miễn phí (`0đ`)** ↔ mã code `free`: Tối đa 20 khách, 2 sự kiện, 5 ảnh gallery, 0 ảnh album khách.
   * **Standard (`159.000đ`)** ↔ mã code `pro`: Không giới hạn khách, 10 sự kiện, 30 ảnh gallery + 30 ảnh album khách, VietQR, Album QR, Chuyện chúng mình (`story`).
   * **Pro (`399.000đ`)** ↔ mã code `vip`: Không giới hạn khách, 20 sự kiện, 50 ảnh gallery + 300 ảnh album khách, trải nghiệm sảnh tiệc (LED / Photo Wall / duyệt ảnh / Share PIN).
   * *Lưu ý quan trọng:* Tên hiển thị cho khách hàng **luôn gọi là `Miễn phí` / `Standard (159k)` / `Pro (399k)`** thông qua `getPlanLabel(plan)`. Tuyệt đối không in thô chữ `VIP` hay `PRO` cho gói `Standard`.
   * **Chuyện chúng mình (`story` / `loveStory`):** Chỉ kích hoạt từ gói **Standard (`159k`, mã `pro`)** và **Pro (`399k`, mã `vip`)**. Gói Miễn phí tuyệt đối không có section này. Dữ liệu mốc kỷ niệm (`data.story`: `{ id?, year?, title, content }`) tách biệt độc lập 100% khỏi lịch trình ngày cưới (`data.timeline`).
   * **Mừng cưới & VietQR:** Component render QR tự động chỉ kích hoạt khi `plan !== "free"` **và** bên nhận chưa tải lên ảnh QR cá nhân riêng; không lặp thẻ tài khoản ngân hàng giữa `GiftModal` và `VietQRGiftBox`.

---

## PHẦN II: QUY TẮC GIAO DIỆN, TRẢI NGHIỆM & ASSET (UI/UX)

### 5. Trang Bìa (Cover) & Chống Trôi Layout
* **CẤM VĨNH VIỄN ICON HÌNH NGÔI SAO / SPARKLES:**
  * **TUYỆT ĐỐI KHÔNG** sử dụng icon hình ngôi sao / sparkles (`Sparkles`, `Star`, `Sparkle` từ `lucide-react`, ký tự `✨`, `✦`, SVG ngôi sao trang trí) trong giao diện web, badge, nút bấm hay template thiệp cưới.
  * Thay bằng: Chấm tròn mảnh (`h-1.5 w-1.5 rounded-full`), đường kẻ tối giản, hoặc bỏ hẳn icon để badge/nút bấm tinh tế, sang trọng.
* **Khóa chiều cao thẻ gốc khi bìa chưa mở (`!coverGone`):**
  * Nếu ruột thiệp dài $4000\text{px}$ vẫn chiếm không gian trong DOM lúc chưa mở thiệp, lớp phủ bìa (`absolute inset-0`) sẽ căn giữa ở tọa độ $Y \approx 2000\text{px}$, khiến thẻ bìa trôi tuột khỏi khung nhìn và auto-scroll của preview bị kẹt ở đáy trang trống.
  * **Giải pháp bắt buộc:**
    * Khi `!coverGone`: Áp dụng `h-full overflow-hidden` (nếu `contained`) hoặc `h-screen-dvh max-h-full overflow-hidden` (trên thiết bị thật), đồng thời ẩn hoàn toàn khối ruột thiệp bằng `hidden` cho đến khi bắt đầu hiệu ứng mở.
    * Khi mở thiệp trên thiết bị thật (`!contained`): Gọi `window.scrollTo({ top: 0, behavior: "auto" })` để đảm bảo bắt đầu từ đỉnh Hero.
* **Tách riêng nền Mobile & Desktop:** Chuẩn bị `background-mobile.webp` ($720 \times 1280\text{px}$, tỉ lệ 9:16) và `background.webp` ($1440\text{px}$ ngang) để tránh vỡ hạt hoặc cắt lệch kiến trúc nền.
* **Khung viền hoa văn:** Dùng `bg-[length:100%_100%] bg-center` cho ảnh khung viền thẻ. Không vẽ cứng pill xưng hô hay nút bấm vào file ảnh tĩnh — phải render bằng HTML/CSS động để tự co giãn khi tên khách mời dài.

### 5.1 Quy chuẩn Chụp Ảnh Bìa Catalog (cover.webp) Chống Lệch & Sạch UI
Nhằm đảm bảo ảnh bìa catalog trên toàn hệ thống hiển thị sắc nét, cân đối hoàn hảo và không bị lỗi cắt mép hay dính công cụ lập trình, mọi template bắt buộc tuân thủ 4 nguyên tắc sau:

1. **Kích thước & Tỉ lệ chuẩn:**
   * **Tỉ lệ khung nhìn chuẩn:** Viewport thiết bị di động chuẩn $360 \times 590\text{px}$ (tỉ lệ chuẩn thiệp dọc mobile $\approx 1:1.639$).
   * **Độ phân giải xuất ảnh:** Đặt `deviceScaleFactor: 2` để sinh ảnh nét căng đúng kích thước **$720 \times 1180\text{px}$**.
   * **Định dạng & Dung lượng:** Lưu file định dạng `.webp`, nén lossy chất lượng cao (quality 80–82, giảm dần nếu cần) đảm bảo **dung lượng $< 60\text{ KB}$**, lưu trực tiếp tại `public/templates/<slug>/cover.webp`.
   * **CẤM:** Tuyệt đối không chụp từ viewport lớn (như desktop $1280\text{px}$ hoặc tablet/mobile lớn $430\text{px}$) rồi crop/clip sang $360\text{px}$, vì sẽ làm lệch tọa độ tâm và cắt cụt mép phải của thiệp.

2. **CSS Responsive Bắt Buộc cho Màn Bìa:**
   * **Container bao bọc màn bìa ngoài cùng:** Phải luôn có `w-full max-w-full overflow-hidden flex items-center justify-center px-4 py-4 sm:px-6`.
   * **Khung thẻ bìa chính (Card):** Bắt buộc dùng `w-full max-w-[328px] sm:max-w-[380px] mx-auto` kèm `overflow-hidden`.
     * *Công thức căn giữa 360px:* Màn hình rộng $360\text{px}$, trừ đi $32\text{px}$ lề 2 bên (`px-4`) $\rightarrow$ chiều rộng khả dụng là $328\text{px}$. Thiết lập `max-w-[328px]` giúp thẻ cách đều 2 lề đúng $16\text{px}$, căn giữa tuyệt đối $\text{abs}(\text{left} - (360 - \text{right})) \le 2\text{px}$.
     * **CẤM:** Không bao giờ gán cứng `w-[360px]`, `w-[390px]`, `max-w-[420px]` ở màn mobile nhỏ.
   * **Họa tiết trang trí (Ornaments/Decorations/Butterflies):** Nếu dùng `absolute` căn lề âm (như `-left-3`, `-right-3`) phải nằm trọn trong container cha có `overflow-hidden` để không bao giờ làm tràn chiều rộng trang (`document.documentElement.scrollWidth` luôn bằng đúng $360\text{px}$, cấm xuất hiện thanh cuộn ngang).

3. **Kỹ thuật Chụp Chống Dính Dev Tools (Icon "N" Next.js):**
   * **Nguyên nhân dính icon N đen ở góc dưới trái:** Chụp khi chạy `next dev` (Next.js Dev Server tự động tiêm component `nextjs-portal` chứa `[data-next-badge-root]`).
   * **Biện pháp xử lý triệt để:**
     * Chạy chụp trên **Production Build** (`next build` kết hợp `next start -p 3005`), môi trường production hoàn toàn không render dev indicator.
     * Đồng thời tiêm CSS cưỡng chế và dọn dẹp DOM trước khi chụp:
       ```css
       nextjs-portal, #__next-build-watcher, [data-next-badge-root], [data-nextjs-toast], [data-nextjs-dialog] {
         display: none !important;
         visibility: hidden !important;
         opacity: 0 !important;
         pointer-events: none !important;
       }
       ::-webkit-scrollbar { display: none !important; width: 0 !important; }
       html, body { scrollbar-width: none !important; overflow-x: hidden !important; }
       ```
     * Chờ `document.fonts.ready` + tất cả ảnh `<img>` tải xong (kèm timeout an toàn) + đệm thời gian $600\text{ms}$ để animation ổn định hoàn toàn trước khi bấm máy.

4. **Checklist Tự Động Nghiệm Thu Sau Khi Chụp:**
   * [ ] `document.documentElement.scrollWidth <= 360` (không có thanh cuộn ngang).
   * [ ] Căn giữa đối xứng hoàn hảo: `Math.abs(cardRect.left - (360 - cardRect.right)) <= 2px`.
   * [ ] Kích thước ảnh xuất: Đúng chính xác $720 \times 1180\text{px}$.
   * [ ] Dung lượng file WebP: Nghiêm ngặt $< 60\text{ KB}$.
   * [ ] Góc dưới trái sạch sẽ: 0% dính icon "N" Next.js Dev Badge.
   * [ ] Nội dung hiển thị: Tên cặp đôi, tiêu đề thiệp, nút "Mở thiệp" sắc nét 100%, không bị cắt cụt mép hoặc che mờ.

### 6. Quy tắc Xử lý Asset, Tách Nền & Nén WebP
* **Không dùng ảnh mockup phẳng làm nền thiệp:** Phải tách riêng nền giấy, khung, hoa văn, linh vật và nén **100% sang `.webp`** (giữ mục tiêu mỗi họa tiết $< 50\text{ KB}$, nền $< 120\text{ KB}$). Không để file `.png`/`.jpg` thô nặng trong `public/`.
* **Tách nền caro giả (Flattened Checkerboard) & Nền trắng:**
  * Nền caro do AI xuất thường là pixel RGB xám/trắng ($alpha = 255$). Xử lý bằng thuật toán lọc độ vô sắc kết hợp **flood-fill từ toàn bộ viền** và khử viền trắng (de-whiten RGB) để giữ nguyên các chi tiết hoa trắng bên trong.
* **Hoa văn 4 góc & Khung viền (Bo góc & Chống vệt viền thừa):**
  * **Tách nền alpha trong suốt 100%:** Tuyệt đối không để file góc dạng RGB có nền trắng (`alpha: false`). Phải loại bỏ hoàn toàn các dải viền nối bị cắt gãy mép (cut border tails) để góc chỉ còn họa tiết hoa văn thuần túy, ôm sát đỉnh bo góc.
  * **Căn tọa độ ôm sát 4 đỉnh khung:** Khi đặt hoa văn trong khung viền (như `EnvelopeCover`), lồng các thẻ ảnh góc trực tiếp bên trong container viền (`inset-4`) với tọa độ đỉnh `left-0 top-0`, `right-0 top-0`, `bottom-0 left-0`, `bottom-0 right-0` để hoa văn nằm chính xác tại 4 góc nhọn/bo của khung, không bị xô lệch hay trôi ra ngoài viền.
  * **Kích thước tinh gọn trên Mobile:** Kích thước hoa văn góc trên mobile chỉ từ `w-10` đến `w-12` ($\approx 40\text{px} - 48\text{px}$), desktop từ `w-14` đến `w-16`, tránh lấn vào vùng tên khách mời, con dấu hay nội dung thiệp. Cả 4 góc phải xuất hiện đồng bộ, đối xứng.
* **Linh vật (Rồng/Phụng) & Tránh Va Chạm Nội Dung:**
  * **Tách xa & Thu nhỏ footprint mobile:** Trên màn hình mobile/preview ($\approx 360\text{px} - 390\text{px}$), kích thước linh vật chỉ để `w-20` ($\approx 80\text{px}$), ghim sát đáy góc (`bottom-0 left-0` và `bottom-0 right-0`), chừa khoảng trống thoáng $\ge 200\text{px}$ ở giữa để Rồng và Phụng không bao giờ đè lên nhau.
  * **Tầng hiển thị (z-index) & Đệm an toàn:** Đặt linh vật ở lớp nền (`z-0`, `pointer-events-none`, `aria-hidden="true"`), nội dung chữ (ngày cưới, ngày âm, pill địa điểm/bản đồ) ở lớp trước (`relative z-10`), tăng padding đáy `pb-16 sm:pb-20 md:pb-24` và thêm backdrop bán trong suốt cho pill địa điểm để linh vật không bao giờ che khuất chữ hay chặn tương tác nút bấm.
* **Ảnh đại diện Catalog (`public/templates/<id>/cover.webp`):**
  * Bắt buộc là ảnh dọc tỉ lệ chuẩn **$720 \times 1180\text{px}$** ($\approx 0.610$, nén $< 60\text{ KB}$), thể hiện đầy đủ họa tiết bìa và tên cặp đôi minh họa (không dùng SVG vì crawler mạng xã hội không render `og:image` dạng SVG).

### 6.1 Quy chuẩn Căn tâm Asset Hộp Quà 3 Trạng Thái (Chống lệch Preview)
Nhằm triệt tiêu hiện tượng icon hộp quà / túi gấm / vali / hộp thiếc bị xô lệch tâm ngang trong khung xem trước Preview (hoặc bị nhảy giật vị trí khi hover/click đổi trạng thái):
1. **Xử lý Asset WebP 3 trạng thái (Normal, Hover/Glow, Active/Open):**
   * **CẤM:** Tuyệt đối không cắt cứng lưới 16:9 theo `width / 3` rồi lưu thẳng nếu vật thể trong ô chia nằm lệch tâm.
   * **Auto-crop & Căn tâm theo Bounding Box thực:**
     * Quét bounding box của các pixel thực thể ($\text{alpha} > 20$): xác định $\text{boxCenterX} = (\text{minX} + \text{maxX}) / 2$.
     * Căn chỉnh tâm ngang thân hộp khớp chính xác vào $50\%$ chiều rộng canvas: $\text{canvasCenterX} = \text{width} / 2$ ($\text{offset} \le 0.5\text{px}$).
     * **Đồng bộ cao độ đáy (Bottom Alignment):** Đáy hộp ($\text{maxY}$) trên cả 3 file `.webp` phải nằm ở cùng 1 cao độ baseline để hộp luôn đứng vững chãi, chính giữa tuyệt đối và không bao giờ bị nhảy/giật vị trí khi chuyển đổi trạng thái tương tác.
2. **Quy chuẩn CSS trong JSX:**
   * Container bao bọc toàn bộ khối hộp quà: Bắt buộc dùng `w-full flex flex-col items-center justify-center`.
   * Nút/thẻ bấm bọc ảnh: Bắt buộc dùng `mx-auto flex items-center justify-center`.
   * Thẻ `<img>`: Bắt buộc dùng `mx-auto block object-contain` kèm kích thước rõ ràng (`w-full h-full` trong khung cha), tuyệt đối không dựa vào căn lề thủ công (`pl-*`, `pr-*`) hay `inline-block`.

### 6.2 Quy chuẩn Âm thanh Tương tác (SFX) & Delay Mở Modal Quà Mừng (700ms)
Nhằm mang đến trải nghiệm mở thiệp cưới và trao quà mừng chân thực, tinh tế và cao cấp, mọi mẫu thiệp bắt buộc tích hợp hệ thống SFX (`lib/sfx.ts`) kết hợp hook tương tác hộp quà chuẩn (`hooks/useGiftBoxInteraction.ts`):

1. **Danh sách tệp SFX có sẵn trong `public/sfx/` & Bảng mapping chuẩn:**
   * **Nhóm SFX Mở Thiệp (`CoverSfxType`):**
     * `open-envelope.mp3` (`envelope`): Phong bì / Mật thư giấy cotton (*Mật Thư Hổ Phách, Mộc Hương Nắng Thu, Minimal Red, Đỏ Rượu Vang...*) — Tiếng tách nhẹ con dấu sáp và giấy trượt êm.
     * `open-silk.mp3` (`silk`): Rèm lụa / Thanh tao / Hoa cỏ (*Tơ Hồng Lụa Thắm, Bạch Lan Lụa Ngà, Anh Đào Phấn Tuyết, Thanh Mai Ngọc Lan, Ráng Hồng Hoàng Hôn, Vườn Kính Xanh...*) — Tiếng lụa rẽ nhẹ hòa nốt harp/chime dịu.
     * `open-royal.mp3` (`royal`): Hoàng gia / Sơn mài / Long Phụng (*Chu Sa Long Phụng, Bích Ngọc Hoàng Triều, Phượng Loan Gấm Đỏ, Song Hạc Kim Vân, Hạc Vũ Lưu Ly, Song Phụng Bích Đào, Huyền Kim Long Phụng, Long Phụng...*) — Tiếng khánh ngọc / đàn tranh rải nốt thanh thoát.
     * `open-crystal.mp3` (`crystal`): Dạ yến / Tối giản cao cấp (*Dạ Yến Pha Lê, Hắc Kim Nhật Thực, Mặc Lam Kim Tuyến, Tử Đằng Dạ Khúc, Yên Chi Mẫu Đơn, Diễm Phấn Kim Tơ, Phỉ Thúy Đông Dương...*) — Tiếng chuông pha lê / thủy tinh chạm trong trẻo.
     * `open-vhs-shutter.mp3` (`vhs-shutter`): Hồng Kông 80s–90s VHS / Noir (*Hương Cảng Đêm Neon, Bản Sắc Hương Cảng*) — Tiếng băng từ chạy ngắn + tiếng trập máy ảnh cơ 35mm.
     * `open-mahjong.mp3` (`mahjong`): Hồng Kông Mạt Chược (*Cửu Long Hỷ Yến*) — Tiếng va giòn gọn của quân mạt chược.
     * `open-ticket-tear.mp3` (`ticket-tear`): Vé rạp phim (*Dạ Ảnh Hương Cảng*) — Tiếng xé cuống vé giấy gọn sắc.
   * **Nhóm SFX Mở Quà Mừng (`GiftSfxType`):**
     * `gift-envelope.mp3` (`envelope`): Bao lì xì cưới truyền thống (*Minimal Red, Đỏ Truyền Thống, Long Phụng...*) — Tiếng giấy cứng trượt mở + lách cách nhẹ lá kim/đồng xu.
     * `gift-box.mp3` (`box`): Hộp quà nhung / Hộp sơn mài / Hộp Art Deco (hầu hết các mẫu hộp quà) — Tiếng bật nắp hộp nhẹ + chuông sparkle lấp lánh.
     * `gift-briefcase.mp3` (`briefcase`): Vali đen khóa vàng (*Cửu Long Hỷ Yến*) — Tiếng "tách — tách" giòn của 2 chốt khóa kim loại bật mở.
     * `gift-pouch.mp3` (`pouch`): Túi gấm / Túi rút dây (*Tơ Hồng Lụa Thắm*) — Tiếng dây lụa kéo mở + chuông gió nhẹ.
     * `gift-tin-vhs.mp3` (`tin-vhs`): Hộp thiếc / Hộp băng VHS (*Dạ Ảnh Hương Cảng, Hương Cảng Đêm Neon*) — Tiếng nắp kim loại bật mở / eject băng cassette.

2. **Quy tắc Bắt Buộc cho Mọi Mẫu Thiệp Hiện Tại & Tương Lai:**
   * **Mở thiệp:** Luôn gọi `playCoverSfx(style)` đúng phong cách khi khách bấm nút mở thiệp (không tự phát khi tải trang).
   * **Tương tác Quà Mừng:** Bắt buộc sử dụng hook `useGiftBoxInteraction({ sfxType: "..." })` quản lý 3 trạng thái (`normal`, `glow`, `open`).
   * **Quy chuẩn Delay 700ms mở Modal QR:**
     * Khi khách bấm vào hộp quà, phát SFX ngay tại $0\text{ms}$ và chuyển ngay sang trạng thái `open`.
     * **Trì hoãn đúng $700\text{ms}$** ($150\text{ms}$ nếu bật `prefers-reduced-motion: reduce`) trước khi `GiftModal` hiển thị, giúp khách nhìn trọn vẹn khoảnh khắc nắp hộp bật mở / túi gấm rút dây tỏa sáng.
     * Khóa thao tác (`disabled={isGiftOpening}` hoặc `pointer-events-none`) trong đúng khoảng thời gian $700\text{ms}$ để chống double-click chồng chéo.
   * **Preload ảnh trạng thái Open:** Luôn đặt thẻ `<img src="..." className="hidden" aria-hidden="true" alt="" />` cho ảnh trạng thái mở để khi khách bấm không bao giờ bị chớp trắng hoặc trễ tải ảnh.
   * **Tôn trọng trạng thái Mute:** Nếu khách tắt âm thanh trên thiệp (`muted === true`), SFX không được tự ý phát tiếng.
   * **Đóng Modal Reset Hộp Quà:** Khi khách đóng `GiftModal` (`onClose={handleCloseModal}`), hộp quà tự động quay về trạng thái `normal` ban đầu để có thể bấm xem lại.

### 7. Typography, Văn phong Tiếng Việt & Bố cục Nội dung
* **Font hỗ trợ tiếng Việt 100% (Latin + Vietnamese Subsets):**
  * Toàn bộ Google Fonts sử dụng trong template bắt buộc phải khai báo đầy đủ `subsets: ["latin", "vietnamese"]` trong `app/layout.tsx` và gọi qua biến CSS (`var(--font-...)`).
  * **Hand-script / Viết tay:** Dùng `Dancing Script` (`var(--font-dancing-script)` weights: 500, 600, 700). Tuyệt đối không dùng các font script thiếu glyph tiếng Việt khiến ký tự có dấu (Mạnh, Bà, đ, ệ, ủ, ỹ, ả, ợ) bị vỡ hoặc nhảy sang font sans-serif hệ thống.
  * **Serif / Display:** Dùng `Cormorant Garamond` (`var(--font-cormorant)`), `Playfair Display` (`var(--font-playfair)`), `EB Garamond` (`var(--font-eb-garamond)`).
  * **Body / Thân bài:** Dùng `Lora` (`var(--font-lora)`) hoặc `Be Vietnam Pro` (`var(--font-be-vietnam)`).
  * **CẤM:** Định nghĩa tên font trần dạng chuỗi mà không kèm biến CSS (ví dụ: cấm viết `"Dancing Script", cursive` đơn độc vì browser không tải được font Google tối ưu từ Next.js).
* **Tên Cô Dâu & Chú Rể trên Cover/Hero:**
  * Luôn chia **3 dòng** (`display: block`): Tên chú rể / `&` (cùng font serif với tên) / Tên cô dâu. Dùng `break-words`, cấm `overflow-wrap: anywhere`.
* **Thông tin Hai Bên Gia Đình:**
  * Hai card gia đình dùng grid `items-stretch` và `h-full flex flex-col` để cao bằng nhau.
  * Tên phụ huynh có dấu `&` (ví dụ: `"Ông Lê Văn Lậu & Bà Nguyễn Giang Mai"`) phải tách thành 2 dòng sạch sẽ và lược bỏ ký tự `&`.
  * Danh xưng (`groomTitle`, `brideTitle`) lấy từ dữ liệu động, không hardcode "Trưởng nam / Ái nữ".
* **Tần suất hiển thị Ngày Cưới:** Chỉ hiển thị ngày cưới tại **2 vị trí**: khối **Sự kiện** (chi tiết từng lễ) và khối **Thông tin tiệc cưới / Lịch tháng**. Tránh lặp lại ở Hero hoặc Footer.
* **Văn phong & Độ tương phản:**
  * Dùng từ ngữ trang trọng, tự nhiên (`"Album Ảnh Cưới"`, `"Lịch Ngày Vui"`, `"Thư Mời Tiệc Cưới"`, `"Hộp Mừng Cưới"`), tránh từ ngữ sến hoặc dịch máy móc; kiểm tra format ngày âm lịch để không bị lặp chữ `"ngày"`.
  * Đảm bảo độ tương phản cao: nền tối dùng chữ kem/vàng champagne; nền sáng dùng chữ đậm.

### 8. Các Module Chức năng Bắt Buộc & Portal
1. **Modal & Popup (`createPortal`):**
   * Mọi modal (Hộp quà VietQR, Lightbox phóng to ảnh, Overlay lời chúc nổi) **bắt buộc** render qua `createPortal(..., document.body)` khi ở chế độ trang thật (`!contained`) để tránh bị thuộc tính `transform` của ancestor phá vỡ `position: fixed`.
   * Vì portal thoát khỏi cây CSS của thiệp, phải truyền trực tiếp màu nền/chữ bằng inline style hoặc class màu cứng (không dùng biến CSS cục bộ `--inv-*` bên trong portal).
2. **Mừng Cưới (`GiftModal`):**
   * Bấm trực tiếp vào minh họa hộp quà/bao lì xì để mở popup chứa số tài khoản, nút copy và mã QR; truyền đúng `tone` theo bảng màu thiệp.
3. **Xác Nhận Tham Dự & Sổ Lưu Bút (`RsvpWishBlock` / `TemplateRsvpSection`):**
   * Không bọc thêm khung viền trắng dày lạc tông bên ngoài component form.
   * Chống spam lời chúc bằng định danh `author_key` (`guest:<id>` hoặc `anon:<uuid>`), hỗ trợ cập nhật lại lời chúc cũ và chỉ hiển thị các lời chúc đã duyệt (`approved = true`).
   * Sổ lưu bút đặt bên ngoài form gửi (để không biến mất sau khi khách bấm gửi RSVP), chạy cuộn dọc vô tận bằng cách nhân đôi 2 nhóm thẻ giống hệt nhau (`translateY(0)` $\rightarrow$ `translateY(-50%)`).
4. **Hiệu năng Animation & Accessibility:**
   * Dùng `LazyMotion(domAnimation)` + `m.div` thay vì import toàn bộ `framer-motion`.
   * Không gắn `whileInView` lên phần tử con đang bị cắt ẩn (`translateY(100%)`) bên trong `overflow-hidden` — luôn đặt `whileInView` ở khung cha luôn nhìn thấy.
   * Mọi hiệu ứng CSS/JS tự viết đều phải hỗ trợ `@media (prefers-reduced-motion: reduce)` / `useReducedMotion()`.

### 8.1. Quy chuẩn Hiển thị Khung Preview Điện Thoại (contained & Mobile Breakpoint)
1. **Kiến trúc IframePortal cho Khung Điện Thoại (375px):**
   * Khung Preview điện thoại ở trang Quản lý/Chỉnh sửa thiệp (`WeddingDetailView`), trang Landing Hero (`HeroSection`) và Catalog Preview Modal luôn phải chạy trong viewport mobile thật (375px logic qua component `MobilePreviewFrame` / `IframePortal`).
   * Sử dụng React `createPortal` render trực tiếp vào `iframe.contentDocument.body` cùng origin. Toàn bộ stylesheet (`<link rel="stylesheet">`, `<style>`, Google Fonts, brand theme) được đồng bộ từ `document.head` qua `MutationObserver`.
   * Nhờ đó, toàn bộ media queries (`sm: 640px`, `md: 768px`, `lg: 1024px`) tự động đánh giá chính xác theo 375px mobile, triệt tiêu hoàn toàn lỗi nhận nhầm breakpoint desktop gây ép dẹt cột gia đình hay tràn ngày cưới.
   * Đồng thời giữ nguyên 100% tương tác thời gian thực của Editor ("Chạm vào tên hoặc ảnh trên thiệp để chỉnh nhanh", live state update, undo/redo, nút Đóng/Mở bì thư).
2. **Quy tắc Bìa & Ảnh nền khi `contained === true`:**
   * **Ưu tiên ảnh nền dọc:** Khi `contained === true` (đang nằm trong khung điện thoại), luôn render ảnh nền dọc (`bg_mobile.webp` hoặc `background-mobile.webp`), tuyệt đối không kích hoạt thẻ `<source media="(min-width: ...)" srcSet="...bg_desktop.webp" />`.
   * **Căn giữa dọc & ngang bìa thiệp:** Khối bìa ngoài khi `contained === true` bắt buộc dùng `h-full w-full flex flex-col items-center justify-center overflow-hidden px-4 py-6` (không dùng `my-auto` gây lệch trọng tâm), đảm bảo thẻ bìa luôn nằm cân đối tuyệt đối chính giữa khung điện thoại.
3. **Chống Bóp Chữ trên Viewport 360–390px:**
   * **Khối Gia Đình & Cặp đôi:** Khối 2 bên Nhà Trai & Nhà Gái trên mobile 375px phải xếp 1 cột (`grid-cols-1 md:grid-cols-2`), có padding và cỡ chữ thoáng, không bị bóp thành 1 từ mỗi dòng hay chồng viền ảnh tròn.
   * **Khối Ngày Giờ:** Thanh ngày tháng (Thứ / Ngày / Tháng / Năm) phải co giãn linh hoạt (`flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-xs sm:text-base`), gọn trong chiều rộng thẻ, không tràn lề.
4. **Quy định Nghiệm Thu Mẫu Mới:**
   * Mọi template mới bắt buộc phải test trực quan cả trong khung Preview điện thoại của trang Editor lẫn trang mở toàn màn hình trước khi bàn giao.
5. **Quy chuẩn Ẩn Thanh Cuộn (Scrollbar) Xuyên Trình Duyệt:**
   * Trên Windows/Chrome, các container cuộn (`overflow-y: auto`) mặc định hiển thị thanh cuộn xám rộng ~15px ở mép phải, bóp méo tỷ lệ và thẩm mỹ của khung điện thoại Preview.
   * **Bắt buộc tiêm CSS ẩn scrollbar vào `<head>` của iframe / IframePortal / embed routes:**
     ```css
     html,
     body,
     * {
       scrollbar-width: none !important;
       -ms-overflow-style: none !important;
     }
     html::-webkit-scrollbar,
     body::-webkit-scrollbar,
     *::-webkit-scrollbar {
       display: none !important;
       width: 0 !important;
       height: 0 !important;
     }
     ```
   * **Áp dụng utility classes trên container cuộn preview:** Gắn `[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden` (hoặc class `.no-scrollbar` / `.lnd-phone-scroll`) lên mọi thẻ bọc `overflow-y-auto` ở trang Xem thử mẫu (`/mau/...`), Modal Preview Catalog/Landing và Khung Preview Editor (`/tao-thiep`).
   * **Bảo toàn khả năng cuộn:** Giữ nguyên `overflow-y: auto` (khi thiệp đã mở) và `overflow-x: hidden` để người dùng vẫn lăn chuột, kéo trackpad và vuốt cảm ứng mượt mà 100%.

---

## PHẦN III: QUY TRÌNH DEPLOY, VẬN HÀNH & QA CHECKLIST

### 9. Quy tắc Môi trường & Bảo toàn Tài liệu
* **Build & Deploy (Windows / Cloudflare OpenNext):**
  * Nếu chạy `npm install` trong môi trường hạn chế quyền khiến `esbuild.exe` / `next-swc` bị hạ mức integrity, chạy `icacls node_modules /setintegritylevel Medium /T` trước khi deploy.
  * Không dùng `Get-Content | Set-Content` của PowerShell 5.1 để sửa file chứa tiếng Việt (gây lỗi encoding mojibake); luôn đọc/ghi bằng UTF-8 không BOM (`UTF8Encoding($false)`).
* **Bảo toàn `card_exp.md`:** Khi cập nhật tài liệu này, luôn kiểm tra lại số lượng mục, encoding tiếng Việt và phần cuối file sau khi ghi để tránh mất dữ liệu do lỗi I/O.

### 10. Checklist Nghiệm Thu Bắt Buộc (QA Checklist)
```text
[ ] Khả năng hiển thị (390px / 768px / 1440px): Không tràn ngang (innerWidth === scrollWidth), không kéo giãn quá 840px trên desktop.
[ ] Khung Preview Điện Thoại (375px IframePortal): Chạy đúng breakpoint mobile 375px, mọi sm:/md: không bị kích hoạt nhầm trên màn hình Desktop; ảnh bìa dùng bg_mobile.webp và căn giữa dọc-ngang hoàn hảo; tên phụ huynh/ngày cưới thoáng đẹp, không ép dẹt 2 cột; thanh cuộn xám mép phải ẩn 100% trên Windows/Chrome nhưng vẫn cuộn/vuốt mượt mà.
[ ] Bìa & Preview: Bìa nằm chính giữa khung điện thoại ở cả /mau/[id], /tao-thiep, /dashboard; đóng/mở bìa hoạt động đủ 2 chiều và cuộn mượt sau khi mở.
[ ] Capabilities: Dashboard chỉ hiện nút bật/tắt section và ô upload ảnh mà template thực sự sử dụng; gói Free không lộ tính năng Pro/VIP.
[ ] Asset & Tốc độ: 100% asset là .webp nhẹ, tách nền sạch không dính caro/viền trắng; hoa văn góc đối xứng, không che chữ/nút; cover.webp đúng chuẩn 720x1180px (< 60KB), căn giữa 100% tại viewport 360px và 0% dính Dev Tool icon N.
[ ] Nội dung & Font: Tiếng Việt hiển thị đủ dấu sắc nét; tên cặp đôi 3 dòng; tên phụ huynh tách dòng sạch tại '&'; không lặp ngày cưới thừa.
[ ] Chức năng tương tác: RSVP gửi và cập nhật được; Sổ lưu bút cuộn dọc mượt; Hộp quà mở popup qua Portal đúng vị trí; Album & Lightbox hoạt động tốt; Nhạc nền phát/tạm dừng ổn định.
[ ] SFX & Trải nghiệm Quà Mừng: Mở thiệp phát đúng SFX phong cách; Bấm hộp quà thấy rõ trạng thái open trọn vẹn 700ms + phát đúng SFX vật thể rồi GiftModal mới hiện; đóng modal hộp trở về bình thường.
[ ] Build & Quality: Tôn trọng prefers-reduced-motion; 0 lỗi console; npx tsc --noEmit và lệnh build pass 100%.
```

---

## PHẦN IV: BÀI HỌC KỸ THUẬT & QUY CHUẨN ĐỒNG BỘ 10 BUG QA THỰC TẾ (QA ĐỢT 1)

> **Bắt buộc áp dụng đồng bộ:** Toàn bộ 10 quy chuẩn dưới đây được đúc kết từ đợt kiểm thử QA thực tế trên hệ thống đa thiết bị và iframe preview. Mọi template mới hoặc refactor đều phải tuân thủ nghiêm ngặt để không tái diễn lỗi.

### 11.1. Điều Hướng Cuộn Nội Bộ Nút RSVP & Spacing Nút (Bug 1)
* **CẤM:** Tuyệt đối không dùng thẻ `<a href="#rsvp">`, `<a href="#rsvp-section">`, hay `<a href="#rsvp-wishes">` cho nút "Xác nhận tham dự". Khi chạy bên trong `IframePortal` của Editor/Dashboard, hành vi mặc định của thẻ `<a>` khiến trình duyệt hiểu là điều hướng trang, làm reload hoặc đẩy URL iframe về trang Dashboard/Editor!
* **GIẢI PHÁP BẮT BUỘC:** Mọi nút "Xác nhận tham dự" phải là `<button type="button">` thực hiện cuộn nội bộ an toàn:
  ```tsx
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      const doc = e.currentTarget.ownerDocument || document;
      const targetEl = doc.getElementById("rsvp") || doc.getElementById("rsvp-wishes") || doc.getElementById("rsvp-section");
      targetEl?.scrollIntoView({ behavior: "smooth" });
    }}
    className="..."
  >
    Xác nhận tham dự
  </button>
  ```
* **Spacing Hàng Nút:** Nút "Thêm vào lịch" và "Xác nhận tham dự" luôn đặt trong container `flex flex-wrap items-center justify-center gap-3` để luôn tách thoáng trên màn hình hẹp 360px–375px, không bao giờ dính sát nhau.

### 11.2. Phân Quyền Pro vs VIP ở QR "Album Ảnh Cưới" (Bug 2)
* **Gói Pro (Read-Only):**
  * Khách quét QR / truy cập trang album (`/a/[slug]`) chỉ được xem Album ảnh cưới của cô dâu chú rể (gallery + lightbox phóng to xem ảnh) và nút quay lại thiệp.
  * **Ẩn hoàn toàn 100%:** Form upload ảnh của khách, hướng dẫn chiếu màn hình LED, và khu vực "Live Photo Wall".
* **Gói VIP (Upload + Live Photo Wall):**
  * Hiển thị đầy đủ form tải ảnh lên dành cho khách mời và liên kết tới màn hình chiếu LED Live Photo Wall.
* **Khóa Chặt Server-Side (API Security):**
  * Tại `app/api/public/wedding/[slug]/photos/route.ts`: Bắt buộc kiểm tra gói của thiệp từ DB. Nếu `wedding.plan !== "vip"`, trả về ngay mã lỗi `403 Forbidden` kèm thông báo `Chức năng tải ảnh khách chỉ dành cho gói VIP`. Tuyệt đối không chỉ ẩn nút ở frontend mà để hở API backend.

### 11.3. Chuẩn Độ Tương Phản & Viền Form RSVP trên Mọi Nền (Bug 3)
* **Ô nhập liệu (`<input>`, `<select>`, `<textarea>`):**
  * Bắt buộc có viền tường minh với độ dày tối thiểu $1\text{px} - 1.5\text{px}$ (`border border-[#C9BFA9]` hoặc `border border-[#D5C8BA]`).
  * Nền của ô nhập phải hơi khác sắc độ với nền thẻ trắng (ví dụ card màu trắng `#FFFFFF` thì nền input dùng `#FAF8F5`, `#FAF7F2`, `#FFFBF5` hoặc `#FFFDFB`) để không bị "hòa tan" vào nền thẻ trên các màn hình độ sáng cao.
* **Hai nút chọn tham dự ("Tôi sẽ tham dự" / "Tiếc quá, mình bận mất rồi"):**
  * Trạng thái chưa chọn: Có viền rõ ràng (`border border-[#XXXXXX]`), nền sáng nhẹ, chữ đọc rõ.
  * Trạng thái đang chọn: Tô nền màu nhấn chủ đạo của mẫu, chữ tương phản cao đạt chuẩn WCAG AA ($4.5:1$).

### 11.4. Đa Lễ Động & Lặp Mảng `events` (Bug 4)
* **CẤM:** Không bao giờ hardcode tiêu đề cứng "LỄ THÀNH HÔN" hoặc chỉ lấy phần tử đầu tiên `data.events?.[0]` trong khối Sự kiện & Chỉ đường.
* **GIẢI PHÁP BẮT BUỘC:** Lặp qua toàn bộ mảng `data.events` (đã được lọc theo phân bổ lễ của khách mời):
  * Render động tên lễ thật từ dữ liệu: `{evt.title || "Lễ Cưới"}` (ví dụ: Lễ Vu Quy, Lễ Thành Hôn, Lễ Báo Hỷ, Tiệc Rượu, Tiệc Cưới Nhà Gái...).
  * Hiển thị đầy đủ: giờ bắt đầu, thứ, ngày dương lịch, ngày âm lịch (`evt.lunarDate`), tên địa điểm (`evt.venueName`), địa chỉ (`evt.venueAddress`), và nút chỉ đường Google Maps (`evt.mapDirectionsUrl`).

### 11.5. Tách Độc Lập Giữa Album và QR Album Khách (`album` vs `albumQr`) (Bug 5)
* Hai tính năng `album` và `albumQr` là hai section độc lập hoàn toàn trong hệ thống toggle:
  * Khi người dùng bật `albumQr` (gói Pro/VIP) nhưng tắt `album`, khối QR Album khách vẫn phải hiển thị độc lập và đầy đủ chức năng.
  * **CẤM:** Lồng component `<GuestAlbumQr />` bên trong điều kiện `gallery.length > 0` hoặc bên trong container của section `album`. Phải tách thành một block riêng với `orderOf("albumQr", 6)` và bọc điều kiện `!hiddenSections.has("albumQr") && data.plan !== "free" && Boolean(weddingSlug)`.

### 11.6. Dữ Liệu Thật cho Lịch Trình Ngày Cưới (Zero Dummy Timeline) (Bug 6)
* **CẤM:** Tuyệt đối không hardcode mảng timeline dummy/mặc định trong code template (ví dụ: `[{ time: "17:30", title: "Đón Tiếp Khách Quý" }]`).
* **GIẢI PHÁP BẮT BUỘC:** Bind trực tiếp 100% từ `data.timeline` (theo chuẩn type `WeddingTimelineItem = { id?: string; time: string; label: string }`, dùng `item.label`). Nếu người dùng xóa hết các mốc lịch trình (`data.timeline` rỗng hoặc không có), ẩn hoàn toàn khối lịch trình, không bao giờ tự ý bịa dữ liệu giả để hiển thị.

### 11.7. Bộ 9 Key Chuẩn Section & Toggle Ẩn/Hiện Toàn Diện (Bug 7 & Bug 8)
* **9 Key chuẩn duy nhất:**
  1. `family` $\rightarrow$ Thông tin gia đình hai bên (& ảnh chân dung cặp đôi nếu có).
  2. `calendar` $\rightarrow$ Lịch cưới & đếm ngược ngày chung đôi.
  3. `map` $\rightarrow$ Sự kiện và chỉ đường (danh sách toàn bộ các lễ).
  4. `dresscode` $\rightarrow$ Trang phục gợi ý & lịch trình ngày cưới (`data.timeline`).
  5. `album` $\rightarrow$ Album ảnh cưới của cô dâu chú rể.
  6. `albumQr` $\rightarrow$ QR chia sẻ album ảnh khách chụp (Pro/VIP).
  7. `gift` $\rightarrow$ Hộp quà chúc phúc mừng cưới.
  8. `rsvp` $\rightarrow$ Xác nhận tham dự & sổ lưu bút.
  9. `music` $\rightarrow$ Nhạc nền thiệp cưới.
* **Toggle Nhạc Nền (`music`):** Nút phát nhạc `LiveMusicFloatingButton` bắt buộc phải kiểm tra điều kiện `!data.hiddenSections?.includes("music")`. Khi người dùng tắt toggle Nhạc nền, nút nhạc phải ẩn ngay lập tức và ngừng phát âm thanh.

### 11.8. Tùy Chọn "Nhà Xuất Hiện Trước" (`hostFirst`) & Ẩn/Hiện Ảnh Chân Dung (Bug 9)
* **Nhà xuất hiện trước:** Đọc cấu hình `isBrideFirst = data.hostFirst === "bride"`. Khi `isBrideFirst` là `true`:
  * Cột thông tin Nhà Gái và tên Cô Dâu phải hiển thị trước / bên trái cột Nhà Trai.
  * Áp dụng đồng bộ cho cả 2 thẻ ảnh chân dung riêng của Cô Dâu & Chú Rể (ảnh Cô Dâu nằm trước ảnh Chú Rể).
* **Ẩn/Hiện ảnh chân dung:** Đọc cờ `!data.hideCouplePhotos`. Khi cờ này là `true` (người dùng tắt hiện ảnh), ẩn toàn bộ khung ảnh chân dung riêng trong phần gia đình, chỉ hiển thị họ tên trang nhã.

### 11.9. Flex Container, Order CSS & Đóng Gói Couple Photos trong Family (Bug 10)
* **Flexbox Container:** Toàn bộ các section có thể kéo thả sắp xếp (8 keys từ `family` đến `rsvp`) phải nằm trong một container `flex flex-col`.
* **Thuộc tính Order:** Mọi section trong danh sách sắp xếp bắt buộc phải gán `style={{ order: orderOf(key) }}`.
* **Đóng gói Couple Photos:** Khối ảnh chân dung riêng của cặp đôi (nếu mẫu có hỗ trợ `couplePhotos`) bắt buộc phải đặt **bên trong** wrapper của khối `family`, nằm ngay dưới phần thông tin song thân hai bên. Tuyệt đối không để khối ảnh cặp đôi nằm tách rời làm section con độc lập của flex container vì khi đó CSS `order: 0` mặc định sẽ làm khối này nhảy lộn xộn lên đầu trang.
* **Vị trí của Footer:** Thẻ `<footer>` luôn đặt **bên ngoài** flex container có thuộc tính `order` để bảo đảm luôn luôn nằm ở đáy trang.

---

## 12. BÀI HỌC KINH NGHIỆM SỬA TRỌN BỘ 7 BUG QA ĐỢT 2 (KHUNG ẢNH HERO, TOGGLE ẨN/HIỆN, CHU SA LONG PHỤNG, DRESS CODE KHÔNG TEXT)

### 12.1. Quy Chuẩn Khung Vòm Hero & Tính Trong Suốt Của Asset (Bug 1, Bug 2, Bug 3)
* **Kênh Alpha Khung Vòm / Khung Phim:**
  * Toàn bộ các file `*arch*.webp` và `*frame*.webp` trong `public/templates/<id>/` BẮT BUỘC phải có vùng lõi trung tâm hoàn toàn trong suốt (`Alpha === 0`).
  * Tuyệt đối không để sót mảng màu trắng đục `#FFFFFF` ở lòng vòm (điển hình từng xảy ra ở `mai_lan_arch_frame.webp`). Quy trình xuất asset hoặc tách nền bằng `sharp` phải flood-fill làm rỗng cả 4 góc bên ngoài lẫn lòng vòm bên trong.
* **Tỷ Lệ Khung (Aspect Ratio) & Inset Khớp Lòng Trong Thực Tế:**
  * Container bọc vòm phải khai báo đúng tỷ lệ gốc của file ảnh khung (ví dụ `aspect-[440/575]` cho `sunset-arch.webp`, `aspect-[680/917]` cho `dragon_phoenix_arch.webp`), không dùng `aspect-[3/4]` tùy tiện gây co méo hoặc lệch tỷ lệ.
  * Inset của thẻ bọc ảnh cặp đôi phải căn chuẩn theo vùng rỗng thực tế được đo đạc qua ray-tracing:
    * `rang-hong-hoang-hon`: Lòng vòm rộng $58.9\%$ $\rightarrow$ dùng `left-[18%] right-[18%] top-[2.5%] bottom-[16%] rounded-t-full overflow-hidden`.
    * `phuong-loan-gam-do`: Lỗ vòm sâu xuống tận $2\%$ chân đáy $\rightarrow$ dùng `inset-x-[10%] top-[11.5%] bottom-[2%] rounded-t-full overflow-hidden` để ảnh lấp đầy trọn vẹn, không để lộ viền đỏ trống hở đáy làm ảnh lọt thỏm.
* **Cấu Trúc Lớp (Z-Index Layering):**
  * Lớp ảnh cặp đôi đặt ở `z-0` hoặc `z-[1]`.
  * Lớp khung họa tiết/vòm hoa `.webp` luôn đặt ở `z-10` hoặc `z-20` kèm thuộc tính `pointer-events-none absolute inset-0 w-full h-full object-contain` để ôm khít mép viền ảnh phía trước mà không cản trở thao tác người dùng.

### 12.2. Kiểm Soát Toggle Ẩn/Hiện Chặt Chẽ & Đúng Key Chuẩn (Bug 4)
* **Khối Đếm Ngược (Countdown):** Bắt buộc phải bọc trong điều kiện `{!hiddenSections.has("calendar") && mounted && (...)}`. Không bao giờ để khối đếm ngược nằm trần ngoài flex container chỉ với `{mounted && (...)}`, khiến người dùng tắt mục "Lịch cưới & đếm ngược" mà khối vẫn hiển thị.
* **Khối Lịch Trình (Timeline):** Bắt buộc bọc với điều kiện của key `"dresscode"` (`!hiddenSections.has("dresscode") && data.timeline && data.timeline.length > 0 && (...)`) và gán `orderOf("dresscode")`. Tuyệt đối không tự ý dùng key lạ như `"timeline"` vì Dashboard Editor chỉ truyền 9 key chuẩn (`family`, `calendar`, `map`, `dresscode`, `album`, `albumQr`, `gift`, `rsvp`, `music`).

### 12.3. Cấm Tự Móc Dòng Lịch Trình Vào Khối Ngày Giờ (Bug 5)
* Khối Ngày giờ & Đếm ngược chỉ hiển thị: ngày, thứ, tháng, năm dương lịch, ngày âm lịch và widget đếm ngược.
* Tuyệt đối không tự móc `timeline[0]` và `timeline[1]` làm thành 2 cột "Đón khách" & "Khai tiệc" trong khối ngày giờ (từng xảy ra ở `do-ruou-vang`). Lịch trình chi tiết chỉ hiển thị duy nhất tại block Lịch trình (`dresscode`) để tránh gây hiểu nhầm giờ tiệc chính và tránh trùng lặp nội dung.

### 12.4. Khắc Phục Kẹt Cuộn Preview & Thẩm Mỹ Hoàng Gia trên Chu Sa Long Phụng (Bug 6)
* **Chống Kẹt Cuộn Container Trong Iframe Preview:**
  * Thuộc tính khóa cuộn `overflow-hidden` chỉ được áp dụng khi màn hình bìa chưa mở (`!coverGone`).
  * Cú pháp chuẩn xác:
    ```tsx
    !coverGone
      ? contained
        ? "h-full overflow-hidden"
        : "h-screen-dvh max-h-full overflow-hidden"
      : "min-h-screen"
    ```
  * CẤM viết `contained ? "h-full overflow-hidden" : ...` vì sẽ khiến khung Preview Dashboard bị khóa cứng không cuộn được ngay cả khi khách đã mở bìa.
* **Xóa Bỏ Tiền Tố Lặp "Bố mẹ: Bố mẹ:":**
  * Dữ liệu danh sách bố mẹ đã có tiêu đề cột "Nhà Trai / Nhà Gái" và "Thân sinh:".
  * Render danh sách chỉ dùng `<p key={i}>{name}</p>`, tuyệt đối không chèn thêm chuỗi cứng `Bố mẹ: {name}` dẫn đến lỗi lặp hai lần.
* **Độ Tương Phản RSVP Trên Nền Sáng / Nền Kem Hoàng Gia (`#FAF5EC`):**
  * Khi `TemplateRsvpSection` được đặt trên thẻ nền sáng, `customTheme` bắt buộc phải override các biến text của tone `ruby`:
    * `wrap: "bg-transparent text-[#3A2522]"`
    * `eyebrow: "text-[#8C1D28] font-semibold tracking-wider"`
    * `heading: "text-[#4A0A10] font-display font-bold"`
    * `subtext: "text-[#6E5A57]"`
  * Tuyệt đối không để chữ màu vàng kim nhạt `#E5C787` hay kem nhạt `#F7E7CE` hiển thị trên nền kem trắng gây mờ, khó đọc vi phạm WCAG AA.
* **Bảo Vệ Vùng Linh Vật Hero:**
  * Giới hạn `max-w-[260px] sm:max-w-[340px] md:max-w-[420px]` cho khối lời mời và tăng padding đáy `pb-24 sm:pb-28` để chữ nằm gọn ở trung tâm, không đè lấn lên cặp linh vật Long Phụng chầu ở 2 góc đáy.

### 12.5. Dress Code: Tuyệt Đối Chỉ Hiển Thị Ô Màu (Color Swatches Only) (Bug 7)
* Khối Dress Code trên **100% tất cả các template** TUYỆT ĐỐI CHỈ hiển thị các vòng tròn ô màu (Color Swatches).
* **CẤM HIỂN THỊ:**
  * Không in mã hex `#XXXXXX` bên dưới ô màu.
  * Không in tên màu hardcode ("Đỏ Chu Sa", "Vàng 24K", "Kem Hoàng Gia", "Đỏ Mận", "Xanh Ngọc Bích"...) bên dưới ô màu.
* Thiết kế thanh lịch, trang nhã, đúng tinh thần thiệp cưới cao cấp hiện đại: chỉ gồm tiêu đề khối + lời dẫn ngắn trang phục + hàng vòng tròn màu swatches viền nhẹ thanh thoát.

---

## 13. CỔNG NGHIỆM THU BẮT BUỘC SAU KHI TẠO / SỬA TEMPLATE (ZERO-MANUAL-QA GATE)

> **QUY TẮC CỨNG BẤT KHẢ XÂM PHẠM:**
> Sau khi tạo mới hoặc chỉnh sửa bất kỳ template nào, AI Agent / Developer **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** báo cáo hoàn thành cho đến khi vượt qua 100% cả 3 bước nghiệm thu dưới đây — loại bỏ triệt để việc người dùng phải đi dò lỗi thủ công!

### Bước 1: Build & Type Check Toàn Dự Án
```bash
# Bắt buộc đạt 0 lỗi kiểu TypeScript
npx tsc --noEmit

# Bắt buộc pass 100% bộ test suite hiện có (147/147 tests)
npm test

# Bắt buộc build production và sinh static pages thành công
npm run build
```

### Bước 2: Tầng 1 — Chạy Script QA Tự Động (`scripts/qa-template.mjs`)
Chạy script kiểm thử Playwright tự động cho template vừa tạo/sửa:
```bash
# Kiểm thử 1 template cụ thể (ví dụ: yen-chi-mau-don)
node scripts/qa-template.mjs <slug>

# Hoặc kiểm thử toàn bộ templates của hệ thống
node scripts/qa-template.mjs --all
```
**Bắt buộc 100% PASS tất cả 15 hạng mục kiểm thử tự động:**
1. **Asset WebP Clean:** 0 file `.png`, `.jpg`, `.jpeg` còn sót lại trong `public/templates/<slug>/`.
2. **Ảnh Bìa Catalog (`cover.webp`):** Tồn tại, chuẩn kích thước $720 \times 1180\text{px}$, dung lượng $< 60\text{KB}$.
3. **Trong Suốt Khung Vòm / Khung Phim:** Quét pixel tâm file `*arch*.webp` / `*frame*.webp` $\rightarrow$ `Alpha === 0` (chống che trắng ảnh cưới).
4. **Căn Tâm & Baseline Hộp Quà:** Đo bounding box pixel thực $\rightarrow$ tâm ngang $50\% \pm 4\%$, cao độ đáy đồng bộ giữa các file trạng thái.
5. **Không Tràn Ngang (Responsive):** `scrollWidth <= viewport.width` trên cả 3 kích thước $360 \times 590$, $390 \times 844$, $1440 \times 900$ (cả khi đóng bìa & đã mở thiệp).
6. **Bìa Sắc Nét & Sạch Dev Tools (360×590):** Thẻ bìa căn giữa đối xứng lề trái - phải ($\le 4\text{px}$), không có backdrop-blur phủ mờ nội dung, 0 dính icon N (`nextjs-portal`, `[data-next-badge-root]`).
7. **Khung Preview Điện Thoại (375px & 390px):** Ẩn hoàn toàn scrollbar mặc định, không nhận nhầm layout desktop đa cột.
8. **Văn Phong & Cấm Từ Khóa Cấm:** 0 chứa "gia tộc", "đại diện gia tộc", "thân sinh:", "bố mẹ:", "sự kiện trọng đại", "gói free hiển thị"; không lặp "ngày ngày".
9. **Dress Code Swatches Only:** 0 mã hex (`#XXXXXX`), 0 text tên màu hardcode dưới các ô màu.
10. **Đa Lễ & Lịch Trình Thật:** Hiển thị đủ 2 lễ tùy chỉnh và 3 mốc lịch trình thật; khối ngày giờ không tự bốc mốc lịch trình lên.
11. **Tắt 9 Toggle:** Khi tắt cả 9 toggle $\rightarrow$ trên thiệp chỉ còn Bìa + Hero + Footer, nút nhạc nền biến mất.
12. **Bật Độc Lập Block Nhạy Cảm:** Bật riêng `albumQr` (gói Pro, tắt `album`) $\rightarrow$ khối QR Album hiển thị độc lập.
13. **Đảo Nhà Gái Đứng Trước (`hostFirst: "bride"`):** Nhà Gái xuất hiện trước Nhà Trai theo đúng thiết lập.
14. **Thứ Tự Kéo Thả `sectionOrder`:** Khối kéo lên trước có tọa độ `Y` nhỏ hơn, thẻ `<footer>` luôn luôn nằm ở đáy trang.
15. **Tương Tác RSVP, Cuộn & Hộp Quà:** Click nút RSVP cuộn nội bộ an toàn (không reload/nhảy Dashboard); click hộp quà mở mượt mà; form RSVP có viền rõ ràng và tương phản chuẩn WCAG AA; 0 lỗi Console, 0 ảnh gãy.

### Bước 3: Tầng 2 — Soi Trực Quan Bằng Thị Giác Máy Tính (`/browser`)
Dùng slash command `/browser` hoặc browser subagent mở trình duyệt Chrome thật trên `http://localhost:3000/mau/<slug>` (hoặc `/qa/<slug>`) và tự quan sát trực quan đủ **6 góc nhìn bắt buộc**:
1. **Góc 1 — Ảnh bìa Catalog ($360 \times 590\text{px}$ @2x):** Căn giữa tuyệt đối, sắc nét, không mờ, không dính icon `N`, lưu `cover.webp < 60KB`.
2. **Góc 2 — Khung điện thoại trong Editor (375px — đóng bìa & đã mở):** Không có thanh scrollbar xám, không nhận nhầm layout Desktop, bìa thiệp cân đối dọc - ngang.
3. **Góc 3 — Hero & Ảnh lồng khung:** Ảnh cặp đôi vừa khít lòng vòm/khung (không tràn góc vuông, không nhỏ lọt thỏm, không bị che trắng, không bị chữ đè lên họa tiết chính).
4. **Góc 4 — Mobile thật ($390 \times 844\text{px}$ — cuộn từ đầu tới cuối):** Kiểm tra Gia đình (2 dòng sạch, không lặp "Bố mẹ:"), Đa lễ hiển thị đủ, Dress Code chỉ ô màu tròn, Lịch trình thật, Hộp quà mừng căn giữa (delay 700ms thấy rõ nắp bung mở) và Form RSVP (viền ô rõ nét, chữ tương phản dễ đọc).
5. **Góc 5 — Desktop ($1440 \times 900\text{px}$):** Cột nội dung trung tâm không bị chia cột ép chữ, không tràn nút Chỉ đường Google Maps, bố cục cân đối.
6. **Góc 6 — Modals (GiftModal & Lightbox):** Mở qua `createPortal`, màu nền và chữ rõ nét, đóng modal mượt mà.

> ⚠️ **HÀNH ĐỘNG KHI PHÁT HIỆN LỖI:** Nếu ở bất kỳ góc nhìn nào phát hiện lỗi thẩm mỹ hay lệch bố cục $\rightarrow$ **BẮT BUỘC TỰ SỬA NGAY**, chạy lại `node scripts/qa-template.mjs <slug>` và soi lại bằng `/browser` cho đến khi sạch lỗi 100% mới được báo cáo hoàn thành kèm tóm tắt kết quả kiểm thử.

---

## 14. QUY CHUẨN ĐỒNG BỘ AUTO-SCROLL & MỞ KHÓA ÂM THANH (SYNCHRONOUS GESTURE UNLOCK)

> **MỤC ĐÍCH:** Đảm bảo khi khách mời mở bất kỳ thiệp cưới nào trên Inviwedd, nhạc nền phát ngay lập tức và trang tự động cuộn nhẹ nhàng, đồng thời vượt qua 100% cơ chế chặn Autoplay ngặt nghèo của Safari iOS, Zalo WebView và Messenger In-App Browser mà không làm phiền người dùng ở chế độ Editor hay thẻ preview.

### 14.1. Kiến Trúc Tập Trung Duy Nhất (`InvitationExperienceProvider`)
* Mọi template (cả mới và cũ) đều được bọc tự động qua `InvitationExperienceProvider` tại `TemplatePreviewRenderer.tsx`.
* **Cung cấp Hook `useInvitationExperience()`:**
  * `{ isOpened, isMusicPlaying, toggleMusic, isAutoScrolling, toggleAutoScroll, startAutoScroll, stopAutoScroll, triggerInvitationOpened }`.
* **Duy nhất 1 thẻ `<audio>` trung tâm:**
  * Toàn bộ ứng dụng thiệp mời chỉ gắn duy nhất 1 thẻ `<audio ref={audioRef} loop preload="auto" playsInline />` tại Provider.
  * **CẤM:** Tuyệt đối không tự nhúng thêm thẻ `<audio>` riêng lẻ bên trong từng template hay component con (tránh lỗi phát đè 2 bài nhạc cùng lúc). Component `LiveMusicFloatingButton` tự động trả về `null` khi nằm trong Provider.

### 14.2. Mở Khóa Âm Thanh Đồng Bộ (Synchronous Gesture Unlock)
* **Quy chuẩn gọi mở thiệp 0ms:**
  * Đối với các template có màn mở bìa (phong bì, rèm lụa, ấn sáp, vali VIP, vé vintage...):
    * BẮT BUỘC gọi `onOpenedChange?.(true)` và `window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"))` **đồng bộ ngay ở dòng đầu tiên** của hàm xử lý click (`handleOpenCover`, `handleOpenCard`, `open`...).
    * **CẤM:** Không được bọc lệnh gọi mở thiệp bên trong `setTimeout` hay sau `await`. Trình duyệt WebKit/Blink sẽ thu hồi Token User-Gesture ngay khi sự kiện click kết thúc; gọi `audio.play()` sau $700\text{ms}$ sẽ bị ném lỗi `NotAllowedError` và chặn âm thanh vĩnh viễn!
* **Template mở thẳng (không có màn bìa):**
  * Thử `audio.play()`. Nếu trình duyệt chặn (`NotAllowedError`), tự động gắn listener 1 lần (`pointerdown`, `touchstart`, `click`, `keydown` với `{ capture: true, once: true }`) trên `window` để ngay cú chạm đầu tiên của khách vào bất kỳ đâu trên màn hình sẽ kích hoạt âm thanh tức thì.
* **Quản lý vòng đời (`document.visibilitychange`):**
  * Tự động tạm dừng nhạc khi khách chuyển tab hoặc ẩn ứng dụng Zalo/Messenger; tự động phát tiếp khi quay lại tab (trừ khi khách đã chủ động bấm Tắt thủ công).

### 14.3. Động Cơ Auto-Scroll Mượt 60fps (~42px/s) với Float Accumulator
* **Thời điểm kích hoạt:** Bắt đầu tự động cuộn sau **$1100\text{ms}$** tính từ khi mở thiệp (độ trễ vàng đủ để khách xem lướt ảnh bìa và tiêu đề chào mừng).
* **Float Accumulator chống kẹt 120Hz:** Dùng `requestAnimationFrame` tích lũy phần thập phân `accumulator += 42 * deltaSec`. Khi phần nguyên $\ge 1\text{px}$ mới thực hiện cuộn và trừ bớt phần nguyên. Cơ chế này loại bỏ hoàn toàn lỗi làm tròn về $0\text{px}$ trên các màn hình ProMotion 120Hz.
* **Tự động dừng thông minh — Tuyệt đối không tranh quyền cuộn với khách:**
  * Dừng ngay lập tức khi khách lăn chuột (`wheel`), chạm kéo màn hình (`touchstart`, `touchmove`), hoặc bấm phím điều hướng (`ArrowUp`, `ArrowDown`, `PageUp`, `PageDown`, `Space`, `Home`, `End`).
  * Dừng ngay lập tức khi khách focus vào bất kỳ trường nhập liệu nào (`input`, `textarea`, `select`, `contenteditable`).
  * Dừng ngay lập tức khi mở bất kỳ Modal / Lightbox nào (`inviwedd:modal-state` có `isOpen: true`).
  * Dừng sạch sẽ khi chạm đáy trang (`scrollTop + clientHeight >= scrollHeight - 4`).
* **Bấm lại nút cuộn khi ở đáy:** Tự động cuộn mượt (`behavior: "smooth"`) lên đầu trang rồi tiếp tục chu trình tự động cuộn.

### 14.4. Cụm Nút Nổi Kính Mờ (Floating Experience Controls)
* **Vị trí chuẩn:** Đặt tại góc dưới phải `fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 sm:right-6 sm:bottom-6`.
* **Thiết kế:** Kính mờ sang trọng, tối giản, thanh lịch, thích hợp với 100% tone màu thiệp (`bg-stone-900/80 backdrop-blur-md text-stone-100 border border-white/15 shadow-xl`).
* **CẤM:** Tuyệt đối không dùng icon ngôi sao/sparkles (`Star`, `Sparkles`, `✨`, `✦`).
* **Nút Nhạc nền:** Xoay đĩa than `Disc3` mượt mà khi phát / hiển thị biểu tượng tắt khi dừng.
* **Nút Auto-Scroll:** Biểu tượng `ChevronsDown` nhịp nhàng khi cuộn / biểu tượng `Pause` khi dừng.

---

## 15. QUY CHUẨN ĐA LỄ BẮT BUỘC (MULTI-EVENT MANDATORY RULE)

> **MỤC ĐÍCH:** Khắc phục triệt để lỗi chỉ hiển thị 1 lễ khi khách được mời 2+ lễ (ví dụ vừa dự Lễ Vu Quy/Thành Hôn vừa dự Tiệc Cưới). Đảm bảo 100% template trên Inviwedd hiển thị đầy đủ, chính xác, độc lập từng buổi lễ mà khách mời được phép xem.

### 15.1. Nguyên Tắc Cốt Lõi: Cấm Hardcode `events[0]`
* **CẤM TUYỆT ĐỐI:** Khai báo `const primaryEvent = events[0]` rồi chỉ render duy nhất thẻ đó trong khu vực "Thời Gian & Địa Điểm" / "Sự Kiện".
* **BẮT BUỘC DÙNG LẶP DANH SÁCH:** Luôn dùng `visibleEvents.map((evt, idx) => ...)` để render linh hoạt từ 1 đến $N$ buổi lễ (`Lễ Vu Quy`, `Lễ Thành Hôn`, `Lễ Tân Hôn`, `Tiệc Cưới`, `Lễ Báo Hỷ`...).
* Sử dụng helper chuẩn hóa `getVisibleEvents(data)` từ `@/lib/events` để luôn đảm bảo nhận danh sách `WeddingEvent[]` hợp lệ (kèm fallback 1 lễ an toàn khi dữ liệu trống).

### 15.2. Nội Dung Độc Lập Cho Từng Thẻ Lễ
Mỗi thẻ lễ trong danh sách bắt buộc phải hiển thị độc lập và đầy đủ:
1. **Tên Lễ (`evt.title`):** Viết hoa hoặc in đậm trang trọng (ví dụ: `LỄ VU QUY`, `TIỆC CƯỚI CHUNG VUI`).
2. **Thời Gian:**
   * Giờ bắt đầu (`formatWeddingDateParts(evt.startsAt).time`, ví dụ: `11:00`).
   * Thứ và ngày dương lịch (`formatWeddingDateParts(evt.startsAt)`: Thứ, Ngày, Tháng, Năm).
   * Ngày âm lịch (`formatLunarDateClean(evt.lunarDate)`: ví dụ `Tức Ngày 18 Tháng 11 Năm Giáp Thìn`).
3. **Địa Điểm:**
   * Tên địa điểm (`evt.venueName`): In hoa hoặc font nhấn mạnh.
   * Địa chỉ chi tiết (`evt.venueAddress`): Rõ ràng, dễ đọc.
4. **Nút Chỉ Đường Google Maps Riêng:**
   * Dùng helper `getEventDirectionsUrl(evt)` từ `@/lib/events`.
   * Liên kết trỏ thẳng tới `evt.mapDirectionsUrl` (nếu có) hoặc tự động sinh URL tìm kiếm Google Maps:
     `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueName + " " + venueAddress)}`.

### 15.3. Bố Cục Responsive & Cân Đối Thị Giác
* **Khi chỉ có 1 lễ:** Căn giữa cân đối, thanh lịch (`w-full max-w-xl mx-auto`).
* **Khi có 2+ lễ:**
  * **Trên Mobile:** Xếp dọc theo thứ tự thời gian (`flex flex-col gap-4 sm:gap-6` hoặc `grid grid-cols-1 gap-4 sm:gap-6`), không để tràn mép màn hình hay co rút chữ (`scrollWidth === viewport.width`).
  * **Trên Desktop:** Chia 2 cột cân xứng (`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6`) hoặc xếp dọc sang trọng theo đúng ngôn ngữ thiết kế của template (phong cách vé xem phim, cuộn thư, thẻ VIP...).

### 15.4. Đồng Bộ Đếm Ngược (Countdown) & Lịch Tháng (Calendar)
* **Đồng Hồ Đếm Ngược:** Dùng helper `getNearestUpcomingEvent(visibleEvents, data.date)` để luôn đếm ngược đến buổi lễ gần nhất sắp diễn ra (hoặc buổi lễ đầu tiên nếu tất cả đều chưa tới).
* **Lịch Tháng (Calendar Grid):**
  * Đánh dấu (highlight) tất cả các ngày diễn ra lễ trong tháng đó thuộc danh sách `visibleEvents`:
    ```tsx
    const eventDays = new Set(
      visibleEvents.map((evt) => parseInt(formatWeddingDateParts(evt.startsAt).day, 10))
    );
    const isEventDay = eventDays.has(dayNumber);
    ```

---

## 16. QUY CHUẨN KHUNG ẢNH PHIM, TIÊU ĐỀ & NGÔN NGỮ ĐIỆN ẢNH (FILM FRAME & CINEMATIC STANDARDS)

> **MỤC ĐÍCH:** Đảm bảo toàn bộ template mang phong cách điện ảnh (Hongkong 90s, Retro, Cinema...) không bị lỗi khung phim cắt ngang nhân vật, không lặp tiêu đề rườm rà, và không lạm dụng từ khóa chủ đề trong nội dung.

### 16.1. Khung Ảnh Phim 35mm (Film Frame Viewport Bounded Rule)
* **CẤM TUYỆT ĐỐI:** Đặt ảnh khung PNG lơ lửng đè lên giữa ảnh nhân vật, hoặc dùng `object-contain` khiến 2 dải lỗ phim đen cắt ngang qua mặt, đầu, tóc hay thân hình của cô dâu chú rể.
* **BẮT BUỘC DỰNG BẰNG CSS/SVG HOẶC CONTAINER CÓ CỬA SỔ RIÊNG:**
  * Ảnh nhân vật bắt buộc phải nằm gọn bên trong lòng khung (aperture/viewport riêng có `overflow-hidden` và `relative flex-1 aspect-[4/5]` hoặc `aspect-[3/4]`, `aspect-[16/10]`).
  * 2 dải lỗ phim 35mm (sprockets) cùng các vạch thước phim phải nằm bao bọc độc lập ở hai mép ngoài (bên ngoài container ảnh).
  * Ảnh nhân vật không bao giờ được tràn ra ngoài mép khung và không có bất kỳ vệt đen/lỗ phim nào đè lên người.
  * Tái sử dụng component chuẩn hóa `FilmFrame35mm` từ `@/templates/shared/FilmFrame35mm`.

### 16.2. Cấm Lặp Tiêu Đề Rườm Rà (Eyebrow & Heading De-duplication)
* **CẤM TUYỆT ĐỐI:** Đặt eyebrow kiểu song ngữ "TIẾNG ANH · TIẾNG VIỆT" lặp lại y nguyên heading bên dưới (ví dụ: eyebrow `CONTACT SHEET · CUỘN PHIM 35MM` đè lên heading `CUỘN PHIM 35MM`, hay `GIFT BOX · HỘP QUÀ HỶ SỰ` đè lên `HỘP QUÀ HỶ SỰ`).
* **CHUẨN HÓA CÁC ĐẦU MỤC:**
  * Mục Album: Xóa bỏ hoàn toàn eyebrow lặp, rút gọn heading thành `THƯỚC PHIM`.
  * Mục Hộp quà: Xóa bỏ eyebrow rườm rà, rút gọn heading thành `HỘP QUÀ`.
  * Mục RSVP: Xóa bỏ eyebrow lặp, rút gọn heading thành `XÁC NHẬN THAM DỰ`.
  * Mục Lịch trình: Xóa bỏ eyebrow `SHOWTIME · LỊCH CÔNG CHIẾU`, giữ heading gọn gàng `LỊCH CÔNG CHIẾU & TIỆC CƯỚI` hoặc `LỊCH TRÌNH NGÀY VUI`.

### 16.3. Giảm Lạm Dụng Từ Khóa Chủ Đề (No Theme Keyword Stuffing)
* Không nhồi nhét tên chủ đề (ví dụ "Hương Cảng", "Hồng Kông", "Hong Kong Night") vào mọi tiêu đề hay nhãn phụ.
* Thay `BÁO HƯƠNG CẢNG · LỊCH THÁNG` thành `LỊCH THÁNG`.
* Xóa bỏ badge `HONG KONG NIGHT` trên event cards.
* Thay các phụ đề gượng ép như `HỒNG KÔNG RETRO · ART DECO` hay `PRESENTED IN 35MM · HONG KONG RETRO` bằng nhãn thiệp trang trọng như `THIỆP BÁO HỶ` hoặc thông điệp điện ảnh tinh tế như `A FILM BY LOVE · 35MM CINEMA`.
* Để thiết kế thị giác, typography và bảng màu tự kể câu chuyện nghệ thuật mà không cần nhồi nhét chữ.

---

## 17. QUY CHUẨN KHÓA BÌA PREVIEW, 3D COVERFLOW SEAMLESS & AUTO-SCROLL

> **MỤC ĐÍCH:** Đảm bảo toàn bộ 100% template có màn bìa mở thiệp hiển thị cân đối trong khung điện thoại Preview (Hero, Editor, Showcase), chống kẹt cuộn, và đảm bảo 3D Coverflow cùng Auto-Scroll hoạt động trơn tru.

### 17.1. Chuẩn Hóa Khung Chứa Bìa & Ruột Thiệp Trong Chế Độ `contained`
* **CỐT LÕI VẤN ĐỀ:** Khi hiển thị trong khung điện thoại (chế độ `contained = true`), nếu root container có `min-h-full` nhưng ruột thiệp (5000px) không bị ẩn, chiều cao container sẽ giãn ra 5000px. Lúc này bìa `Cover` (`absolute inset-0`) sẽ có chiều cao 5000px và `justify-center` sẽ đẩy thẻ thiệp xuống $Y = 2500\text{px}$, khiến màn hình chỉ còn mảng màu trống trơn và 1 ký tự trôi dạt mép trái.
* **CẤM:** Không được để container cố định `h-full overflow-hidden` vĩnh viễn (khiến thiệp không thể cuộn sau khi mở, như lỗi ở Tử Đằng Dạ Khúc).
* **CÔNG THỨC CHUẨN BẮT BUỘC:**
  ```tsx
  <div
    data-template-id="template-id"
    className={cn(
      "relative w-full mx-auto select-text overflow-x-hidden antialiased",
      contained
        ? (!coverGone ? "h-full overflow-hidden" : "min-h-full")
        : (!coverGone ? "h-screen-dvh max-h-full overflow-hidden" : "min-h-screen")
    )}
  >
    {!coverGone && <Cover ... />}
    <div
      className={cn(
        "mx-auto w-full",
        !coverGone && !closing && "hidden pointer-events-none"
      )}
    >
      {/* Ruột thiệp chính */}
    </div>
  </div>
  ```
* **Ý NGHĨA:** Khi thiệp chưa mở (`!coverGone`), chiều cao bị khóa chặt đúng 100% viewport (`h-full overflow-hidden`) và ruột thiệp ẩn hoàn toàn $\to$ Bìa thiệp căn giữa tuyệt đối. Khi người dùng bấm Mở thiệp $\to$ `closing = true` hiển thị ruột thiệp phía sau $\to$ `coverGone = true` chuyển sang `min-h-full` mở khóa cuộn mượt mà.

### 17.2. 3D Coverflow Seamless Infinite Loop (Landing Page)
* **Toán Học Vòng Tròn Có Dấu (Signed Circular Offset):**
  ```ts
  const getCircularOffset = (index: number, active: number, total: number) => {
    let diff = (index - active) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };
  ```
* **Hiển Thị Đối Xứng 2 Bên (-3, -2, -1, 0, +1, +2, +3):** Không bao giờ bắt đầu bằng 1 thẻ trơ trọi cụt bên trái. Dù ở `activeIndex = 0` hay bất kỳ vị trí nào, các thẻ phụ luôn trải đều 2 bên.
* **Bỏ Viền Trắng Dày:** Thẻ thiệp sử dụng `border-0 p-0 bg-transparent rounded-[24px]` với đổ bóng sâu `shadow-[0_24px_60px_-15px_rgba(0,0,0,0.38)]`.
* **Kích Thước Thẻ Thiệp:** Phóng to thẻ trung tâm trên Desktop (`w-[330px] h-[640px] sm:w-[340px] sm:h-[660px]`) và Mobile (`w-[270px] h-[500px]`).
* **Auto-Scroll Thẻ Active:** Sau 800ms debounce khi mở bìa, tự động cuộn từ từ xuống dưới (tốc độ ~32px/giây theo `performance.now()`). Tự dừng ngay khi chuột hover hoặc ngón tay chạm vuốt. Tự reset về đầu trang khi chuyển thẻ.
* **Nút Phát Nhạc Độc Lập:** Có nút loa/đĩa xoay ở góc thẻ active để nghe thử nhạc mẫu tương ứng mà không bị chồng tiếng khi chuyển thẻ.

### 17.3. Đồng Bộ Container Cuộn Cho Auto-Scroll Trong Iframe & Preview
* Trong `TemplatePreviewRenderer` và `InvitationExperienceProvider`, bắt buộc chuyển tiếp `scrollContainerRef` để khi chạy ở chế độ nhúng (`embed=true` hoặc sub-container `overflow-y-auto`), Auto-Scroll điều khiển trực tiếp container thay vì gọi `window.scrollBy` khi `html, body` bị `overflow: hidden`.

---

## 18. QUY CHUẨN CÔ LẬP VIEWPORT MOBILE (375PX), AUTO-SCROLL 120PX/S & PHÁT NHẠC THẬT TRÊN COVERFLOW

> **MỤC ĐÍCH:** Khắc phục triệt để lỗi rò rỉ media query Desktop vào thẻ thiệp dọc trên Coverflow, nâng tốc độ cuộn tự động lên chuẩn 120px/s mượt mà, và bảo đảm âm thanh phát thật đồng bộ khi người dùng xem thử.

### 18.1. Cô Lập Viewport Mobile 375px Bằng `MobilePreviewFrame`
* **VẤN ĐỀ GỐC RỄ:** Khi component template được render trực tiếp trong một thẻ `<div>` nằm trên trang Landing Desktop (màn hình 1440px+), CSS Media Query của trình duyệt (`@media (min-width: 640px)`) đánh giá theo kích thước cửa sổ trình duyệt thay vì kích thước thẻ `<div>` (~340px). Điều này kích hoạt các class `sm:` và `md:`, khiến khối thông tin song thân/Trưởng Nam/Ái Nữ bị chia làm 2 cột hẹp, bẻ từ xuống từng dòng ("Ông / Lê / Quang / Minh", "Đoàn / Ngọc / Hân").
* **GIẢI PHÁP BẮT BUỘC:** Bọc Live Preview của thẻ Active trong `MobilePreviewFrame` (`targetWidth={375}`):
  ```tsx
  <MobilePreviewFrame
    scrollRef={centerScrollRef}
    lockedScroll={!previewOpened}
    targetWidth={375}
  >
    <DynamicPreviewRenderer
      templateId={template.id}
      data={getDemoTemplateData(template.id)}
      mode="demo"
      contained
      viewport="phone"
      isOpened={previewOpened}
      onOpenedChange={setPreviewOpened}
      externalMusicControl
    />
  </MobilePreviewFrame>
  ```
* **LỢI ÍCH:**
  1. Cửa sổ bên trong `iframe` có chiều rộng logic đúng 375px (< 640px), vô hiệu hóa hoàn toàn các breakpoint Desktop, buộc 100% template hiển thị chuẩn bố cục 1 cột mobile rộng rãi, chữ không bao giờ bị bẻ gãy hay cắt mép.
  2. Tự động co tỉ lệ hiển thị theo kích thước container thực tế bằng `transform: scale(cardWidth / 375)` với `transform-origin: top left`.
  3. Ẩn hoàn toàn scrollbar với `scrollbar-width: none` và `::-webkit-scrollbar { display: none }`.

### 18.2. Chuẩn Hóa Tốc Độ Auto-Scroll 120px/s Bằng Tích Lũy Số Thực (Float Accumulator)
* **Hằng Số Chuẩn:** `const LANDING_AUTO_SCROLL_SPEED = 120;` (120 px/giây).
* **Thuật Toán Tích Lũy Phần Thập Phân (rAF Float Accumulator):**
  ```ts
  const safeDelta = Math.min(dt, 0.1);
  accumulator += LANDING_AUTO_SCROLL_SPEED * safeDelta;
  const pixelsToScroll = Math.floor(accumulator);
  if (pixelsToScroll >= 1) {
    accumulator -= pixelsToScroll;
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (container.scrollTop < maxScroll) {
      container.scrollTop += pixelsToScroll;
    }
  }
  ```
* **Bảo Đảm Độ Chính Xác Tuyệt Đối:** Cuộn mượt và đúng tốc độ 120px/s trên tất cả các màn hình tần số quét 60Hz, 120Hz hay ProMotion mà không bị giật lag hay tích lũy sai số làm tròn số nguyên.
* **Tương Tác Người Dùng:**
  * Tự động dừng cuộn ngay khi người dùng chạm vuốt hoặc lăn chuột (`wheel`, `touchstart`, `mouseenter`).
  * Tự động reset `scrollTop = 0` và accumulator khi chuyển sang thẻ thiệp khác.

### 18.3. Quản Lý Âm Thanh Thực Trên Coverflow & Trang Xem Thử (/mau/[templateId])
* **Nguyên tắc 1 nguồn phát duy nhất (`lib/global-audio.ts`):** Mọi trình phát nhạc bên ngoài thiệp (Coverflow Landing, Popup `TemplatePreviewDialog`, Preview Navbar `/mau/[templateId]`, Builder `/tao-thiep`) bắt buộc đi qua singleton `globalAudio` (không tạo `<audio>` rời rạc).
* **Coverflow Landing:**
  * Nút "Bật nhạc" trên thẻ thiệp kích hoạt `globalAudio.play(src)` đồng bộ ngay trong sự kiện `onClick` (giữ user gesture hợp lệ trên iOS Safari / Chrome Mobile) và gọi `e.stopPropagation()` trên đủ 4 sự kiện (`onTouchStart`, `onTouchEnd`, `onPointerDown`, `onClick`).
  * Khi chuyển thẻ nếu người dùng đang bật nhạc, tự động chuyển track sang bài nhạc mặc định của template mới và gọi `globalAudio.stop()` khi unmount/chuyển trang.
* **Trang Xem Thử (/mau/[templateId]):**
  * `MusicToggle` thiết lập `autoPlay={true}` kết hợp `globalAudio`, luôn truyền `?externalAudio=1` / `disableAudio={true}` vào iframe nhúng để chống phát đúp.

---

## 19. QUY CHUẨN THIẾT KẾ MẪU THIỆP "MỘT THỜI ĐỂ NHỚ – VINTAGE LOVE STORY" (`mot-thoi-de-nho`)

> **MỤC ĐÍCH:** Định hình chuẩn mực cho dòng thiệp Handmade Scrapbook & Vintage Journal mộc mạc, hoài niệm, bảo đảm trải nghiệm mở thư xúc động, tương thích 100% âm thanh và vượt qua bộ kiểm thử tự động QA.

### 19.1. Thông Tin Đăng Ký & Định Vị Phân Hạng (Tiering)
* **Mã định danh (Slug):** `mot-thoi-de-nho`
* **Tên hiển thị:** Một Thời Để Nhớ
* **Phụ đề / Concept:** Vintage Love Story
* **Danh mục:** Lãng mạn (`romantic`)
* **Phân hạng:** Gói Standard (`pro` — 159.000đ, hiển thị badge Standard)
* **Tông màu lọc:** Kem / Nâu Vintage (`neutral`: `#F5EFE2`, `#B99976`, `#7C3629`)
* **Nhạc nền mặc định:** `/media/co-dien.mp3` (*Giai Điệu Cổ Điển*)
* **Ảnh bìa catalog:** `/templates/mot-thoi-de-nho/cover.webp` (kích thước chuẩn `720×1180px`, dung lượng < 60KB).

### 19.2. Bảng Màu, Typography & Phong Cách Handmade Scrapbook
* **Bảng màu hoài niệm (Vintage Palette):**
  * Nền giấy kem cũ ngả vàng: `#F5EFE2` (kết hợp họa tiết texture `bg-vintage-paper.webp`).
  * Thẻ giấy & phong bì be sáng: `#FAF6EC` / `#EDE3CE`.
  * Nâu giấy kraft mộc mạc: `#C4A484` / `#B99976`.
  * Nâu đất chữ chính & mực viết tay: `#4A3728` (chữ phụ `#5E493A` tương phản tốt, dễ đọc).
  * Nâu đỏ trầm dấu sáp & CTA: `#7C3629` (hover `#642A1F`).
* **Hệ thống Font chữ:**
  * Viết tay nghệ thuật: `var(--font-dancing-script), "Dancing Script", cursive`.
  * Serif cổ điển: `var(--font-cormorant), "Cormorant Garamond", Georgia, serif`.
  * Thân bài (Body): `var(--font-lora), var(--font-be-vietnam), "Lora", "Be Vietnam Pro", serif`.
* **Nguyên tắc thẩm mỹ:** Không sử dụng màu sắc gắt công nghiệp, không dùng icon ngôi sao/sparkle (`Star`, `Sparkles`, `✨`), các chi tiết washi tape, hoa ép khô và tem thư sắp xếp bất đối xứng tự nhiên như dán thủ công.

### 19.3. Màn Bìa Phong Thư Mở Thiệp Chậm Rãi (1.45s 3-Stage State Machine)
* **Giao diện đóng & Vị trí con dấu sáp:**
  * Chiếc phong thư vintage màu kem căn giữa màn hình, nắp tam giác gấp chéo `clip-path: polygon(0 0, 100% 0, 50% 100%)`.
  * Con dấu sáp nâu đỏ `wax-seal-terracotta.webp` đặt ở vị trí `top-[108px] sm:top-[118px]`.
  * Ruột thư có padding trên `pt-24 sm:pt-28`, đảm bảo dòng chữ `VINTAGE LOVE STORY` và tên cặp đôi nằm thoáng phía dưới con dấu sáp, **tuyệt đối không bị con dấu sáp đè lên chữ**.
* **Máy trạng thái 3 giai đoạn (State Machine) chống kẹt:**
  * Khi click: Kích hoạt `triggerInvitationOpened()` đồng bộ, phát SFX `playCoverSfx("envelope")`, chuyển `stage = "opening-flap"`.
  * **Stage 1 (0 -> 450ms):** Nắp thư lật 3D lên trên (`rotateX(-180deg)`), con dấu sáp thu nhỏ và mờ dần (`scale-75 opacity-0`).
  * **Stage 2 (450ms -> 1050ms):** Ruột thư trượt nhô lên khỏi miệng phong bì (`-translate-y-16 scale-[1.03]`).
  * **Stage 3 (1050ms -> 1450ms):** Toàn bộ overlay phong bì mờ dần (`opacity: 0`).
  * **Hoàn tất (1450ms):** Chuyển `stage = "opened"`, unmount hoàn toàn overlay phong bì (`return null`), mở khóa cuộn và kích hoạt auto-scroll.
* **Block Chuyện Chúng Mình (Love Story):**
  * Đọc dữ liệu mộc mạc từ `data.story`, hoàn toàn độc lập khỏi `data.timeline`.
  * Thẻ kỷ niệm dùng ảnh `kraft-note-card.webp` đã crop chuẩn mép giấy (720x526px, 0 margin thừa) với `backgroundSize: "100% 100%"`, không bị viền trắng hay hụt 2 bên.
  * Phân quyền: Chỉ hiển thị trên gói Standard (`pro`) và Pro (`vip`); gói Miễn phí (`free`) ẩn hoàn toàn khỏi thiệp và preview.

### 19.4. Bố Cục 4 Kiểu Khung Ảnh Scrapbook Đa Dạng
1. **Khung Polaroid (2 ảnh):** Viền trắng dày đáy rộng, xoay nghiêng nhẹ -2deg / +1.5deg, dán góc bằng `washi-tape-beige.webp`, có chú thích chữ viết tay.
2. **Khung Giấy Xé (1–2 ảnh):** Ảnh đặt trên nền giấy xé răng cưa tự nhiên, cố định bằng `washi-tape-kraft.webp`.
3. **Khung Album Cổ 4 Góc (1–2 ảnh):** 4 góc tam giác da nâu cổ điển ôm lấy 4 góc bức ảnh.
4. **Dải Thước Phim 35mm (2–3 ảnh):** Dải phim nâu đen vintage, hàng lỗ phim nằm hoàn toàn bên ngoài vùng ảnh, ảnh nằm gọn trong viewport không bị che mặt.
* Toàn bộ ảnh tích hợp `TemplateLightboxModal` xem phóng to sắc nét.

### 19.5. Tuân Thủ Đa Lễ & Bộ Kiểm Thử Tự Động QA
* Dùng helper `getVisibleEvents(data)` hiển thị đầy đủ mọi lễ cưới khách được mời (1, 2, 3+ lễ) dưới dạng tấm bưu thiếp giấy kem kèm nút chỉ đường Google Maps độc lập.
* Hộp quà 3 trạng thái (`gift-box-closed.webp` $\to$ `gift-box-opening.webp` $\to$ `gift-box-opened.webp`) đồng bộ đáy (baseline) tuyệt đối, mở trễ 700ms mở `GiftModal`.
* Hỗ trợ đầy đủ `hiddenSections` (ẩn sạch 9 toggle khi cấu hình tắt), `hostFirst: "bride"` (đảo Nhà Gái lên trước) và `sectionOrder`.
* Vượt qua 100% 15/15 tiêu chí trong `qa-template.mjs`.

---

## 20. CHUẨN PHÂN HẠNG & QUY TRÌNH TẠO THIỆP MIỄN PHÍ VS. STANDARD (159K)

> **MỤC ĐÍCH:** Phân định rạch ròi giữa mẫu **Miễn phí (`0đ`, mã `free`)** và mẫu **Standard (`159.000đ`, mã `pro`)** để mỗi mẫu Standard đều tạo ra lý do chuyển đổi rõ ràng (không bị trùng lặp với mẫu Free).
> **Lưu ý tên gói hiện hành (`config/pricing.ts`):**
> * **Miễn phí (`0đ`)** = `plan: "free"`
> * **Standard (`159.000đ`)** = `plan: "pro"` ← *Hạng chuẩn cho toàn bộ mẫu thiệp trả phí mở khóa đầy đủ tính năng thiệp.*
> * **Pro (`399.000đ`)** = `plan: "vip"` ← *Hạng cao cấp 399k cho trải nghiệm sảnh tiệc (LED / Photo Wall / 300 ảnh khách / duyệt ảnh).*

### 20.1. Bảng So Sánh Tiêu Chuẩn: Thiệp Miễn phí vs. Thiệp Standard (159k)

| Tiêu chí | Thiệp Miễn phí (`plan: "free"`) | Thiệp Standard (`plan: "pro"`) |
| :--- | :--- | :--- |
| **Vai trò trong phễu** | Thu hút người dùng tạo thiệp nhanh, trải nghiệm đẹp – gọn – đủ dùng. | Tạo khoảnh khắc "Wow" và lý do rõ ràng để khách nâng cấp gói Standard. |
| **Concept & Bố cục** | Layout dọc chuẩn truyền thống (Hero → Gia đình → Lịch/Bản đồ → Dress code → Album → Quà → RSVP). | **Concept nghệ thuật phá khuôn**, có bản sắc kể chuyện xuyên suốt (Vd: Điện ảnh Hồng Kông 90s `cuu-long-hy-yen`, Nhật ký Vintage `mot-thoi-de-nho`, Tạp chí Vogue, Hộ chiếu/Vé phim). |
| **Tương tác độc bản (Signature)** | Mở bìa cơ bản (fade/trượt đơn) + hộp quà mở modal. | **Bắt buộc có hiệu ứng mở bìa 3 pha "Live-Hero Reveal"** (cửa 3D Art Deco `rotateY`, rèm nhung xé vé đóng dấu son, màn trập phim 35mm, tia sáng CRT... tách trực tiếp trên Hero thật) **+ ít nhất 1–2 tương tác độc bản bên trong**: Thẻ cào nhũ vàng 24K (`<canvas>`), Lật thẻ bài 3D (`rotateY(180deg)`), Phong bì 3D 3-stage. |
| **Hiệu ứng âm thanh (SFX)** | Âm thanh đại trà 1 pha nhẹ (`envelope`, `box`). | **Bắt buộc có "Signature Cinema Foley"** riêng theo chủ đề & ngữ cảnh (`lib/sfx-foley.ts`): phối âm đa pha khớp mở bìa 3 pha (kéo rèm nhung, chuông cửa VIP, sập clapperboard, mở cổng Art Deco, bật đèn neon/CRT), mở quà VIP (bật chốt khóa số vali tiền, nắp hộp thiếc) + Micro-SFX khi cào nhũ & lật thẻ 3D. |
| **Block Chuyện chúng mình (`story`)** | **KHÔNG có** (`storySupported: false`). | **BẮT BUỘC có** (`storySupported: true`), đọc `data.story` (`{ id?, year?, title, content }`) với thiết kế trực quan (cuộn phim 35mm, thẻ giấy kraft, timeline lồng ảnh album). |
| **Block Lịch trình (`timeline`)** | Tùy mẫu. | **BẮT BUỘC có** (`timelineEditor: true`), đọc `data.timeline`, trình bày có chủ đề (Vd: Cue Sheet `ACT I, II...`). |
| **Ảnh chân dung & Đảo hai họ** | Thường chỉ có 1 ảnh Hero chung (`couplePhotos: false`). | **Khuyến nghị bật đủ** `couplePhotos: true` (tôn trọng `data.hideCouplePhotos`) và `hostFirst: true` (hỗ trợ đảo Nhà Gái / Nhà Trai). |
| **Thiết kế Album ảnh** | Tối ưu cho **5 ảnh** (lưới 2 cột đơn giản). | **Tối ưu cho 10–30 ảnh HD** của gói Standard (Vd: 5 ảnh đầu lưới nổi bật + từ ảnh thứ 6 trở đi dạng **Film Strip / Lookbook cuộn ngang** để không kéo dài trang quá mức). |
| **Khả năng sắp xếp (`sectionOrder`)** | Tùy mẫu. | **BẮT BUỘC `reorderable: true`**, đầy đủ 10 key trong `ALL_SECTION_KEYS` (`DEFAULT_TEMPLATE_SECTIONS`). |
| **Quyền dùng thử & Xuất bản** | Tạo & xuất bản miễn phí ngay tại `/tao-thiep`. | **Cho xem thử miễn phí** ở `/mau/<id>` và `/tao-thiep?template=<id>` (ghép tên/ảnh thật để kích thích chuyển đổi), nhưng **bắt buộc nâng cấp Standard mới được lưu/xuất bản** (`POST /api/weddings` khóa `403` với gói Free). |

### 20.2. Công Thức Bắt Buộc Khi Thiết Kế Một Mẫu Standard Mới
Để không tạo ra một mẫu Standard "chỉ khác mẫu Free ở mỗi cái tên gói", mỗi mẫu Standard mới phải hội tụ đủ **3 trụ cột**:
1. **1 Concept nghệ thuật có bản sắc riêng** (typography + bảng màu + chất liệu nền đồng bộ, có thể tái sử dụng hoặc tách asset `.webp` sắc nét).
2. **1–2 Tương tác "chạm là thích"** chạy mượt 60fps trên Mobile:
   * Luôn hỗ trợ `prefers-reduced-motion` và có nút truy cập nhanh (Vd: nút *"Mở nhanh"* trên thẻ cào nhũ vàng cho người lớn tuổi).
   * Tuyệt đối không đặt `backdrop-blur` đè lên container có `transform-3d` / `perspective` (tránh flicker trên iOS Safari — luôn dùng gradient đặc + `backface-visibility: hidden`).
3. **Đầy đủ bộ dữ liệu Standard từ Dashboard:**
   * Đọc & vẽ đầy đủ: `data.story` (`story`), `data.timeline` (`timeline`), `data.dressCode`, `data.hideCouplePhotos`, `data.hostFirst`, `data.hiddenSections`, `data.sectionOrder`, `GuestAlbumQr` (khóa `data.plan !== "free" && !hidden.has("albumQr")`), và nút nhạc tôn trọng `!hidden.has("music")`.

> **Mẫu chuẩn tham chiếu hiện có:**
> * [templates/cuu-long-hy-yen/index.tsx](templates/cuu-long-hy-yen/index.tsx) — *Cửu Long Hỷ Yến*: Thẻ cào nhũ vàng 24K (`GoldenScratchCard`), Lật thẻ bài 3D K♥/Q♥ (`RoyalFlipCard`), Cuộn phim 35mm (`story`), Cue Sheet (`timeline`), Film Strip 30 ảnh.
> * [templates/mot-thoi-de-nho/index.tsx](templates/mot-thoi-de-nho/index.tsx) — *Một Thời Để Nhớ*: Phong bì 3D 3-stage, Chuyện chúng mình giấy kraft, 4 kiểu khung Scrapbook.

### 20.3. Checklist 5 Bước Bắt Buộc Khi Gắn Mác Standard (`plan: "pro"`)
Mỗi khi tạo mới hoặc nâng hạng một mẫu lên **Standard**, bắt buộc thực hiện đủ 5 bước sau:
1. **Đăng ký trong `templates/registry.ts`:**
   * Đặt `plan: "pro"` (UI sẽ tự hiển thị nhãn **`Standard`** qua `getPlanLabel("pro")`).
   * Viết `description` nêu bật các tương tác/block độc quyền Standard.
   * Khai báo `extraFeatureIds: [...]` để popup xem mẫu hiển thị mục **"Riêng mẫu này"**.
2. **Khai báo nhãn tính năng trong `config/template-features.ts`:**
   * Thêm mô tả tiếng Việt ngắn gọn cho từng `extraFeatureId` vào `EXTRA_FEATURES`.
   * Không để cờ `comingSoon: true` cho các tính năng đã hoàn thiện.
3. **Đồng bộ năng lực Dashboard trong `config/template-sections.ts` & Unit Test:**
   * Gán `DEFAULT_TEMPLATE_SECTIONS` (hoặc cấu hình khớp 100% các block mẫu thực sự đọc).
   * Cập nhật `tests/template-sections.test.ts` xác minh `storySupported`, `timelineEditor`, `couplePhotos`, `hostFirst`.
4. **Kiểm chứng Tag `Standard` & Phễu Chuyển đổi tại 4 điểm chạm:**
   * **Coverflow trang chủ** (`components/landing/template-showcase.tsx`): Hiện badge **`STANDARD`** (từ `getPlanLabel`), nút **"Dùng thử"**.
   * **Kho mẫu & Popup** (`components/templates/template-grid-browser.tsx`, `template-preview-dialog.tsx`): Hiện pill badge **`Standard`** nổi bật, CTA **"Dùng thử mẫu Standard"** kèm chú thích cần gói Standard khi xuất bản.
   * **Trang xem thử `/mau/[templateId]`** (`components/demo/template-demo-viewer.tsx`, `demo-toolbar.tsx`): Hiện badge **`Standard`**, nút **"Mở khóa gói Standard"** (mở `PlanUpgradeModal` khi chưa có gói).
   * **Trang `/tao-thiep`** (`components/create/CreateWeddingBuilder.tsx`): Giữ nguyên mẫu Standard cho khách xem trước với tên/ảnh thật, hiện tag **`Standard`** + banner thông báo và chặn lưu xuất bản Free (khớp `403` từ `POST /api/weddings`).
5. **Nghiệm thu kỹ thuật trước khi phát hành:**
   * 100% đường dẫn `/templates/<id>/*.webp` khớp file thực tế trong `public/templates/<id>/`.
   * Khóa chiều cao bìa trong chế độ `contained` (`!coverGone`) và căn khớp ảnh Hero theo tọa độ `%` thực tế của khung `.webp` (`AGENTS.md` §7).
   * Chạy trọn bộ `npx eslint . --quiet`, `npm run typecheck`, `npm test`, `npm run build` đạt **0 lỗi**.





