# WEDDING INVITATION PLATFORM — WORKSPACE RULES (`wedding_invi_web`)

Các quy chuẩn bắt buộc cho mọi thay đổi mã nguồn trong repository này.

---

## 1. Âm thanh — Nguyên tắc "1 Nguồn Phát Duy Nhất Toàn App"

1. **Singleton Global Audio**: Mọi trình phát nhạc ngoài thiệp (Landing, Coverflow, Preview Navbar, Modal) bắt buộc đi qua `lib/global-audio.ts`. Cấm tạo `<audio>` hoặc `new Audio()` rời rạc trong component con.
2. **Cô lập iFrame / Preview**: Khi nhúng thiệp vào `<iframe>` hoặc chế độ Preview, luôn truyền `disableAudio={true}` hoặc `?externalAudio=1` để tắt `<audio>` và ẩn nút nhạc nổi trong thiệp. Chỉ link công khai gửi khách (`/[slug]`, `/w/[slug]`, `/m/[slug]`) mới bật audio nội bộ.
3. **Dọn dẹp & chống phát đúp**: Gọi `globalAudio.stop()` khi unmount/chuyển trang; bỏ qua `AbortError` trong `global-audio.ts`. Không gắn trùng listener `inviwedd:open-envelope` ở cả `LiveTemplateRenderer` lẫn `TemplatePreviewRenderer`.
4. **Foley tương tác tách biệt nhạc nền**: Vì `TemplatePreviewRenderer` mặc định `externalMusicControl ?? true`, không dùng cờ này để tắt SFX tương tác (`playCoverSfx`, `playGiftSfx`, `playInteractionSfx`). Gọi `playCoverSfx` trước `inviwedd:open-envelope` và chặn fallback `playOpenCardSound()` / MP3 nền (`PURE_FOLEY_*`, `wasPureCoverFoleyPlayedRecently`) để không phát chồng `/sfx/*.mp3` cũ.

---

## 2. Tương tác Mobile & Chống Nhấp Nháy (Flicker) Đồ họa 3D

1. **Nút nổi trên thẻ vuốt/kéo**: Đặt `z-40 pointer-events-auto touch-manipulation select-none min-h-[40px] px-3.5`, gọi `e.stopPropagation()` trên đủ 4 sự kiện (`onTouchStart`, `onTouchEnd`, `onPointerDown`, `onClick`).
2. **Phát Media đồng bộ**: Gọi `globalAudio.play(src)` trực tiếp trong `onClick` (không qua `useEffect`/`setTimeout`) để giữ user-gesture token trên iOS Safari và Chrome Mobile.
3. **Chống Flicker, Rò rỉ Timer/RAF & Chống lặp mở bìa**:
   - Không dùng `backdrop-blur` đè lên container có `transform-3d`/`perspective` chứa timer tick 1s hoặc iframe; thay bằng gradient đặc + `transform: translateZ(0); backface-visibility: hidden;`.
   - Mọi `setTimeout` lồng nhau phải lưu ref và clear trong cleanup; vòng lặp `requestAnimationFrame` phải dừng khi `isPaused` hoặc chạm biên cuộn. Ở Coverflow (`TemplateShowcase`), `onMouseEnter` chỉ tạm dừng RAF và `onMouseLeave` nối tiếp từ vị trí hiện tại; chỉ `wheel`/`touchstart` mới dừng thủ công.
   - Hiệu ứng bìa nhiều nan/cánh (quạt xếp, cửa 3D): cấm lật dẹt ảnh 2D hoặc chia pha bằng `setTimeout` rời rạc; dựng chuỗi liên tục trên `<canvas>` bằng `requestAnimationFrame` quanh tâm chốt thực kèm fallback `useReducedMotion()`.
   - Hiệu ứng bìa zoom vào Hero: dùng 1 component Hero chung đo FLIP thật (`ResizeObserver` + đo chốt trong `onClick`), giữ các section dưới ẩn tới khi `coverGone === true`, tách `perspective` vào riêng lớp nắp 3D, giữ `coverOpeningRef` tránh `parentIsOpened` cắt ngang và chỉ làm mờ lớp backdrop riêng khi bàn giao.
   - **Chống lặp RAF mở bìa khi cha re-render**: `useEffect` chạy RAF mở bìa **cấm** đưa callback props (`onOpenedChange`) hoặc object `flipGeom` vào dependency; lưu qua `ref` (đồng bộ trong `useEffect` chuẩn React 19), khóa mốc `coverStartedAtRef` (chỉ gán `performance.now()` 1 lần cho mỗi pha mở), và bọc `React.useCallback` cho `onOpenedChange` ở component cha (tách biến primitive trước `useCallback` để đạt `react-hooks/preserve-manual-memoization`).
   - Gợi ý tương tác (vòng sáng góc xé lịch/nút lật thẻ, nhịp giật mép giấy `<canvas>`) gắn `IntersectionObserver` để 0% CPU ngoài màn hình, dừng RAF sau mỗi nhịp, tự tắt khi đã tương tác và tôn trọng `useReducedMotion()`.
