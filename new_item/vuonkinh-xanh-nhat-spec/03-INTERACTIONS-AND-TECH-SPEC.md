# 03. Thông Số Kỹ Thuật & Tương Tác — Vườn Kính Xanh Nhạt

> **Reference Link:** [https://chungdoi.com/vi/mau-thiep/vuonkinh-xanh-nhat/demo](https://chungdoi.com/vi/mau-thiep/vuonkinh-xanh-nhat/demo)

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
<img src="https://img.vietqr.io/image/vcb-0011009988776-compact2.jpg?accountName=MINH TUẤN%20VA%20LAN ANH&addInfo=Mung%20cuoi%20vuonkinh-xanh-nhat" alt="VietQR Mừng Cưới" />
```

---

## 3. Liên Kết Lịch Google Calendar

```javascript
function addToCalendar() {
  const title = 'Tiệc Cưới Minh Tuấn & Lan Anh';
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&location=${encodeURIComponent('Le Jardin Serre Đà Lạt')}`;
  window.open(url, '_blank');
}
```
