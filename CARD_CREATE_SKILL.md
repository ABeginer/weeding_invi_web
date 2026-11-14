# CARD_CREATE_SKILL.md: Hướng Dẫn & Kinh Nghiệm Phát Triển Mẫu Thiệp Cưới Độc Bản (Wedding Invitation Templates)

Tài liệu này đúc kết toàn bộ kinh nghiệm thực tế, quy chuẩn kiến trúc và checklist chi tiết khi thiết kế, tạo mới hoặc nâng cấp mẫu thiệp cưới (wedding card/template) theo chuẩn cao cấp, mang lại trải nghiệm thị giác khác biệt và phong cách riêng biệt cho từng cặp đôi.

---

## 1. Tổng quan Kiến trúc Mẫu Thiệp (Template Architecture)

Hệ thống thiệp cưới được tổ chức theo kiến trúc module hóa:
```
templates/
├── themed/                              # Hệ thống theme cấu hình độc bản
│   ├── ThemedTemplate.tsx               # Container & orchestration chính
│   ├── ThemedHero.tsx                   # 7 biến thể Hero Layout độc bản
│   ├── ThemedFamily.tsx                 # Khối thông tin hai bên gia đình (Nhà Trai & Nhà Gái)
│   ├── ThemedCalendar.tsx               # Lịch cưới mini trực quan theo tháng & Đếm ngược
│   ├── ThemedDressCode.tsx              # Bảng màu trang phục gợi ý (Dress Code swatches)
│   ├── ThemeMotif.tsx                   # Biểu tượng vector đặc trưng từng phong cách
│   └── theme-configs.ts                 # Cấu hình toàn bộ màu sắc, typography, wax seal, hạt rơi
├── shared/                              # Các block tiện ích tương tác dùng chung
│   ├── TemplateGiftSection.tsx          # Hộp mừng cưới & VietQR
│   ├── TemplateRsvpSection.tsx          # Biểu mẫu xác nhận tham dự & sổ lưu bút
│   ├── LiveMusicFloatingButton.tsx      # Nút điều khiển âm nhạc nền nổi
│   ├── TemplateOverlays.tsx             # Modal phóng to album ảnh (Lightbox)
│   └── useCountdown.ts                  # Hook đếm ngược thời gian thực
├── registry.ts                          # Danh mục metadata mẫu thiệp toàn hệ thống
└── types.ts                             # Định nghĩa kiểu dữ liệu & interfaces
```

---

## 2. Kiến Trúc Màn Hình Bì Thư Hoàng Gia (Cover & Envelope Architecture)

Màn hình bì thư là ấn tượng đầu tiên khi khách mở thiệp. Để đạt tiêu chuẩn cao cấp như thiệp giấy thật, bì thư tích hợp 4 yếu tố cốt lõi:

### 2.1. Hạt Rơi Ambient Sinh Động (Floating Particles)
- Sử dụng CSS keyframes `@keyframes ambient-fall` kết hợp biến `--sway` để hạt rơi có độ đung đưa theo gió tự nhiên.
- Tạo sẵn mảng 12 hạt với vị trí ngang (`left`), thời gian trễ (`delay`), chu kỳ (`duration`) và độ lắc (`sway`) định trước (deterministic) nhằm tránh lỗi Hydration Mismatch giữa SSR và Client.
- Hạt rơi biến hóa theo từng chủ đề:
  - `🌸` Hoa anh đào (Anh Đào Hồng)
  - `🍃` Nhành lá non (Vườn Xuân Xanh)
  - `✦` / `✨` Ánh kim lấp lánh (Hoàng Kim Đỏ, Bạch Sứ Đỏ)
  - `🏮` / `囍` Lồng đèn & Song hỷ (Chibi Red)
  - `🌺` Hoa hồng tình yêu (Tơ Duyên Hồng)
  - `🏺` Họa tiết gốm cổ (Bạch Sứ Nâu)
  - `🌿` Cành lá thảo mộc (Vườn Kính Xanh Nhạt, Mai Lan Xanh)