4. **Auto-Scroll mượt 60/120fps & Scroll-Reveal `1/3` màn hình**:
   - Tách `isAudioEnabled` (`!disableAudio`) khỏi `isAutoScrollEnabled` (`enableAutoScroll`). Dùng tốc độ `120 px/s`, cộng dồn `virtualY` (`el.scrollTop = virtualY`, cấm `Math.floor` + `scrollBy`), ép `scrollBehavior = "auto"`, clamp `dt <= 0.05s`, cache `maxScroll` (`~450ms`), dò wrapper `overflow-x-hidden` lồng nhau và chờ an toàn qua pha mở bìa dài (`maxScroll <= 20`). Đồng bộ nút Modal với iframe qua `postMessage`.
   - Scroll-reveal (`AmberReveal`...) dùng `IntersectionObserver` `rootMargin: "0px 0px -33% 0px"` bám đúng ancestor cuộn thực tế kèm dự phòng đáy trang tiết lưu (`>= 160ms`), không gọi `getBoundingClientRect()` ở 60fps; **không bọc lồng 2 lớp `Reveal`** cho cả `<section>` cha lẫn thẻ con bên trong (tránh card bị trống ruột trắng trên mobile).
5. **Cử chỉ Mobile, Cầu nối `iframe` & Chống Ghost Click**:
   - Khi chuyển thẻ/slide trên Mobile (`switchCard`), khóa click thẻ ~`450ms` (`suppressCardClicks`) tránh synthetic `click` sau `touchend`. Khi mở Popup/Modal từ `touchend`, khóa click popup ~`450ms` qua `onClickCapture` (`preventDefault` + `stopPropagation`) và mở khóa tại `onTouchStartCapture`.
   - Trên thẻ live chứa `<iframe>`, cầu nối `touchstart`/`touchmove`/`touchend` tách vuốt ngang đổi mẫu, vuốt dọc cuộn đọc và chạm gọn ngoài phần tử tương tác (`a, button, input, textarea, select, [role="button"], [data-cover-open]`). Cấm `e.target instanceof Element` xuyên realm `iframe`; dùng `rawNode?.nodeType === 1 ? rawNode : rawNode?.parentElement` + `typeof targetEl.closest === "function"`.
6. **Tương thích iOS WebKit (Safari, Chrome iOS, Google App) & 3D (`rotateX` / `rotateY`)**:
   - **Đúng chiều xoay & tách 2 pha đơn mặt**: Nắp phong bì `origin-top` mở ra trước (`+Z`) xoay góc **dương** (`rotateX(+deg)`), cấm `rotateX(-deg)`. Với nắp 2 mặt có mặt lót, **cấm** gộp `preserve-3d` + `clip-path` + `rotateX(180deg)` trên cùng 1 khung (WebKit bị Z-fighting & đảo hình chữ `X`); bắt buộc tách **2 pha đơn mặt độc lập** (`0° → +90°` `origin-top` ẩn tại `90°`, sau đó `-90° → 0°` `origin-bottom` ở `bottom-full`, chỉ mount khi `coverOpening`).
   - **Cô lập mặt sau 3D & đủ tiền tố WebKit**: Mọi phần tử 3D (`preserve-3d`, `backface-visibility`, `clip-path`) bắt buộc kèm `WebkitTransformStyle`, `WebkitBackfaceVisibility`, `WebkitClipPath`. Thẻ lật 2 mặt (`rotateY(180deg)`) phải đặt `z-10` + `translateZ(1px)` trên mặt trước và `pointer-events-none` + `rotateY(180deg) translateZ(1px)` trên mặt sau để tránh chặn chạm nút mở thiệp. Trên `MobilePreviewFrame`, khóa `scrolling="no"` + `maxHeight: 100%` + container cuộn `absolute inset-0`.
   - **Không cắt khung & không trắng card**: Khi chuyển sang `coverGone`, mở khóa sạch `overflow-hidden` / `h-screen-dvh` và dùng `sm:h-full` / `md:h-full` thay cho `h-full` trong lưới 1 cột mobile trên cả Preview lẫn thiệp thật (`/mau/...`, `/m/...`, `/w/...`).

