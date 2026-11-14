# 02. Kiến Trúc & Cấu Trúc Các Phần — Tơ Duyên Đỏ Đậm

> **Reference Link:** [https://chungdoi.com/vi/mau-thiep/to-duyen-do-dam/demo](https://chungdoi.com/vi/mau-thiep/to-duyen-do-dam/demo)

---

## 1. Màn Hình Bì Thư Mở Đầu (Cover Screen - `?open=0`)

- **Nền:** Màu đỏ rượu vang `#931434` với dải lụa mềm thắt nơ ở giữa (`ribbon-decoration.webp`).
- **Nội dung:**
  - Tiêu đề nhỏ: `THE WEDDING OF` hoặc `THIỆP CƯỚI TƠ DUYÊN`.
  - Tên cô dâu chú rể: **Phạm Minh Hoàng & Hồ Mỹ Ngọc** (Font `The Nautigal` mềm mại).
  - Ngày cưới: `28 . 11 . 2026`.
  - Lời mời: `Trân trọng kính mời: Quý Khách`.
  - Nút bấm: **MỞ THIỆP** (Nền trắng kem `#FEFBF4`, chữ đỏ thẫm `#460011`, viền lụa nhung).

---

## 2. Các Khối Nội Dung Chính Khi Mở Thiệp (`?open=1`)

### Phần 1: Khung Chân Dung Cặp Đôi (Hero Banner)
- Ảnh cưới của Minh Hoàng & Mỹ Ngọc đóng khung viền lụa uốn cong mềm mại.
- Câu châm ngôn tình yêu: *"Tơ duyên ngàn dặm gặp nhau, trọn đời kết nghĩa keo sơn."*

### Phần 2: Giới Thiệu Chú Rể & Cô Dâu
- **Chú Rể: Phạm Minh Hoàng**
  - Con trai của Ông/Bà...
  - Ảnh đại diện hình tròn hoặc oval viền đỏ mận.
- **Cô Dâu: Hồ Mỹ Ngọc**
  - Con gái của Ông/Bà...
  - Ảnh đại diện hình tròn hoặc oval viền đỏ mận.

### Phần 3: Thông Tin Hôn Lễ & Tiệc Cưới
- **Lễ Gia Tiên:** Tư gia nhà trai/gái, thời gian giờ hoàng đạo.
- **Tiệc Cưới:** Trung tâm hội nghị tiệc cưới lãng mạn.
  - Tích hợp nút **Xem Bản Đồ Google Maps** & **Lưu Lịch Google Calendar**.

### Phần 4: Đồng Hồ Đếm Ngược (Countdown)
- 4 ô đếm: Ngày - Giờ - Phút - Giây trên nền thẻ kính mờ `rgba(255, 255, 255, 0.1)`.

### Phần 5: Lịch Trình Chi Tiết
- Các mốc thời gian kèm icon nến, hoa, nhẫn, rượu vang:
  - `17:30`: Đón khách & tiệc trà nhẹ
  - `18:30`: Nghi thức thành hôn & Trao nhẫn
  - `19:00`: Khai tiệc & Nâng ly chúc phúc
  - `20:00`: Cắt bánh & Điệu nhảy đầu tiên
  - `21:30`: Tiễn khách

### Phần 6: Dress Code
- Bảng màu trang phục đề xuất:
  - Đỏ rượu vang (`#931434`)
  - Màu be kem (`#FEFBF4`)
  - Hồng tro (`#752E3F`)
  - Đen thanh lịch (`#1A1A1A`)

### Phần 7: Album Ảnh Cưới (Photo Gallery)
- Lưới ảnh 2 cột xen kẽ phong cách editorial lãng mạn.

### Phần 8: Hộp Quà Mừng & VietQR
- Thẻ chuyển khoản cho Chú Rể Minh Hoàng và Cô Dâu Mỹ Ngọc kèm tính năng 1-chạm sao chép số tài khoản và quét mã VietQR.

### Phần 9: Sổ Lưu Bút
- Form gửi lời chúc trực tiếp và bảng hiển thị lời chúc của bạn bè.

