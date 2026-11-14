# 03. Thông Số Kỹ Thuật & Tương Tác — Tơ Duyên Đỏ Đậm

> **Reference Link:** [https://chungdoi.com/vi/mau-thiep/to-duyen-do-dam/demo](https://chungdoi.com/vi/mau-thiep/to-duyen-do-dam/demo)

---

## 1. Hiệu Ứng Mở Bì Thư Lụa Đỏ & Tự Động Bật Nhạc

Khi bấm nút **"MỞ THIỆP"**, màn hình phong bì mờ dần và trượt lên trên đồng thời kích hoạt phát bài nhạc cưới giao hưởng du dương:

```javascript
const openBtn = document.getElementById('openInvitationBtn');
const coverOverlay = document.getElementById('coverOverlay');
const bgm = document.getElementById('weddingBgm');
const musicDisc = document.getElementById('musicDisc');

openBtn.addEventListener('click', () => {
  bgm.play().then(() => {
    musicDisc.classList.remove('spin-paused');
  }).catch(err => console.log('Audio autoplay blocked:', err));

  coverOverlay.classList.add('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    coverOverlay.style.display = 'none';
  }, 800);
});
```

---

## 2. Tạo Mã VietQR Chuẩn Cho Mẫu Tơ Duyên Đỏ Đậm

URL sinh mã VietQR tự động không cần qua server backend:

```html
<!-- VietQR Chú Rể -->
<img src="https://img.vietqr.io/image/vcb-0071001234567-compact2.jpg?accountName=PHAM%20MINH%20HOANG&addInfo=Mung%20cuoi%20Minh%20Hoang" alt="VietQR Chú Rể" />

<!-- VietQR Cô Dâu -->
<img src="https://img.vietqr.io/image/techcombank-19034567891011-compact2.jpg?accountName=HO%20MY%20NGOC&addInfo=Mung%20cuoi%20My%20Ngoc" alt="VietQR Cô Dâu" />
```

---

## 3. Tương Tác Nút Lưu Lịch (Add to Calendar)
Tạo sự kiện lịch Google Calendar cho đám cưới ngày 28/11/2026:

```javascript
function addToCalendar() {
  const title = 'Tiệc Cưới Minh Hoàng & Mỹ Ngọc';
  const start = '20261128T103000Z';
  const end = '20261128T150000Z';
  const details = 'Kính mời bạn tới tham dự hôn lễ của Minh Hoàng & Mỹ Ngọc.';
  const location = 'Trung Tâm Tiệc Cưới Riverside Palace, TP.HCM';
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  window.open(url, '_blank');
}
```

