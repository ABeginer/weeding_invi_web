# 02. Kiến Trúc & Các Phần Của Thiệp (Architecture & Sections)

Mẫu thiệp `Song Hỷ v2 Đỏ` gồm 2 giai đoạn trải nghiệm (2 Phases):
- **Giai đoạn 1:** Màn hình bao thư / phong bì cưới khóa màn hình (`?open=0`).
- **Giai đoạn 2:** Màn hình thiệp chi tiết mở ra sau khi bấm nút (`?open=1`).

---

## Giai Đoạn 1: Màn Hình Mở Đầu (Cover / Virtual Envelope)

```
┌──────────────────────────────────────────────┐
│                  [Họa tiết mây]              │
│                                              │
│                     囍                       │
│             (Chữ Song Hỷ Vàng Kim)           │
│                                              │
│                   Trung Hiếu                 │
│                       &                      │
│                    Thanh Hà                  │
│                                              │
│                  ─── ❦ ───                   │
│                                              │
│               4 THÁNG 1, 2027                │
│                                              │
│                  THÂN MỜI                    │
│                                              │
│              ┌──────────────┐                │
│              │   MỞ THIỆP   │                │
│              └──────────────┘                │
│                                              │
│         *Chạm để mở và nghe nhạc             │
└──────────────────────────────────────────────┘
```

### Chi tiết các thành phần:
1. **Background phong bì:** Màu đỏ thẫm `#920002` phủ texture vân mây hoặc hoa mẫu đơn mờ.
2. **Huy hiệu Song Hỷ:** Kích thước ~60px × 60px, màu nhũ vàng `#FFE8A4`.
3. **Tên cặp đôi:** Font `Carattere`, kích thước 36px - 44px.
4. **Ký tự phân cách:** `❦` (Floral Heart Glyph) đặt giữa hai vạch kẻ gradient vàng mảnh.
5. **Dòng ngày tháng & Lời mời:** "4 tháng 1, 2027" | "Thân Mời: Quý Khách".
6. **Nút "MỞ THIỆP":**
   - Background: `#FFE8A4`
   - Chữ: `#8C0000`, font `Lora`, in hoa, in đậm nhẹ.
   - Hiệu ứng: Đổ bóng vàng `box-shadow: 0 4px 14px rgba(255, 232, 164, 0.35)`.
   - Hành động khi bấm: Màn hình cover trượt lên / mờ dần trong 0.8s, kích hoạt âm thanh nhạc cưới phát tự động.

---

## Giai Đoạn 2: Nội Dung Chi Tiết (Main Card Content)

### 1. Hero Section (Phần Đầu Thiệp Mở Ra)
- **Ảnh đại diện cặp đôi:** Ảnh cưới đặt trong khung vòm cong truyền thống (Arch Shape) với viền chỉ vàng.
- **Tiêu đề thư ngỏ:** "Lời Mời Từ Trái Tim" hoặc "Lễ Thành Hôn".
- **Thông điệp mở đầu:** Trích dẫn câu thơ cưới hoặc thông điệp tri ân gia đình hai bên.