### 2.2. Con Dấu Xi Sáp 3D Hoàng Gia (Embossed 3D Wax Seal)
- Đường kính: `56px x 56px`, bo tròn tuyệt đối.
- Hiệu ứng chiều sâu đa lớp:
  - Mặt ngoài: `radial-gradient(circle at 35% 35%, ...)` tạo điểm sáng bóng ở góc trên bên trái.
  - Đổ bóng thực: Kết hợp `box-shadow` bên ngoài để nổi khỏi bì thư và `inset 0 2px 3px rgba(255,255,255,0.5)`, `inset 0 -3px 6px rgba(0,0,0,0.45)` để tạo gờ viền xi sáp dập khuôn thật.
  - Hiệu ứng thở: `.animate-seal-pulse-center` co giãn nhẹ nhàng từ `scale(1)` đến `scale(1.06)` theo nhịp 2.2s.
  - Icon trung tâm: Monogram hoàng gia hoặc biểu tượng trái tim / song hỷ bằng SVG dập nổi sắc nét.

### 2.3. Đường Kẻ Hoa Văn Phân Cách (Flourish Divider)
- Sử dụng dải gradient hai đầu mờ dần: `bg-gradient-to-r from-transparent via-[accent] to-transparent` điểm xuyết ký tự cổ điển `❦` ở chính giữa.

### 2.4. Nút "Mở Thiệp" Ánh Kim (Metallic Shine Sweep Button)
- Nút bấm bo tròn tràn viền, trang bị lớp phủ ánh kim `animate-shine-sweep`: một vệt sáng gradient trắng `opacity-35` quét liên tục qua bề mặt nút mỗi 3 giây, tạo cảm giác sang trọng như giấy ép kim Foil Stamp.

---

## 3. Hệ Thống 7 Hero Layouts Độc Bản (7 Authentic Hero Layouts)

Không sử dụng một khuôn mẫu chung cho tất cả các thiệp. Tùy theo phong cách nghệ thuật, template áp dụng 1 trong 7 kiến trúc Hero:

| Hero Layout Type | Mẫu Áp Dụng | Đặc Trưng Thiết Kế |
| :--- | :--- | :--- |
| **`tilted-polaroid`** | Anh Đào Hồng | Khung ảnh Polaroid nghiêng `rotate-[6deg] sm:rotate-[8.5deg]` chân thực trên nền trắng, có chú thích viết tay *"Forever & Always"*, chữ thư pháp watermark khổ lớn phía sau. |
| **`arch-gold`** | Hoàng Kim Đỏ, Vườn Xuân Đỏ | Vòm hoàng gia viền đôi thếp vàng `#C8A951`, vương miện hoàng gia lấp lánh, tone nền đỏ thẫm quý tộc `#3E0001` sang trọng. |
| **`editorial-noir`** | Ren Thêu Trắng | Phong cách bìa tạp chí Haute Couture thời thượng, viền đôi ren đăng ten trắng, ảnh tương phản cao, dòng chữ `EST. 2026 · HAUTE COUTURE INVITATION` tối giản tinh tế. |
| **`botanical-arch`** | Vườn Xuân Xanh, Vườn Kính, Mai Lan | Khung vòm thiên nhiên mềm mại kết hợp nhành nguyệt quế `🌿 Our Secret Garden 🌿` và phông chữ uốn lượn Pinyon Script. |
| **`porcelain-ornate`** | Bạch Sứ Nâu, Bạch Sứ Đỏ, Hoa Mộc Nâu | Khung gốm sứ hoa văn với 4 góc họa tiết chạm khắc cổ `⌜ ⌝ ⌞ ⌟`, đường viền chỉ đôi thanh nhã như gạch men cung đình. |
| **`playful-chibi`** | Chibi Red | Nền kem `#FEF0E0` ấm áp, khung bo tròn thân thiện, huy hiệu Song Hỷ `囍` dập nổi viền vàng rực rỡ, phông chữ tươi vui Viaoda Libre. |
| **`classic-romance`** | Tơ Duyên Hồng, Song Phụng Xanh | Khung chữ nhật viền mềm mại, bóng đổ lãng mạn, phân cách hoa văn uyển chuyển và phông chữ bay bổng Carattere. |