---

## 3. Bảo mật API, Thanh toán & Cô lập Dữ liệu (Multi-Tenant)

1. **Webhook Thanh toán (PayOS / Bank) — Atomic & Chống Hạ Gói**:
   - Chỉ tin dữ liệu nằm trong payload đã ký HMAC (ví dụ `data.code`, không tin trường top-level chưa ký).
   - Khóa/claim đơn nguyên tử **trước** khi nâng gói: `.update({ status: "paid", paid_at }).eq("id", order.id).eq("status", "pending").select("id").maybeSingle()`. Cấm kích hoạt lại đơn `cancelled`.
   - Chỉ nâng `weddings.plan` khi `PLAN_RANK[order.plan] > PLAN_RANK[currentPlan]` (cấm hạ gói khi webhook cũ đến trễ).
2. **Chống IDOR & Plan Gate**:
   - Mọi thao tác ghi lồng nhau (`eventIds`, `guestId`, `photoId`) bắt buộc xác minh bản ghi thuộc đúng `wedding_id = wedding.id`.
   - Trong `PATCH /api/weddings/[id]/content`, bảo toàn `suspended`, `photoModeration` từ dữ liệu cũ và kiểm tra quyền gói cho `musicPreset: "custom"`/`musicUrl` (Pro+) và `photoApprovalMode`/`sharePinEnabled` (VIP).
   - Cấm nhận prefix `guest:` từ `authorKey` của client; chỉ cho `anon:...` từ client và sinh `guest:<id>` ở server. Reset `approved = false` khi sửa lời chúc nếu `autoApprove === false`.
3. **Share PIN & Chống Lạm dụng**:
   - Cookie Share PIN phải gắn với hash của `sharePin` hiện tại; mọi `/api/share/*` phải kiểm tra lại `sharePinEnabled === true`.
   - Mọi endpoint công khai ghi DB/R2 (`/api/public/wedding/[slug]/photos`, `/api/share/verify-pin`, `/api/wishes`) phải có Turnstile, giới hạn số lượng/độ dài input và không chỉ dựa vào `Map` rate-limit trong RAM isolate.
   - JSONB động (`designerFields`, `designerOverrides`) phải giới hạn số key & độ dài chuỗi; cấm `data:image/svg+xml`.

---

## 4. Kiến trúc Template, React, SEO & Cơ sở dữ liệu

1. **Chống trùng lặp trong `templates/`**:
   - Tái sử dụng `templates/shared/useCountdown.ts`, helper lịch/Google Calendar và RSVP dùng chung; giữ `TEMPLATE_REGISTRY` đồng bộ 1-1 với `TemplatePreviewRenderer` (chuẩn hóa `id.replace(/_/g, "-")`); không nhồi `@keyframes` đặc thù từng mẫu vào `app/globals.css`.
2. **Next.js App Router, React & SEO**:
   - Đẩy `"use client"` xuống leaf tương tác; truyền section tĩnh vào shell client qua RSC `ReactNode` slots (`app/page.tsx`).
   - Dùng hằng số chung cho Auth0 claim (`"https://thiepcuoi/email"`) và `resolveAppBaseUrl()`. Ở `proxy.ts`, chuyển `401` của `/auth/profile` sang `204` (`Cache-Control: no-store`); tách `LandingNavbarContent` / `WithAuth` tránh gọi đúp `useUser()`.
   - Không dùng `runtime = "edge"`; chặn route QA/debug bằng `NODE_ENV !== "production"` và `disallow` trong `app/robots.ts`. Tránh gọi `setState` đồng bộ trong `useEffect` (`react-hooks/set-state-in-effect`) và tránh tạo object inline truyền xuống component nặng mà không `useMemo`.
   - **SEO chuẩn Việt Nam & chống trùng Metadata/Schema**: Không đặt `alternates.canonical` / `alternates.languages` cứng ở `app/layout.tsx` (chỉ khai báo tại từng trang, ví dụ `alternates: { canonical: "/", languages: { "vi-VN": "/" } }` ở `app/page.tsx`). Trang con đặt `title` ngắn để `title.template` nối `| Inviwedd`; trang chủ dùng `title: { absolute: ... }`. Hợp nhất structured data trang chủ vào **1 `<JsonLd />` `@graph` duy nhất** tại `app/page.tsx` (không nhồi `Organization` vào `app/layout.tsx`), và gắn `data-nosnippet` cho khối pháp lý/hotline ở `Footer`.
