# 03. Thông Số Kỹ Thuật & Tương Tác — Vườn Kính Xanh

> **Reference Link:** [https://chungdoi.com/vi/mau-thiep/vuonkinh-xanh/demo](https://chungdoi.com/vi/mau-thiep/vuonkinh-xanh/demo)

---

## 1. Mở Bì Thư & Autoplay Bản Nhạc Acoustic Sân Vườn

Hiệu ứng mở bì thư xanh mát kích hoạt bài hát cưới phong cách Acoustic / Piano dịu êm:

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

## 2. Mã VietQR Chuyển Khoản Mừng Cưới

Tạo URL VietQR trực tiếp với màu nền sáng sạch sẽ:

```html
<!-- Chú Rể: Trần Quang Huy -->
<img src="https://img.vietqr.io/image/mbbank-0912345678-compact2.jpg?accountName=TRAN%20QUANG%20HUY&addInfo=Mung%20cuoi%20Quang%20Huy" alt="VietQR Chú Rể" />

<!-- Cô Dâu: Lê Thảo Vy -->
<img src="https://img.vietqr.io/image/vcb-0441000123999-compact2.jpg?accountName=LE%20THAO%20VY&addInfo=Mung%20cuoi%20Thao%20Vy" alt="VietQR Cô Dâu" />
```

---

## 3. Tạo Hiệu Ứng Kính Mờ (Glassmorphism) Bằng CSS

Đặc trưng cốt lõi của mẫu Vườn Kính là các thẻ kính mờ trên nền hoa lá tự nhiên:

```css
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 32px 0 rgba(53, 69, 47, 0.25);
}
```

