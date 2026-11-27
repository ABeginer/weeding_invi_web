---
name: template-qa-audit
description: >-
  Runbook nghiệm thu và kiểm chứng hàng loạt toàn bộ 43 mẫu thiệp trên
  wedding_invi_web. Dùng khi nghiệm thu thay đổi diện rộng trong templates/,
  kiểm tra thứ tự CANONICAL_SECTION_ORDER, rà soát đồng bộ config/template-sections.ts
  hoặc kiểm tra mobile UI bằng Playwright trên tất cả các mẫu.
---

# Quy Trình Nghiệm Thu Toàn Bộ 43 Mẫu Thiệp

Không chỉ kiểm tra 3–5 mẫu đại diện sau các đợt refactor diện rộng; phải chạy quét đồng loạt trên toàn bộ mẫu trong `templates/registry.ts`.

## Bước 1 — Kiểm tra tĩnh (Static Audit) bằng tệp `.mjs` tạm trong `scripts/`
*(Tuân thủ EDR: cấm `node -e` / `powershell -c`; dùng tệp `.mjs` trong `scripts/` và xóa sạch sau khi xong. Trên Windows PowerShell nối lệnh bằng `;`, không dùng `&&`.)*

1. **Đồng bộ `config/template-sections.ts`**:
   - Mẫu có `orderOf(...)` không được giữ `reorderable: false` hay `sections: []`.
   - Mẫu có `hidden.has("map")` không được dùng `SECTIONS_NO_MAP_NO_STORY`.
   - Khớp 1-1 `data.dressCode`, `data.timeline`, `data.story`, `data.hideCouplePhotos`, `data.hostFirst` với `TEMPLATE_OVERRIDES`.
2. **Đồng bộ `content/demo.ts`**:
   - Xác minh mọi mẫu `plan: "pro"` đều có entry trong `DEMO_PRESETS` hoặc `NEW_TEMPLATE_DEMO_COUPLES`.
3. **Đồng bộ `config/template-features.ts` ↔ `templates/registry.ts`**:
   - Xác minh toàn bộ mẫu `plan: "pro"` có `extraFeatureIds` khớp đúng hiệu ứng thật trong `templates/<id>/index.tsx`, không dính mô tả đặc thù từ chủ đề khác (`K♥ & Q♥`, `vali`, `cửa VIP`, `35mm`...).
4. **Quét rác chữ, rò rỉ mô tả mẫu & tiêu đề lặp**:
   - Kiểm tra `content/demo.ts` đảm bảo không gán `meta.subtitle`/`meta.description` vào `data.ui.eyebrow`/`data.ui.heroSubtitle`.
   - Quét trong `templates/`, `templates/shared/`, `templates/themed/`, `components/invitation/`, `lib/wedding-data.ts` để bắt: render `meta.name`/`meta.subtitle`/`theme.subtitle` lên bề mặt thiệp, chuỗi `"Thiệp Báo Hỷ"` (chuẩn phải là `"Thiệp mời tham dự lễ cưới"`), `evt.lunarDate` chưa qua `formatLunarDateClean(...)`, Hero trong flex container thiếu `order: -1`, rác tiếng Anh (`SAVE THE DATE`...) và lặp `<span>Heading</span>` ngay trên `<h1..h4>Heading</h1..h4>`.

## Bước 2 — Kiểm tra Live trên đủ 43/43 mẫu bằng Playwright (`390×844`)
Duyệt toàn bộ 43 route `/qa/<id>?opened=1` qua Chrome hệ thống (`{ channel: "chrome", headless: true }`, tránh dựa vào `chromium_headless_shell`; script tạm có thể đặt ở `scratch/`, khi chạy `next start` trên Windows nhớ dọn cây tiến trình con trong `finally` bằng `taskkill /F /T /PID`):
1. Bấm mở bìa nếu thiệp đang đóng.
   - Với mẫu có hiệu ứng bìa FLIP/Canvas hoặc Pure Foley mới/sửa: đo `boundingBox()` trước và sau bàn giao (`|deltaX|, |deltaY|, |deltaWidth|, |deltaHeight| <= 1.5px`) và gắn spy kiểm tra `AudioContext`/`HTMLMediaElement` (0 lỗi Web Audio, `legacySfxPlayed: []` trên cả `/qa/<id>` lẫn `/mau/<id>?embed=1&externalAudio=1`).