3. **Cơ sở dữ liệu & Migration**:
   - Ràng buộc SQL (`staging_init.sql`, migrations) khớp tuyệt đối với validation trong code (`orders.code`, kiểu `bigint`); tránh N+1 trong batch job (`lib/server/retention.ts`) và tránh index trùng lặp.

---

## 5. Đồng bộ Block Dashboard ↔ Mẫu Thiệp (`config/template-sections.ts`)

1. **Khai báo năng lực khớp 100%**: Khai báo chính xác `sections`, `reorderable`, `dressCodeEditor`, `timelineEditor`, `storySupported`, `couplePhotos`, `hostFirst` khớp với những gì mẫu thực sự đọc/vẽ.
2. **Container sắp xếp `sectionOrder`**: Mẫu dùng `style={{ order: orderOf(...) }}` bắt buộc có `flex flex-col` trên container cha, `order: -1` cho Hero và `order: 999` cho `<footer>` (nếu nằm trong flex container).
3. **Chuẩn `GuestAlbumQr` & `music`**: Mọi `<GuestAlbumQr />` truyền `slug={weddingSlug}` và khóa `data.plan !== "free"` + `!hidden.has("albumQr")`. Nút nhạc nổi nội bộ tôn trọng `!hidden.includes("music")`.
4. **Đồng bộ `content/demo.ts`**: Mọi mẫu `plan: "pro"` phải có khai báo trong `DEMO_PRESETS` hoặc `NEW_TEMPLATE_DEMO_COUPLES` để không rơi về fallback `free`.

---

## 6. Tối ưu Hình ảnh, Media & Turnstile Batch (Mobile 4G / iOS Safari)

1. **Chiến lược tải `<img>`**: Ảnh below-the-fold bắt buộc có `loading="lazy" decoding="async"`. Ảnh LCP trên fold (Hero Desktop, 3–4 thẻ đầu Catalog/Album) đặt `loading="eager" fetchPriority="high"`; không đặt `fetchPriority="high"` cho ảnh Coverflow dưới fold trước khi vào gần viewport.
2. **Trì hoãn Preview & Lớp phủ `<picture>` trên `PhoneFrame`**:
   - Tách `nearObserver` (ảnh tĩnh) khỏi `stageObserver` (`stageRef`, `threshold: 0.15` mount live `iframe` Coverflow), crossfade `cover-sm.webp` (0 spinner), ẩn Hero phone dưới `lg` (`hidden lg:flex`) và tắt `backdrop-blur` ở sticky Navbar Mobile (`md:backdrop-blur-md`).
   - Khi phủ ảnh tĩnh `<picture>` (`<source media="(min-width: 1024px)" ... />`) chồng lên `<MobilePreviewFrame>`, **cả 2 lớp bắt buộc đặt `absolute inset-0`** (`<picture className="pointer-events-none absolute inset-0 z-20 ...">` và wrapper live `absolute inset-0 z-10`); cấm để `<picture>` ở normal flow gây đẩy `MobilePreviewFrame` xuống ngoài khung và trắng màn hình sau khi crossfade.
3. **Media & Nén ảnh**: `/media/[...key]` duy trì `Accept-Ranges: bytes` + `206 Partial Content`; bổ sung thư mục tĩnh mới trong `public/` vào `Cache-Control: immutable` ở `next.config.ts`; nén ảnh client-side (`lib/image/compress.ts`) đúng mục đích (`banner`: 1600, `gallery`/`album`: 1280, `couple`: 1000, `gift`: 800).
4. **Turnstile batch**: Token Turnstile chỉ dùng **1 lần** — form upload nhiều tệp (`GuestUploadPortal`) phải gộp vào **1 request `FormData`** duy nhất kèm `turnstileToken`.