### 2. Thông Tin Hai Bên Gia Đình & Cô Dâu Chú Rể
- Chia làm 2 khối thẻ sang trọng viền vàng mỏng:
  - **Nhà Trai (Groom's Family):**
    - Ông bà thân sinh chú rể (Ông: ... & Bà: ...).
    - Danh xưng chú rể: "Trưởng Nam: Nguyễn Trung Hiếu".
    - Ảnh chân dung chú rể kèm icon liên hệ.
  - **Nhà Gái (Bride's Family):**
    - Ông bà thân sinh cô dâu (Ông: ... & Bà: ...).
    - Danh xưng cô dâu: "Ái Nữ: Trần Thanh Hà".
    - Ảnh chân dung cô dâu kèm icon liên hệ.

### 3. Thông Tin Lễ Cưới & Tiệc Cưới (Ceremony & Reception)
- **Thẻ 1: Lễ Gia Tiên / Lễ Thành Hôn:**
  - Thời gian: Giờ hoàng đạo (e.g. 10:00 Sáng), ngày Dương lịch & ngày Âm lịch (e.g. Ngày 27 tháng 11 năm Bính Ngọ).
  - Địa điểm: Tư gia Nhà Trai / Nhà Gái.
- **Thẻ 2: Tiệc Cưới (Reception):**
  - Tên trung tâm tiệc cưới: (e.g. "Sen Vang Palace, Phú Thọ").
  - Thời gian đón khách & khai tiệc: "17:30 THỨ HAI, 04/01/2027".
  - **2 Nút tương tác chính:**
    - Nút 1: `Chỉ Đường / Xem Bản Đồ` (Mở Google Maps chỉ dẫn vị trí chính xác).
    - Nút 2: `Thêm Vào Lịch` (Tạo sự kiện trên Google Calendar nhắc nhở khách).

### 4. Đồng Hồ Đếm Ngược (Countdown Timer)
- Tiêu đề: "Cùng đếm ngược khoảnh khắc hạnh phúc".
- 4 ô đếm: `Ngày` (Days) - `Giờ` (Hours) - `Phút` (Mins) - `Giây` (Secs).
- Nền ô số: Nền đỏ đậm viền vàng nhạt hoặc kính mờ trong suốt.

### 5. Lịch Trình Ngày Cưới (Wedding Timeline)
Liệt kê mốc thời gian sự kiện theo thứ tự trục dọc với icon minh họa:
- `13:30`: Lễ gia tiên tại nhà gái
- `15:00`: Đón dâu
- `16:30`: Lễ gia tiên tại nhà trai
- `17:30`: Đón tiếp quý khách (Welcome Drink & Chụp ảnh lưu niệm)
- `18:00`: Nghi thức thành hôn & Trao nhẫn cưới
- `18:30`: Rót rượu giao bôi & Cắt bánh hạnh phúc
- `19:00`: Khai tiệc mừng tân hôn
- `20:00`: Cô dâu chú rể chúc rượu từng bàn
- `21:30`: Kết thúc tiệc & Tiễn khách

### 6. Dress Code (Trang Phục Gợi Ý)
- Tiêu đề: "DRESS CODE".
- Hướng dẫn: "Để có những bức ảnh kỷ niệm đồng điệu và đẹp nhất, quý khách có thể ưu tiên các tông màu sau:".
- Các ô màu tròn:
  - Đỏ truyền thống (`#920002`)
  - Vàng be / Champagne (`#FFE8A4`)
  - Trắng kem (`#FFF9E6`)
  - Nâu cafe / Đen lịch lãm (`#2F2A26`)

### 7. Album Ảnh Cưới (Photo Gallery)
- Bộ sưu tập 6 – 12 ảnh cưới đẹp nhất.
- Bố cục dạng lưới so le (Masonry grid) hoặc dạng Carousel vuốt trượt ngang.
- Khi chạm vào ảnh sẽ phóng to toàn màn hình (Lightbox).

### 8. Hộp Quà Mừng (Digital Lucky Money / VietQR)
- Giúp khách ở xa không thể tham dự hoặc khách trẻ không mang phong bì gửi tiền mừng dễ dàng.
- Gồm 2 tab hoặc 2 thẻ riêng biệt:
  - **Mừng Chú Rể:** Tên ngân hàng (e.g. Vietcombank / MBBank), Số tài khoản, Tên chủ tài khoản, Nút bấm "Sao Chép STK", Ảnh mã VietQR thanh toán 1 chạm.
  - **Mừng Cô Dâu:** Tên ngân hàng, Số tài khoản, Tên chủ tài khoản, Nút bấm "Sao Chép STK", Ảnh mã VietQR thanh toán 1 chạm.

### 9. Sổ Lưu Bút & Gửi Lời Chúc (Guestbook)
- Form nhập:
  - Ô nhập Họ tên người gửi.
  - Ô nhập Lời chúc (Chúc mừng hạnh phúc hai bạn...).
  - Nút bấm "GỬI LỜI CHÚC".
- Danh sách lời chúc hiển thị bên dưới với tên người gửi, thời gian và lời chúc ấm áp.

### 10. Chân Trang (Footer)
- Ký tên cặp đôi: "Trung Hiếu & Thanh Hà".
- Lời cảm ơn: "Rất hân hạnh được đón tiếp Quý Khách!".