2. Với mẫu `plan: "pro"`, chờ `img[alt="Mã QR album ảnh cưới"]` (`timeout: 2500`) trước khi đọc DOM để tránh đánh giá sót khi QR đang tạo bất đồng bộ.
3. Xác nhận cho từng mẫu:
   - Mọi phần tử có `style*="order"` có tọa độ `Y` tăng đơn điệu đúng thứ tự.
   - `<footer>` nằm dưới phần tử ordered cuối cùng.
   - Mẫu `pro` hiển thị đủ `Chuyện Chúng Mình` (`story`) và `Chia Sẻ Ảnh Tiệc Cưới` (`albumQr`); mẫu `free` không lộ 2 khối này.
   - Không tràn ngang (`scrollWidth <= innerWidth + 2`), không vỡ ảnh (`naturalWidth === 0`), không lọt chuỗi ISO `202\d-\d{2}-\d{2}T` và không sót từ khóa cấm.
4. Mở modal xem trước trên `/thiep-cuoi` cho các mẫu `plan: "pro"` vừa sửa để kiểm tra mục `"Riêng mẫu này"` hiển thị đúng tính năng thực tế.
5. Kiểm chứng Auto-Scroll & Coverflow (khi sửa trải nghiệm xem trước / mẫu có bìa dài):
   - Modal `/thiep-cuoi` và `/mau/<id>` (Phone `390px` + Desktop): sau khi mở bìa phải tự cuộn thật với bước `deltas` ổn định (`2px/frame` @ 60Hz), nút `Tạm dừng` / `Phát cuộn` đồng bộ 2 chiều; ở `/` Coverflow: hover dừng RAF, rời chuột cuộn tiếp.
   - Nếu đổi layout/chữ/nút bìa của mẫu nào, chụp lại đủ `public/templates/<id>/cover.webp` (`720×1180`) và `cover-sm.webp` (`360×590`) từ `/qa/<id>` ở DPR `2x` rồi xem kiểm tra lại trên thẻ `/thiep-cuoi`.
6. Kiểm chứng Coverflow 10/10 & Mobile Touch UX (`390×844`, `hasTouch: true` trên `next start` khi sửa `/` Coverflow):
   - Cả 10 mẫu trong `CURATED_IDS` thoát `[data-template-loading="true"]` và tự mở bìa mượt, không treo ảnh tĩnh hoặc detach nút giữa chừng.
   - Chạm thẻ phụ trái/phải (`offset ±1`): thẻ xoay ra giữa và `[data-mobile-template-popup="true"]` bằng `0` (không bật nhầm popup).
   - Chạm gọn thẻ trung tâm hoặc `[data-mobile-template-trigger="true"]` mở popup nhưng khóa ghost-click `~450ms` (không tự nhảy sang `/mau/...` hay `/tao-thiep`); vuốt ngang đổi mẫu và vuốt dọc cuộn thiệp không mở popup.
7. Chụp screenshot mobile `390×844` và desktop `/mau/<id>` cho các mẫu tiêu biểu/vừa sửa và tự xem ảnh bằng `read_file`.

## Bước 3 — Dọn dẹp & Xác minh sau lần sửa cuối
1. Xóa sạch toàn bộ script, log `.txt`, ảnh `.png` tạm trong `scripts/` và kiểm tra lại bằng `Get-ChildItem scripts/`.
2. Chạy sau lần sửa code cuối cùng:
   - `npx tsc --noEmit` (0 errors)
   - `npm test` (toàn bộ test pass)
   - `npx eslint <các-file-đã-sửa>` (xác nhận 0 errors)