---

## 7. Bìa thiệp Preview, Đường dẫn Asset & Căn khớp Khung ảnh Hero

1. **Khóa chiều cao bìa trong `contained`**: Mẫu có `<Cover>` dùng `absolute inset-0` bắt buộc khóa chiều cao container cha khi `!coverGone` (`contained ? "h-full overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden"`) và ẩn thân thiệp khi `!coverGone && !closing` (`hidden pointer-events-none`).
2. **Đường dẫn asset `/templates/<id>/`**: Xác minh 100% `/templates/<id>/*.webp` khớp thư mục thực tế trong `public/templates/<id>/`.
3. **Căn khớp ảnh Hero trong khung vòm / vòng hoa `.webp`**: Khai báo đúng `aspect-[W/H]` theo ảnh gốc và đặt ảnh cưới bên trong bằng tọa độ `%` khớp lòng khung; cấm `inset-0` tràn viền hoặc khoảng cách pixel cố định.
4. **Live `iframe` & Cross-Document `getComputedStyle`**: Gắn `data-template-loading="true"` trên `TemplateLoadingFallback`, chỉ đánh dấu live khi `!isLoadingFallback`, có DOM hiển thị và `areIframeStylesReady`. Đọc style trong `iframe` qua `(el.ownerDocument.defaultView ?? window).getComputedStyle(el)`.

---

## 8. Trải nghiệm Khách mời, Upload Mobile & Đồng bộ Builder/Pricing

1. **Upload Mobile & `URL.createObjectURL`**: Không đặt `capture="environment"` trên `<input type="file">` cổng album; hỗ trợ thêm `image/heic,image/heif`. Không gọi `URL.revokeObjectURL` trong cleanup `useEffect([items])`; dùng `ref` thu hồi đúng item xóa/unmount.
2. **Chống lặp UI & Metadata chia sẻ**:
   - Không lặp thẻ ngân hàng giữa `GiftModal` và `VietQRGiftBox`; không render trùng `<GuestBoardingPass />` trên `/m/[slug]`. Khi `mode === "guest"` trong `InvitationDesktopStage`, ẩn `FloatingExperienceControls` ở `lg:hidden` và giới hạn `WishOverlay` (`z-30 max-w-[calc(100vw-5rem)]`).
   - Không hardcode `openGraph.images[].type = "image/png"`; suy luận MIME theo URL/đuôi tệp.
   - **Form RSVP**: Chỉ hiển thị duy nhất tiêu đề `"Xác nhận tham dự"` (không eyebrow/mô tả thừa). Hai nút phản hồi luôn ép khung `border-[1.5px] border-solid` + nền nổi + icon + `.rsvp-choice-nudge` khi `selectedChoice === null`.
3. **Builder, Gói cước & Thanh toán**: Lưu và khôi phục trọn vẹn mọi trường `/tao-thiep` ở `SaveDraftPageClient`; `PLAN_LIMITS` (`config/plans.ts`) khớp 100% Bảng giá/FAQ; hiển thị tên gói qua `getPlanLabel(...)` và có trạng thái hỗ trợ khi polling quá hạn.

---

## 9. Quy chuẩn Tách nền Asset, Typography & Cổng Tự Kiểm Chứng

1. **Tách nền `.webp` từ nền trắng**: Cấm chỉ flood-fill từ `(0,0)`; khử sạch pixel nền trắng trung tính (connected-components + un-premultiply chống halo), composite thử lên nền màu đậm để xác nhận trực quan 0 đốm trắng/cắt cụt, xóa asset & script thừa và tăng `ASSET_VER`.
2. **Typography**: Không gắn `font-bold`/`font-semibold` lên font thư pháp/display đơn-weight (`Picturama Founder`, `TAN Nightingale`); đặt `font-normal` và `fontSynthesis: "none"`. Kiểm tra hiển thị chữ số thực tế tránh thiếu glyph.
3. **Cổng Tự Kiểm Chứng Bắt Buộc**:
   - Chạy `npx eslint <file-đã-sửa> --max-warnings=0` (**0 error, 0 warning**) và `npx tsc --noEmit`. Mọi `repeat: Infinity` phải kiểm tra `useReducedMotion()`; không gắn `fetchPriority="high"` cho ảnh đang `hidden` sau bìa.
   - Đối chiếu thiết kế trên viewport mobile `390px` đủ 4 tiêu chí: (a) không họa tiết/con dấu che chữ hay số lịch, (b) tỷ lệ khớp mẫu, (c) nét chữ & xuống dòng đúng mẫu, (d) không đè phần người dùng tự chỉnh.
   - **Playwright WebKit bắt buộc cho UI/3D/Animation iPhone**: Mọi sửa đổi bìa 3D, FLIP, `MobilePreviewFrame` hoặc lỗi iPhone bắt buộc chạy trên **Playwright `webkit`** (`390×844`, `hasTouch: true`) ở **cả 2 ngữ cảnh** Coverflow (`/`) và thiệp thật (`/mau/...`), chụp đủ pha (đóng → đang mở → mở xong → khối trong) và tự đọc ảnh kiểm tra trước khi báo xong.

