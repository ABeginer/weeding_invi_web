# 03. Thông Số Kỹ Thuật & Tương Tác (Interactions & Tech Spec)

Tài liệu này hướng dẫn chi tiết cách hiện thực hóa các tính năng tương tác độc đáo của mẫu thiệp `Song Hỷ v2 Đỏ`.

---

## 1. Cơ Chế Mở Bì Thư & Tự Động Phát Nhạc (Audio Autoplay Bypass)

### Vấn đề:
Các trình duyệt trên iOS (Safari) và Android (Chrome) đều chặn phát âm thanh tự động (`autoplay`) nếu người dùng chưa tương tác với trang web.

### Giải pháp kỹ thuật của ChungDoi:
1. Ban đầu tải trang ở trạng thái `open=0` (hiển thị bì thư Cover phủ toàn màn hình `fixed inset-0 z-50`).
2. Khách bắt buộc phải ấn vào nút **"MỞ THIỆP"** để xem nội dung.
3. Sự kiện click này là một User Gesture hợp lệ. Ngay trong hàm xử lý click:
   - Gọi `audioElement.play()`.
   - Bắt đầu xoay icon đĩa nhạc ở góc dưới màn hình.
   - Kích hoạt animation trượt màn hình bì thư mờ dần (`opacity: 0`, `pointer-events: none`).

```javascript
const openBtn = document.getElementById('openInvitationBtn');
const coverOverlay = document.getElementById('coverOverlay');
const bgm = document.getElementById('weddingBgm');
const musicDisc = document.getElementById('musicDisc');

openBtn.addEventListener('click', () => {
  // 1. Phát nhạc nền
  bgm.play().then(() => {
    musicDisc.classList.add('animate-spin');
  }).catch(err => console.log('Autoplay blocked:', err));

  // 2. Ẩn màn hình phong bì mượt mà
  coverOverlay.classList.add('transition-opacity', 'duration-700', 'opacity-0');
  setTimeout(() => {
    coverOverlay.style.display = 'none';
  }, 750);
});
```

---

## 2. Nút Bật/Tắt Nhạc Trôi Nổi (Floating Music Player)

- **Vị trí:** Góc dưới bên phải màn hình (`fixed bottom-5 right-5 z-40`).
- **Hình thức:** Đĩa nhạc tròn viền vàng viền đỏ, có biểu tượng nốt nhạc quay đều (CSS `transform: rotate(360deg)`).
- **Hành vi:**
  - Nhấp lần 1: Tạm dừng nhạc (`pause`), dừng xoay đĩa.
  - Nhấp lần 2: Tiếp tục phát (`play`), đĩa xoay tiếp.

---

## 3. Sinh Mã VietQR Tự Động Chuẩn Napas 247

Để khách quét mã chuyển tiền mừng không cần nhập tay thông tin tài khoản:

### Cú pháp API VietQR miễn phí (Quick Link):
```
https://img.vietqr.io/image/<BANK_BIN>-<ACCOUNT_NO>-compact2.jpg?amount=0&addInfo=<NOI_DUNG>&accountName=<TEN_CHU_TK>
```

### Ví dụ thực tế:
- Ngân hàng Vietcombank (Mã BIN: `970436` hoặc viết tắt `VCB`)
- Số tài khoản: `0011004321999`
- Tên chủ tài khoản: `NGUYEN TRUNG HIEU`
- Nội dung: `Mung cuoi Trung Hieu Thanh Ha`

**URL ảnh QR sinh ra:**
```html
<img src="https://img.vietqr.io/image/vcb-0011004321999-compact2.jpg?accountName=NGUYEN%20TRUNG%20HIEU&addInfo=Mung%20cuoi%20Trung%20Hieu%20Thanh%20Ha" alt="VietQR Mừng Cưới" />
```

---

## 4. Tính Năng "Sao Chép Số Tài Khoản" 1 Chạm (Copy to Clipboard)

Khi khách bấm nút "Sao chép STK", hệ thống sao chép vào bộ nhớ đệm và hiển thị thông báo Toast:

```javascript
function copyAccountNumber(accountNumber) {
  navigator.clipboard.writeText(accountNumber).then(() => {
    showToast('Đã sao chép số tài khoản: ' + accountNumber);
  }).catch(() => {
    // Fallback cho trình duyệt cũ
    const tempInput = document.createElement('input');
    tempInput.value = accountNumber;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast('Đã sao chép số tài khoản: ' + accountNumber);
  });
}
```

---

## 5. Tích Hợp "Thêm Vào Google Calendar"

Cho phép khách mời chỉ cần bấm nút là lịch cưới được lưu ngay vào điện thoại, có chuông nhắc trước ngày cưới:

```javascript
function addToGoogleCalendar() {
  const event = {
    title: 'Tiệc Cưới Trung Hiếu & Thanh Hà',
    start: '20270104T103000Z', // Định dạng UTC YYYYMMDDTHHmmssZ
    end: '20270104T150000Z',
    details: 'Trân trọng kính mời bạn đến tham dự tiệc cưới của Trung Hiếu & Thanh Hà tại Sen Vang Palace.',
    location: 'Sen Vang Palace, Phú Thọ'
  };

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.details)}&location=${encodeURIComponent(event.location)}`;
  window.open(url, '_blank');
}
```

---

## 6. Sổ Lưu Bút Tương Tác (Real-time / Local Storage)

Form gửi lời chúc lưu lại vào bộ nhớ trình duyệt (hoặc gửi về Google Sheets / Database Firebase):

```javascript
const wishForm = document.getElementById('wishForm');
const wishList = document.getElementById('wishList');

wishForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('senderName').value.trim();
  const message = document.getElementById('senderMessage').value.trim();

  if (!name || !message) return;

  const card = document.createElement('div');
  card.className = 'p-4 rounded-xl bg-white/10 border border-[#FFE8A4]/30 backdrop-blur-sm text-left mb-3';
  card.innerHTML = `
    <div class="flex items-center justify-between mb-1">
      <span class="font-medium text-[#FFE8A4] text-sm">${escapeHtml(name)}</span>
      <span class="text-[11px] text-[#FFF9E6]/60">Vừa xong</span>
    </div>
    <p class="text-xs text-[#FFF9E6]/90 leading-relaxed">${escapeHtml(message)}</p>
  `;

  wishList.prepend(card);
  wishForm.reset();
  showToast('Cảm ơn lời chúc thân thương của bạn!');
});
```

