---
name: card-design
description: Use when designing or reviewing wedding invitation card templates for Inviwedd (colour systems, font pairings, layout archetypes, canvas JSON recipes, print/DOM QA) before building them in /ops/designer.
version: 1.0.0
---

# card_design — thiết kế thiệp cưới cho Inviwedd

Mục tiêu: tạo mẫu **gốc**, sang, đọc tốt trên điện thoại, dựng được bằng element kéo thả
trong `/ops/designer`. Tài liệu tham khảo bên ngoài chỉ dùng để lấy ý tưởng về bảng màu,
cặp font và nhịp bố cục — không sao chép hình ảnh, font file hay layout cụ thể.

## 1. Hệ màu (chọn 1 nền + 1 mực + 1 nhấn + 1 phụ)

| Nhóm cảm xúc | Nền | Mực | Nhấn | Phụ |
|---|---|---|---|---|
| Hồng đào / lãng mạn | `#FAF3F0` | `#5A2B33` | `#B87D74` | `#F0DBD4` |
| Lục vườn / thanh lịch | `#F3EFE6` | `#2C3A2C` | `#4A5D4E` | `#DCE3D8` |
| Kim hoàng / sang trọng | `#FBF4E4` | `#4A3416` | `#C5A059` | `#EFE4CE` |
| Ren trắng / tối giản | `#FBFAF7` | `#2C2523` | `#A99A86` | `#EFEAE2` |
| Mộc nâu / vintage | `#F6F0E7` | `#3B2A20` | `#8D6F32` | `#E4D8C6` |
| Chibi pastel | `#FFF1F3` | `#5A2B3A` | `#E08A9B` | `#FFE3E8` |
| Xanh biển / Riviera | `#F1F6F7` | `#1F3A40` | `#3F7C86` | `#D8E8EA` |
| Rượu vang / cổ điển | `#F7EFEA` | `#3A1A1F` | `#7C2D3A` | `#E8D2D2` |

Quy tắc:
- Chữ chính phải đạt **tương phản ≥ 4.5:1** trên nền; chữ trang trí ≥ 3:1 và chỉ dùng cho tiêu đề lớn.
- Không dùng gradient nhiều màu; tối đa 1 gradient nhẹ cùng tông nền.
- Nhấn chỉ dùng cho: badge, đường kẻ, số bàn/ngày, nút CTA. Không tô nền cả khối chữ nhấn.

## 2. Cặp font (serif tiêu đề + script tên + sans UI)

- `Playfair Display` + `The Nautigal` + `Be Vietnam Pro` — lãng mạn, cổ điển.
- `Cormorant Garamond` + `Pinyon Script` + `Be Vietnam Pro` — ren, tinh tế.
- `EB Garamond` + `Viaoda Libre` + `Be Vietnam Pro` — vườn, mộc.
- `Playfair Display` + `Carattere` + `Be Vietnam Pro` — chibi, trẻ trung.

Text element có `align: "left" | "center" | "right"` (mặc định `left` cho dữ liệu cũ); preview, trang thiệp thật và ảnh nền export đều tôn trọng giá trị này.

Cỡ gợi ý trên canvas 390×844:
- Tên cặp đôi (script): 32–42px, line-height 1.1–1.25.
- Tiêu đề/nhãn: 11–14px, letter-spacing 0.18–0.3em, uppercase.
- Nội dung: 14–16px, line-height 1.6.
- Ngày/địa điểm: 12–14px.

## 3. Archetype bố cục (dùng toạ độ %)

A. **Center cổ điển** — mọi thứ căn giữa: x 5–95, w 90, `align: "center"`.
   nhãn 10% · xưng hô 16% · tên khách 22% · tên cặp đôi 40–52% · ngày 66% · địa điểm 72%.

B. **Editorial trái** — x 8, w 84, `align: "left"`:
   nhãn 12% · tiêu đề 20% · tên cặp đôi 34/42% · ngày 62% · địa điểm 68% · ghi chú 80%.

C. **Script name-led**:
   xưng hô 8% · tên khách 12% · tên cô dâu 34% · "&" 42% · tên chú rể 48% · ngày 66% · địa điểm 73%.

D. **Poster dọc** — một cột chữ lớn bên trái, khoảng trống bên phải cho ảnh/hoa văn.

Quy tắc an toàn: chừa **8% mỗi cạnh**; vùng chạm CTA ≥ 44px; không đặt chữ dưới 6% hoặc trên 94%.

## 4. Cấu trúc mẫu chuẩn (2–4 trang)

1. **Bìa**: xưng hô, tên khách, tên cặp đôi, ngày, tag "THIỆP CƯỚI TRỰC TUYẾN".
2. **Nội dung**: lời mời, ngày giờ, địa điểm + map block, ghi chú.
3. **RSVP**: form xác nhận, số người, thực đơn.
4. **Cảm ơn**: lời cảm ơn, QR album/mừng cưới (nếu có).

## 5. Recipe `canvas_json` (multi-page)

```json
{
  "width": 390,
  "height": 844,
  "background": "#FAF3F0",
  "pages": [
    {
      "id": "cover",
      "name": "Bìa",
      "background": "#FAF3F0",
      "elements": [
        { "id": "s", "type": "text", "xPct": 5, "yPct": 10, "wPct": 90,
          "text": "Trân trọng kính mời", "placeholder": "salutation",
          "fontSize": 12, "color": "#5A2B33", "fontFamily": "var(--font-playfair)",
          "align": "center" }
      ]
    }
  ]
}
```

Placeholder hợp lệ: `salutation`, `guestName`, `groom`, `bride`, `date`, `venue`.
Text cố định: `placeholder: null`.

## 6. QA trước khi publish

- [ ] Không còn `{{...}}`; preview với tên dài 40 ký tự không tràn.
- [ ] Tương phản đạt, chữ ≥ 11px (trừ nhãn trang trí ≥ 10px uppercase).
- [ ] Tất cả element nằm trong safe-area 8–92%.
- [ ] Ảnh nền < 300KB webp; ảnh trang trí PNG đã tối ưu.
- [ ] Mỗi trang có ít nhất 1 element nhận dữ liệu thật (không phải ảnh phẳng).
- [ ] Publish tạo version mới; thiệp cũ ghim version cũ.

## 7. Không làm

- Không copy ảnh/font/layout nguyên bản từ site khác.
- Không dùng ảnh phẳng làm toàn bộ thiệp (mất RSVP/map/cá nhân hóa).
- Không dùng màu xám lạnh mặc định (`gray-*`, `slate-*`); dùng warm neutral.
- Không nhồi > 3 kiểu chữ trong một mẫu.