---

## 4. Các Khối Chức Năng Bắt Buộc Trên Thiệp Mở (Card Sections)

### 4.1. Thông Tin Hai Bên Gia Đình (ThemedFamily)
- Trân trọng báo tin Lễ Thành Hôn.
- Phân chia cân xứng hai cột: **Nhà Trai** (Thân sinh phụ mẫu + Chú Rể / Trưởng Nam) và **Nhà Gái** (Thân sinh phụ mẫu + Cô Dâu / Ái Nữ).
- Tên cô dâu chú rể hiển thị bằng phông thư pháp nghệ thuật (`theme.coupleFontFamily`).

### 4.2. Lịch Cưới Mini Trực Quan & Đếm Ngược (ThemedCalendar)
- Tự động tính toán ma trận lịch 7 cột (`T2` đến `CN`) của đúng tháng cử hành hôn lễ.
- Khoanh tròn nổi bật ngày cưới bằng huy hiệu tròn mang màu điểm nhấn (`theme.buttonBg`) kèm biểu tượng trái tim `❤`.
- Bảng đếm ngược 4 khối thời gian thực: Ngày · Giờ · Phút · Giây.

### 4.3. Quy Định Trang Phục (ThemedDressCode)
- Cung cấp dải màu sắc (swatches) hình tròn có hiệu ứng phóng to khi hover.
- Hiển thị nhãn tên màu chuẩn xác (ví dụ: *Trắng Tinh Khôi*, *Be Nhã Nhặn*, *Vàng Đồng*, *Hồng Pastel*, *Đỏ Rượu Vang*).

### 4.4. Lịch Trình Sự Kiện, Kỷ Niệm & Mừng Cưới
- Sự kiện cưới kèm nút chỉ đường Google Maps (`evt.mapDirectionsUrl`).
- Album ảnh cưới với modal xem ảnh phóng to không làm giật trang.
- Hộp mừng cưới tích hợp VietQR chuyển khoản thông minh và sổ lưu bút điện tử (RSVP).

---

## 5. Quy Chuẩn Kỹ Thuật & Tối Ưu Hiệu Năng (Engineering Best Practices)

1. **CSS Imports Ordering**:
   - Quy tắc CSS bắt buộc `@import url(...)` cho các Google Fonts phải nằm ở dòng đầu tiên của `app/globals.css`, trước `@import "tailwindcss";` để tránh cảnh báo CSS optimization của Turbopack.
2. **Mobile Layout Stability (Zero Horizontal Scroll)**:
   - Toàn bộ container cha bắt buộc có `overflow-x-hidden`.
   - Các phần tử nghiêng (như khung Polaroid `rotate-[8.5deg]`) phải có lề an toàn để không tạo thanh cuộn ngang trên điện thoại màn hình hẹp (360px - 390px).
3. **Phông Chữ Tiếng Việt Chuẩn**:
   - Các phông chữ tiêu đề và tên cặp đôi được khai báo rõ ràng trong Google Fonts (`display=swap`):
     - `The Nautigal` (Thư pháp bay bổng hiện đại)
     - `Pinyon Script` (Thư pháp quý tộc thanh mảnh)
     - `Alex Brush` (Chữ viết tay lãng mạn)
     - `Carattere` (Nét vẽ mềm mại uyển chuyển)
     - `Playfair Display` (Serif cổ điển sang trọng)
     - `Viaoda Libre` (Nét chữ đậm đà hoài niệm)
     - `EB Garamond` (Chữ in phong cách học viện châu Âu)
4. **Kiểm Thử Trước Khi Bàn Giao**:
   - `npx tsc --noEmit` đạt mã thoát 0 (Zero type errors).
   - `npm run lint` đạt 0 warnings, 0 errors.
   - `npm run build` hoàn tất tối ưu hóa toàn bộ các route động và tĩnh.
