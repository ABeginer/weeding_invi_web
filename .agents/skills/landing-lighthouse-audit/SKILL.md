---
name: landing-lighthouse-audit
description: >-
  Runbook đo và tối ưu Lighthouse thực tế (Performance, Accessibility, Best Practices, SEO)
  cho trang chủ `/` của wedding_invi_web trên cả Mobile và Desktop. Dùng khi kiểm chứng
  LCP/TBT/CLS, tối ưu tốc độ tải Mobile 4G, hoặc nghiệm thu tương phản màu & vùng chạm WCAG.
---

# Quy Trình Đo & Tối Ưu Lighthouse Trang Chủ (`/`)

> Lưu ý: Công cụ `chrome-devtools` MCP `lighthouse_audit` **loại trừ mục Performance**. Khi cần chấm điểm đầy đủ 4 chỉ số (`Performance`, `Accessibility`, `Best Practices`, `SEO` cùng `FCP/LCP/TBT/CLS`), luôn chạy Lighthouse CLI trực tiếp trên bản build `next start`.

## Bước 1 — Build & khởi chạy bản production cục bộ
1. Chạy `npm run build` để đảm bảo `.next` phản ánh đúng mã nguồn mới nhất.
2. Khởi chạy server daemon: `npx next start -p 3199` (chờ dòng `Ready`).

## Bước 2 — Chạy Lighthouse CLI (Mobile & Desktop) vào thư mục `scratch/`
*(Không lưu JSON hay script tạm trong `scripts/`; tuân thủ EDR: viết script `.mjs` đọc JSON trong `scratch/`, cấm `node -e`.)*

```powershell
$outDir = "<artifactDir>/scratch"
npx --yes lighthouse http://localhost:3199/ --output=json --output-path="$outDir/lh-mobile.json" --chrome-flags="--headless=new --no-sandbox" --quiet
npx --yes lighthouse http://localhost:3199/ --preset=desktop --output=json --output-path="$outDir/lh-desktop.json" --chrome-flags="--headless=new --no-sandbox" --quiet
```

Sau khi đo xong, **tắt ngay** tiến trình `next start` (qua `manage_task` `kill` hoặc `taskkill /F /T /PID`).

## Bước 3 — Checklist xử lý nhanh các lỗi thường gặp trên Landing
1. **Performance Mobile (`LCP` / `TBT`):**
   - Kiểm tra xem `iframe` Hero hoặc `iframe` Coverflow có tự mount ở `scrollY = 0` không: Hero ẩn cột `PhoneFrame` dưới `lg` (`hidden lg:flex`, không `preload` ảnh ẩn); Coverflow dùng riêng `stageObserver` (`stageRef`, `threshold: 0.15`) để không kích hoạt khi mới chỉ lộ tiêu đề section.
   - Đảm bảo không có `loading` spinner trong `dynamic(...)` của Preview; crossfade ảnh tĩnh `cover-sm.webp` khi DOM + CSS trong `iframe` đã nạp (`areIframeStylesReady`).
   - Không gắn `backdrop-blur-md` cho sticky `<header>` trên Mobile (`bg-[#FAF8F5]/95 md:backdrop-blur-md`) và không `preload: true` đồng loạt 8 file font trước ảnh LCP.
2. **Accessibility (`color-contrast` & `target-size`):**
   - Chữ vàng đồng trên nền sáng (`#FAF8F5` / `#FFFFFF`) dùng `#8A6838` (đạt `≥ 4.74:1`), không dùng `#B89B72` (`2.48:1`); chữ đỏ dùng `text-rose-700` thay `text-rose-600`. Giữ `#B89B72` trên nền tối `#141210` (Gói Pro) và dấu chấm/viền trang trí.
   - Chấm phân trang Coverflow phải đặt vùng bấm `<button>` tối thiểu `h-6 w-6` (`24×24px`) bọc `<span aria-hidden="true">` hiển thị `h-2 w-2`/`w-6`, tổng chiều ngang trên `390px` phải `scrollWidth <= 390`.
   - Badge gói (`STANDARD`/`PRO`) chỉ render trên thẻ trung tâm (`isCenter`) để không bị tụt tương phản khi thẻ phụ mang `opacity < 1`.
3. **Best Practices (`errors-in-console` / `inspector-issues`):**
   - Đảm bảo `GET /auth/profile` khi chưa đăng nhập trả `204 No Content` (`Cache-Control: no-store`) tại `proxy.ts` và không gọi trùng `useUser()` giữa `LandingPageClient` và `LandingNavbar`.