---

## 10. Chuẩn Thứ Tự Demo 10 Phần & Tinh Gọn Mặt Thiệp

1. **`CANONICAL_SECTION_ORDER`**: Toàn bộ mẫu (trừ `vuon-o-liu`/`basic-1` JSX tĩnh) và `content/demo.ts` dùng thứ tự: `(1) Hero` (`order: -1`) → `(2) family` → `(3) map` → `(4) story` *(Standard/Pro)* → `(5) dresscode` → `(6) calendar` → `(7) gift` → `(8) rsvp` → `(9) album` → `(10) albumQr` *(Standard/Pro)*. Tách `visibleEvents` vào `orderOf("map")` và `<GuestAlbumQr />` vào `orderOf("albumQr")`; cập nhật đồng thời `TEMPLATE_OVERRIDES` trong `config/template-sections.ts`.
2. **Tinh gọn mặt thiệp ("Chỉ giữ Tiêu đề + Visual")**:
   - **Cấm đưa tên mẫu / `meta.subtitle` / `meta.description` vào bìa hoặc ruột thiệp** (chỉ dùng ở catalog ngoài). Eyebrow mặc định là **`"Thiệp mời tham dự lễ cưới"`** (`tracking-[0.14em]`–`tracking-[0.18em]`, không dùng `"Thiệp Báo Hỷ"`), hoặc `"Trân Trọng Kính Mời"`, `"Lễ Thành Hôn"`, tên cặp đôi.
   - Cấm nhãn kỹ thuật / tiếng Anh thừa / nhãn gói cước trên mặt thiệp (kể cả mặt sau thẻ 3D & `<footer>`): `SAFETY FILM`, `KODAK`, `35MM`, `24FPS`, `CUE SHEET`, `CAST DOSSIER`, `STAR 01/02`, `A FILM BY LOVE`, `ALL RIGHTS RESERVED`, `THE BIG DAY`, `SAVE THE DATE`, `SAVE OUR DATE`, `Memories & Moments`, `Our Little Story`, `Thank you for celebrating with us`, `PHIÊN BẢN STANDARD`, `Forever & Always`, `Black-Tie Wedding`, `Midnight Ballroom Gala`.
   - Chỉ giữ 1 tiêu đề tiếng Việt ngắn ở đầu mỗi block (xóa câu giải thích dài dưới tiêu đề, không lặp cùng tiêu đề ở eyebrow ngay trên `<h2>`). Ngày âm bắt buộc qua `formatLunarDateClean(...)`.
3. **Đồng bộ `"Riêng mẫu này"` (`config/template-features.ts` ↔ `templates/registry.ts`)**: Không hardcode chi tiết đặc thù chủ đề vào key dùng chung trong `EXTRA_FEATURES`; mọi ID đặc thù khớp 1-1 với cơ chế thật trong `templates/<id>/index.tsx`.

---

## 11. DispatchSEO Shortcuts

Khi người dùng gõ các lệnh tắt sau, tự động gọi MCP tool `dispatchseo-inviwedd` -> `get_instructions` với workflow tương ứng và thực hiện đúng hướng dẫn:
- `seo research`: chạy workflow `research`.
- `seo build [chủ đề]`: chạy workflow `build` (nếu có kèm chủ đề thì ưu tiên bài đó, không thì lấy bài đầu tiên trong Guide queue).
- `seo tool [tên tool]`: chạy workflow `build-tool` (nếu có kèm tên thì build đích danh tool đó, không thì lấy tool đầu tiên trong Tool queue).

