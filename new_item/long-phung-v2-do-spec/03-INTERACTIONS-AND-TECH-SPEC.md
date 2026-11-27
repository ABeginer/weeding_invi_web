# 03. Thông Số Kỹ Thuật & Tương Tác — Long Phụng v2 Đỏ

> **Reference Link:** [https://chungdoi.com/vi/mau-thiep/long-phung-v2-do/demo](https://chungdoi.com/vi/mau-thiep/long-phung-v2-do/demo)

---

## 1. Mở Bì Thư & Tự Động Kích Hoạt Nhạc Cưới Truyền Thống

Sự kiện bấm nút "MỞ THIỆP" đóng vai trò là tương tác hợp lệ của người dùng để mở khóa autoplay nhạc nền trên di động:

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

## 2. Mã VietQR Chuyển Khoản Mừng Cưới Tự Động

Tạo URL VietQR trực tiếp:

```html
<!-- Chú Rể: Trần Trung Hiếu -->
<img src="https://img.vietqr.io/image/vcb-0011009876543-compact2.jpg?accountName=TRAN%20TRUNG%20HIEU&addInfo=Mung%20cuoi%20Trung%20Hieu" alt="VietQR Chú Rể" />

<!-- Cô Dâu: Lê Minh Nguyệt -->
<img src="https://img.vietqr.io/image/tpb-03399887766-compact2.jpg?accountName=LE%20MINH%20NGUYet&addInfo=Mung%20cuoi%20Minh%20Nguyet" alt="VietQR Cô Dâu" />
```

---

## 3. Đồng Hồ Đếm Ngược Hoàng Gia

Script tính toán khoảng cách thời gian chính xác tới ngày hôn lễ và tự động định dạng `00`:

```javascript
function updateCountdown(targetDateStr) {
  const target = new Date(targetDateStr).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff > 0) {
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('days').innerText = String(d).padStart(2, '0');
    document.getElementById('hours').innerText = String(h).padStart(2, '0');
    document.getElementById('minutes').innerText = String(m).padStart(2, '0');
    document.getElementById('seconds').innerText = String(s).padStart(2, '0');
  }
}
```

