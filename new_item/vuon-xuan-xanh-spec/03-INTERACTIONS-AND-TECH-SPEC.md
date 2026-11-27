# 03. Thông Số Kỹ Thuật & Tương Tác — Vườn Xuân Xanh

> **Reference Link:** [https://chungdoi.com/vi/mau-thiep/vuon-xuan-xanh/demo](https://chungdoi.com/vi/mau-thiep/vuon-xuan-xanh/demo)

---

## 1. Kỹ Thuật Mở Bì Thư & Tự Động Phát Nhạc

```javascript
const openBtn = document.getElementById('openInvitationBtn');
const coverOverlay = document.getElementById('coverOverlay');
const bgm = document.getElementById('weddingBgm');
const musicDisc = document.getElementById('musicDisc');

openBtn.addEventListener('click', () => {
  bgm.play().then(() => {
    musicDisc.classList.remove('spin-paused');
  }).catch(err => console.log('Autoplay bypass:', err));

  coverOverlay.classList.add('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    coverOverlay.style.display = 'none';
  }, 750);
});
```

---

## 2. Sinh Mã VietQR Chuyển Khoản Mừng Cưới

```html
<img src="https://img.vietqr.io/image/vcb-0011009988776-compact2.jpg?accountName=THANH TÙNG%20VA%20MAI CHI&addInfo=Mung%20cuoi%20vuon-xuan-xanh" alt="VietQR Mừng Cưới" />
```

---

## 3. Liên Kết Lịch Google Calendar

```javascript
function addToCalendar() {
  const title = 'Tiệc Cưới Thanh Tùng & Mai Chi';
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&location=${encodeURIComponent('Khu Nghỉ Dưỡng Sân Vườn Green Eden')}`;
  window.open(url, '_blank');
}
```
