# Decisions

Each entry: decision → reason → where it lives in code. "Owner" means the repository owner stated it; "code" means it is only inferable from the repository.

## Product and plans
- **The plan is stored on the wedding, not on the user** — one account can own several weddings with different plans, and an order upgrades exactly one wedding. Code: `weddings.plan`, `lib/server/owner.ts`, `app/api/orders`.
- **Prices are 199,000 đ (pro) and 399,000 đ (vip)** — defined once in `lib/server/payments.ts` (`PLAN_PRICES`); display copy in `config/pricing.ts` must match. Code, owner confirmed prices live in `payments.ts`.
- **Free plan limits: 1 wedding, 20 guests, 2 events, 5 gallery photos, 0 gift QR** — the free tier exists to convert to Pro. Code: `config/plans.ts`.
- **Pro: unlimited weddings/guests, 10 events, 30 gallery, 30 album, 2 gift QR. VIP: 20 events, 30 gallery, 300 album, 2 gift QR.** Code: `config/plans.ts`.
- **Free-plan data retention is 30 days** — owner decision, re-confirmed on 2026-11-14: the 30-day commitment stays and must not be removed from the pricing copy. It drives Pro upgrades. Implementation status: **still not implemented anywhere** (no scheduler, cron or cleanup job in the repo), so building it is pending work rather than a copy change.
- **A wedding is created on the free plan** — pro/vip are reached only through a paid order, so creation always gates templates against `free`. Code: `app/api/weddings/route.ts`.
- **Plan gates are enforced server-side per feature** — guests, events, photos per kind, templates. Code: `config/plans.ts` consumed by the API routes; the client mirrors the messages but is not authoritative.

## Invitation and guests
- **Two public link types** — `/w/<slug>` is the wedding-wide link (no RSVP), `/m/<guestSlug>` is the personal link with the guest name, RSVP and wish. Code: `app/w/`, `app/m/`, `components/invitation/InvitePageClient.tsx`.
- **Guest slug is a 12-hex-char random string** — the link itself is the capability; no login for guests. Code: `migration_v2.sql`, `lib/server/http.ts` (`SLUG_RE`).
- **Guest name is hidden from the OG title by default** — sharing a personal link must not leak the guest's name in Zalo/Messenger previews; opt in with `SHARE_SHOW_GUEST_NAME=true`. Code: `app/m/[slug]/page.tsx`.
- **Event visibility rule: no assignment rows means the guest sees every event; any assignment narrows it** — keeps the common case zero-config. Code: comment + logic in `lib/server/weddings.ts`.
- **RSVP stores plus-ones and diet** — so the couple can prepare tables and menus; `plus_ones` 0–10, `diet` meat/veg. Code: `migration_v4.sql`, `app/api/rsvp/route.ts`.
- **Spam protection is Turnstile plus a honeypot field named `website`** — Turnstile is skipped when no secret is configured in dev and fails closed in production. Code: `lib/server/turnstile.ts`, `app/api/rsvp`, `app/api/wishes`.

## Content and rendering
- **UI copy is Vietnamese only, with full diacritics, and light theme is the default** — the audience opens links from Zalo/Messenger on phones. Code: `lib/brand-theme.ts` (`DEFAULT_BRAND_THEME = "light"`), all `components/`.
- **Application UI uses semantic theme tokens** (`bg`, `surface`, `text`, `accent-*`, `success-*`, `danger-*`) rendered from `lib/brand-theme.ts`; invitation templates intentionally own their own palettes and fonts.
- **Photos live in R2 under opaque keys** `weddings/<weddingUuid>/<kind>/<photoUuid>.webp`, served by `/media/[...key]` with `Cache-Control: immutable` — Cloudflare Workers cannot run `sharp`, so resizing/compression happens in the browser before upload. Code: `lib/server/storage.ts`, `lib/image/compress.ts`, `app/media/[...key]/route.ts`.
- **Wedding timestamps are ISO strings with an explicit `+07:00` offset** — the product is Vietnam-only and `datetime-local` input must not drift. Code: `lib/wedding-types.ts` (`toIsoPlus07`, `isValidIsoPlus07`).
- **Template catalog has 24 entries; 23 are selectable and `vip-1` is a placeholder** — placeholder rows are excluded from selectable lists. Code: `templates/registry.ts`.
- **Content is stored as a single `jsonb` blob normalised on read** — schema changes stay backward compatible without migrations per field. Code: `lib/wedding-data.ts` (`normalizeWeddingContent`), `lib/server/mappers.ts`.

## Payments
- **Orders carry a human-readable code `INV-XXXXXX`** (6 chars from a no-ambiguity alphabet) used as the bank transfer description; the webhook extracts it with `findOrderCode`. Code: `lib/server/payments.ts`.
- **Bank transfer only, no card gateway** — the flow is order → VietQR → manual/automatic reconciliation. Code: `lib/server/vietqr.ts`, `app/api/orders`.
- **The webhook authenticates with a shared secret header** (`x-webhook-secret`) rather than an HMAC signature; the sender is a Google Apps Script that reads bank notification emails. Code: `app/api/webhooks/bank/route.ts`; the Apps Script source is **not in the repository (UNVERIFIED)**.
- **Ops staff can confirm, cancel and manually match transactions** — reconciliation must not depend only on the webhook. Code: `app/api/ops/orders`, `app/api/ops/bank-transactions/[id]/match`.
- **Every ops mutation writes an audit log entry with a mandatory reason ≥5 characters** — accountability for plan changes, suspensions and matching. Code: `lib/server/ops.ts` (`recordAuditLog`), `migration_v10_ops.sql`.

## Abuse protection and data volume
- **Public writes are rate-limited in memory per isolate** (`lib/server/rate-limit.ts`): RSVP 10/min, wishes 10/min, invite 60/min, check-slug 30/min, answered with 429 + `Retry-After`. Chosen because no KV/Durable Object binding exists; it stops bursts on a warm isolate but is not a global quota, so a Cloudflare Rate Limiting rule at the edge is still recommended for production.
- **A walk-in RSVP must respect the wedding's plan guest limit** — the public insert path counts guests and returns the same `getGuestLimitMessage` as the dashboard, closing the bypass where unlimited guests could be added to a free wedding. Code: `app/api/rsvp/route.ts`.
- **Every "read all" query paginates with `range()`** (`lib/server/pagination.ts`, 1,000-row pages, chunked `.in()`), because Supabase PostgREST caps a response at 1,000 rows by default and silent truncation corrupts guest lists, dashboard stats and ops consoles. Code: guests/stats/ops routes.
- **Ops counters use `head: true` counts instead of loading rows**, and monthly revenue fetches only paid orders inside the month window. Code: `app/api/ops/stats/route.ts`.
- **Pricing may only describe shipped behaviour** — unimplemented capabilities carry the "Sắp có" badge (templates exclusive, MP3 upload, album, Excel export) while shipped ones (gift QR, 2 images) are stated plainly; the logo row was removed because nothing implements it. Code: `config/pricing.ts`.

## Features built in batch 4
- **Sổ mừng is a Pro/VIP feature** — GET/POST/PATCH/DELETE return 403 for free weddings; totals are computed from the fetched rows (`totalVnd`, `count`, `unthankedCount`), and `thanked` maps to `thanked_at`. Code: `app/api/weddings/[id]/gifts/**`, `config/pricing.ts`.
- **Album is a public, unlisted page** — dashboards upload `kind: "album"`, guests open `/a/<slug>`; the page is `noindex` because it exposes private wedding photos without authentication. Code: `app/a/[slug]/page.tsx`, `app/api/weddings/[id]/photos/route.ts`.
- **Retention deletes free weddings older than 30 days** — `purgeExpiredFreeWeddings()` runs in batches of 50, removes R2 objects first then the row (cascade), and supports `dryRun` via `POST /api/ops/retention/run` with an audit entry. It is scheduled daily at 03:00 UTC through `wrangler.jsonc` `triggers.crons` and `worker-entry.ts`; the custom entry re-exports OpenNext's Durable Objects and adds `scheduled`.
- **Guest list is paginated server-side, 50 per page** — search and status filter run in SQL (`ilike`/`eq`), with `count` for `totalPages`; the legacy no-`page` response shape is preserved for other callers. Code: `app/api/weddings/[id]/guests/route.ts`, `components/dashboard/GuestTable.tsx`.

## Template collection (`/thiep-cuoi`)
- **The registry stays the single source of truth** — `getTemplateCollection()` derives `previewImage` (`/templates/<id>/preview.webp`), `snapshotImage` (`/templates/<id>/snapshot.webp`) and `demoUrl` (`/mau/<id>`, omitted for placeholders), with optional overrides on each entry, and sorts placeholders last.
- **The carousel is flat by design** — cards scale/fade by distance from the selected one (1 / .85 / .72 / .65 and 1 / .65 / .4 / .25) and translate horizontally; no `perspective`/`rotateY`/`translateZ`. Clicking a side card selects it; clicking the selected card (or Enter/Space) opens the preview.
- **The preview is a glass dialog on desktop and a bottom sheet on mobile** — panel `bg-surface` with `supports-[backdrop-filter]:bg-surface/90` + `backdrop-blur-[16px]`, width `clamp(640px,50vw,960px)`, max 85vh; mobile full-width up to 92vh. Focus is trapped, ESC/overlay/Đóng close it, and focus returns to the opening card.
- **The snapshot auto-scrolls via CSS** — distance is measured after load, duration = distance/45 clamped to 12–60s, `alternate` infinite; hover/focus/pause button pause it and `prefers-reduced-motion` disables the animation (frame becomes scrollable).
- **Feature lists live in `config/template-features.ts`** (base + Pro/VIP + optional `extraFeatureIds`), with `comingSoon` flags that mirror `config/pricing.ts` so the popup never promises an unshipped feature.
- **The homepage no longer lists templates** — it shows a teaser with one CTA to `/thiep-cuoi`; the navbar/footer/sitemap link to the collection.

## Designer templates
- **A wedding pins a designer version; it never follows the latest** — assigning writes `designer_template_id` + `designer_template_version`; `/m/<slug>` loads exactly that row from `designer_template_versions`, and the dashboard only changes it through an explicit “Cập nhật lên vN” action. Publishing a new version therefore never mutates a live invitation. Code: `app/api/weddings/[id]/designer-template/route.ts`, `lib/server/designer.ts` (`getPinnedDesignerTemplate`).
- **`template_id` stays as the fallback** — if the pinned version/layout is missing (deleted version, DB without v14/v15), the public page renders the code template as before instead of breaking. Code: `lib/server/public-wedding.ts`, `app/m/[slug]/page.tsx`.
- **Live invitations never show sample placeholder values** — `DesignerTemplateRenderer` has `sampleFallback` (preview: sample values; live: blank when data is missing) so a real guest never sees “White Palace, TP.HCM” from the sample data. Code: `lib/designer-text.ts`, `components/designer/designer-invitation.tsx`.
- **The designer invitation is static for now** — RSVP, map, music, gift and the guest boarding pass are not wired into designer layouts; that is staged as the last TODO B4 item. Code: `components/designer/designer-invitation.tsx`.
- **Designer text has an explicit `align`** (`left` default, `center`, `right`) — without it a centred wedding layout is impossible because text is anchored at `xPct`; the renderer, canvas editor and background export all honour it, and legacy elements without `align` keep the old left look. Code: `components/ops/designer-types.ts`, `components/designer/designer-template-renderer.tsx`, `components/ops/designer-canvas.tsx`.
- **Đào Phấn is the reference finished template** — 3 static pages (Bìa / Nội dung / Cảm ơn), 42 elements, palette `#FAF3F0`/`#5A2B33`/`#7A3B44`/`#8C4A46` with `#B87D74` only for rules/icons, fonts Playfair + The Nautigal + Be Vietnam Pro, all six placeholders used. It is pinned to the throwaway test wedding `aaaaa` (guest slug `998c376174ee`) so the designer path can be exercised without touching real couples. Code/data: `designer_templates` id `22add87b-79d6-490c-a8b8-37f3313e077d` (v2), `weddings.slug = aaaaa`.

## Editor animations and typography
- **Animations are optional JSON on the element** (`animation.in`), so old designs load unchanged and no DB/API change is needed. Only `transform`, `opacity`, `clip-path` and `filter` are animated; the position/rotation wrapper is never touched — `ElementAnimator` is an inner wrapper. Code: `components/ops/designer-types.ts`, `components/designer/element-animator.tsx`.
- **One shared IntersectionObserver drives all entrances** in the public invitation and preview, with `rootMargin: "0px 0px -8% 0px"`, per-element threshold, a 150ms + 120ms/order first-screen stagger, `once`, and a 3s safety fallback. Hidden start states are in the SSR markup and a `<noscript>` style shows everything without JS; `prefers-reduced-motion` forces the final state. Code: `components/designer/element-animator.tsx`, `app/globals.css`.
- **Wipe hides with opacity, not clip-path** — a fully clipped element has an empty IntersectionObserver intersection and would never start.
- **The export still bakes all elements into one 2x background**; per-element animated layers would need new storage/API (a layer table and upload endpoint), which the prompt forbids. Designs without animations are unchanged; animated designs keep animation live in the JSON but the exported background still contains the element. Code: `components/ops/designer-canvas.tsx` (`exportBackground`), TODO B5.
- **Fonts stay on the existing self-hosted families** (9 families already in `app/layout.tsx` with Vietnamese subsets); the panel groups them and provides 6 text-style presets. New candidate families from the prompt (Great Vibes, Allura, Montserrat, Quicksand, Noto Serif…) are not bundled until license/subset are confirmed. Text effects (shadow/stroke/glow/gold gradient) and font sets are Todo B5.
- **The public renderer, editor preview and editor panel share one catalog** (`animation-catalog.ts`, `designer-fonts.ts`) so preset ids and metrics cannot drift.

## Animation Phase 3/4
- **Loop starts after the entrance, never before** — the loop wrapper has `data-loop-ready`; "Vào" completion sets it, and a shared loop manager starts at most the 12 visible loops closest to the viewport center, pausing all loops when the tab is hidden. Code: `components/designer/element-animator.tsx`.
- **Parallax is a CSS variable on its own wrapper** — one passive scroll listener + rAF updates only elements near the viewport; the position/rotation wrapper and the entrance/loop wrappers are untouched. Code: `element-animator.tsx`.
- **Typewriter/wordsIn segment correctly for Vietnamese** — NFC first, `Intl.Segmenter("vi", grapheme)` with `Array.from` fallback; full text stays in the DOM; the reveal is opacity-delay per grapheme/word, not per UTF-16 code unit. Code: `element-animator.tsx`, CSS `.anim-char/.anim-word`.
- **`shimmer` is a generic light band, not yet alpha-masked** — the overlay uses currentColor and is clipped by the element; masking a PNG's own alpha is still open (TODO B5).
- **Falling effect is a live canvas element, never baked** — one canvas per effect, built-in sprites pre-rendered, DPR capped at 2, time-based rAF, off-screen/tab pause, area/hardware count scaling, reduced-motion removes it, editor caps at 2. Code: `components/designer/falling-effect-canvas.tsx`, `falling-effect-presets.ts`.
- **Custom particle sources use existing assets** — up to 4 sources (preset/icon/image); image upload goes through the existing `/api/ops/designer/assets` R2 route after client downscale to 256px/≤512KB, icons are canvas paths, and each particle picks a source at random. Code: `components/ops/designer-falling-panel.tsx`, `components/designer/falling-effect-canvas.tsx`.
- **Editor preview is partial** — "Phát thử" opens the preview page (which runs the same engine); "Phát tất cả", selected-element replay, icon color picker, and the animated badge are not built.

## Animation Phase 5
- **Exit is a separate wrapper outside entrance** — the observer sets `data-anim-out-play` when the element leaves; `once=false` resets and replays entrance on return only after a real leave (`leftRef`), not on every visible callback. Code: `components/designer/element-animator.tsx`.
- **Exit/replay is driven by one shared observer** — no per-element scroll listener; reduced-motion disables out so content never disappears.
- **Shimmer masks the band with the image's own alpha** — renderer passes `shimmerMaskUrl` for image/photo; CSS uses `mask-image` with `contain`; text keeps the generic currentColor band.
- **Auto-apply is a one-click tool** — `fadeIn` for every static element with 120ms stagger, skipping falling effects; it overwrites existing `in` animations. Multi-select and applying a chosen preset to several selected elements are still open.
- **`fill` is explicit** — inner animation wrappers only use `h-full` for fixed-height elements (box/photo/block); text/image wrappers are `w-full` so the IntersectionObserver measures their real height. Before this, text/image exit did not fire because the wrapper stretched to the page.
- **Animated badge** is rendered on the selected canvas element; there is no separate layers panel yet.

## Ops auth paths
- **`/ops` is a client shell; the canvas is data** — the layout calls `/api/ops/me` with a Bearer access token, while the old server canvas used `getAuth0().getSession()` (cookie). A valid Bearer token can therefore enter `/ops` while a missing RSC cookie still 404s the canvas. The canvas and preview are now client pages that fetch through `GET /api/ops/designer/templates/[id]` with Bearer; `opsDesignerRoute` remains the security boundary. Code: `app/ops/designer/[id]/page.tsx`, `app/ops/designer/[id]/preview/page.tsx`, `lib/ops-api.ts`.
- **Do not reintroduce a server cookie guard just for the canvas** unless Auth0 session cookies are verified in production RSC; the API guard is the source of truth. If server-rendered data is needed later, fix the Auth0 cookie/domain (`APP_BASE_URL`, callback URLs, `AUTH0_SECRET`) first.

## Public designer catalog
- **Published designer templates are part of the main collection, not a separate catalog** — they are appended/prepended into `TemplateCarousel` on the homepage and `TemplateGridBrowser` on `/thiep-cuoi`, alongside the 25 code templates. The separate “Thiệp được thiết kế riêng” homepage section is removed (future work). Code: `components/templates/live-template-collection.tsx`.
- **Publish must save the current canvas first** — the publish API snapshots the stored `canvas_json`; without a PATCH, animation/typography edits made after the last “Lưu” are lost. `publish()` now PATCHes `{...content, pages}` before POSTing publish.
- **Designer items carry their own embed URL** (`/mau/designer/<id>/embed`) so hover/popup use the published version, while code templates use `/mau/<id>?embed=1`; the CTA for a designer item goes to the dashboard.

- **Preview auto-scroll uses a body transform, not native scroll** — code templates lock body/html scrolling when embedded, so `window.scrollTo`/`scrollTop` are no-ops. The parent translates `iframe.contentDocument.body` by `-progress * (scrollHeight - innerHeight)` and resets on leave/close; this also avoids scrollbars. Code: `lib/frame-scroll.ts`, `components/templates/template-carousel.tsx`, `template-preview-dialog.tsx`, `components/landing/designer-*.tsx`.
- **Scrollbars are hidden in embeds** via `scrollbar-width:none` and `::-webkit-scrollbar{display:none}` on html/body, plus `.no-scrollbar` on the popup frame.
- **Published designer templates are now a public catalog** (`/mau-thiep` + homepage section). The API only exposes published templates and metadata; it does **not** expose `canvas_json` (draft safety). Code: `app/api/public/designer-templates/route.ts`, `components/landing/designer-showcase.tsx`.
- **Homepage stays static; the catalog is a client island** that fetches after mount. This avoids DB at build and keeps the landing page static. The section is hidden when nothing is published.
- **Preview is an iframe of the real invitation** (`/mau/designer/[id]/embed`), not a screenshot. Desktop hover mounts one iframe and scrolls it top-to-bottom; mobile shows the cover (first page) and only falls back to iframe if the cover fails. The popup mounts a larger iframe, auto-scrolls, and plays `/media/wedding.mp3` (autoplay may require the user to press “Bật nhạc”).
- **Per-template music is not stored yet** — the popup uses one default track. If templates need different music, add a `music_key` to `designer_templates` and an upload endpoint.
- **“Dùng mẫu này” opens the dashboard**, where the customer assigns the designer template to a wedding; there is no direct checkout/assignment from the catalog yet.
- **Performance choice:** decorative fonts no longer preload (`preload:false`), only Be Vietnam Pro + Playfair do; covers are lazy; iframes are hover/click-only. The catalog API is edge-cached 60s, so a publish appears within ~1 minute.

## Capacity and caching
- **Workers Paid is the production baseline; R2 Free and Supabase Free are enough for 100 DAU** — free Workers is capped at 10 ms CPU, which Next SSR and the retention cron can exceed (Error 1102); request/day (100k) and bundle (16.7 MiB < 64 MiB uncompressed) are not the constraint. Code/config: `PRODUCTION_CAPACITY.md`.
- **Public data is cached by identity, not by "latest"** — R2 media keys and published designer versions are immutable, so `caches.default` can store them safely; the cache is per data center and falls back to the origin if unavailable (Node/`next start` has no Cache API). Code: `app/media/[...key]/route.ts`, `lib/server/designer.ts`, `lib/server/edge-cache.ts`.
- **Cache API is not a request-cache** — it avoids R2/DB reads but still invokes the Worker. To cut Worker invocations at higher traffic, add a Cloudflare Cache Rule for `/media/*` and consider short-TTL HTML caching with purge; neither is enabled yet.
- **One Supabase client per isolate** — the service-role client is stateless (no session persistence), so recreating it per query was pure allocation/CPU overhead. Code: `lib/server/supabase.ts`.
- **Metadata and page share one public-wedding read** — `cache()` from React dedupes the guest/wedding fetch within the RSC request. Code: `app/m/[slug]/page.tsx`, `app/w/[slug]/page.tsx`.
- **Monitoring thresholds**: Supabase 80% of 500 MB/5 GB, R2 80% of 10 GB/1M A/10M B, Cloudflare CPU 1102 and 100k/day. Migration triggers and options are in `PRODUCTION_CAPACITY.md`.

## Build and deploy
- **`critters` is a local stub, not the real package** — Next 16's middleware runtime references `critters` statically even when `experimental.optimizeCss` is off, and OpenNext's Node-middleware bundle does not externalize it. Installing the real package adds 12 packages + ~250 KiB gzip to the Worker for dead code, so `vendor/critters-stub` is wired as a `file:` dependency and throws a clear error if `optimizeCss` is ever enabled. `.npmrc` sets `install-links=true` because npm's junction is copied by OpenNext as a broken relative symlink. Code: `vendor/critters-stub/`, `package.json`, `.npmrc`.
- **Deploy on Windows needs `node_modules\@esbuild\win32-x64\esbuild.exe` at Medium integrity** — a Low mandatory integrity label (sandbox/agent stamp) makes esbuild unable to write `open-next.config.mjs` to `%TEMP%`, failing the build with `Access is denied`. The labels were reset with `icacls ... /setintegritylevel Medium /T`; see `env-and-deploy.md` if it recurs.

## Fonts, rendering and tooling
- **All typography is self-hosted with `next/font`** — the six decorative families used by `theme-configs.ts` (Playfair Display, EB Garamond, Viaoda Libre, Pinyon Script, The Nautigal, Carattere) plus Be Vietnam Pro, Cormorant Garamond and Lora are declared in `app/layout.tsx` and exposed as CSS variables; `theme-configs.ts` references `var(--font-*)` instead of literal family names, and the render-blocking `@import` was removed.
- **The landing page is static** — `app/page.tsx` no longer reads cookies/Auth0; the client calls `/auth/profile` via `useUser()`. The theme cookie is applied by a tiny inline script in `<head>` before paint, and `ThemeProvider` syncs its state from the DOM after hydration, so static pages keep the user's light/dark choice without a flash.
- **ESLint uses the Next 16 flat config** (`eslint-config-next/core-web-vitals` + `/typescript`); `react-hooks/set-state-in-effect` is downgraded to `warn` because the invitation templates intentionally sync props into state, and that refactor is tracked in TODO.
- **Gallery images are capped at 1600px** (was 2048) in the client compressor; there is still no responsive srcset.

## Security headers and tests
- **HSTS (2 years, includeSubDomains, preload) and a permissive CSP are set in `next.config.ts`** — the CSP allows the inline Next.js bootstrap, Framer Motion inline styles, Google Fonts, Turnstile and Cloudflare Analytics, and limits frames to self + Google Maps. It is intentionally permissive (`'unsafe-inline'`) because the app cannot use nonces today; tighten only after moving to nonce-based script loading. Verify in a real browser after deploy, since curl cannot catch CSP violations.
- **Pure helpers are unit-tested with `node:test`** — rate limiting (per-IP buckets, 429 + Retry-After), pagination (`fetchAllRows`, `chunkIds`), VietQR payload + order codes + `safeEqual`. DB-backed routes are not unit-tested yet; they need a test database or a Supabase mock.

## Security model
- **The browser never talks to Supabase** — there is no Supabase JS client in components; all reads/writes go through Next API routes that use the secret key, and RLS has no policies plus `revoke all` for `anon`/`authenticated`. Code: `lib/server/supabase.ts`, `migration_v2.sql`.
- **Owner auth is a Bearer JWT verified with `jose` (RS256, issuer + audience checked)** — `proxy.ts` guards `/dashboard` with the Auth0 session cookie, and the API trusts only the verified token. Code: `lib/server/auth.ts`, `proxy.ts`.
- **Ops access is a role model on top of the same JWT** — `ADMIN_EMAIL`/`ADMIN_EMAILS` are bootstrap super-admins (cannot be demoted from the UI); `ops_members` (migration v16) grants `admin` or `designer` by email, with admin able to change roles at `/ops/roles`. Code: `lib/server/ops.ts` (`resolveOpsRole`, `opsRoute`, `opsDesignerRoute`), `app/api/ops/roles`.
- **Designer sees only Template + Thiết kế mẫu** — enforced in three layers: sidebar filtering, client layout redirect for any `/ops` path outside those prefixes, and server-side `opsDesignerRoute` / `requireOpsPageRole` guards. Admin sees every tab plus Phân quyền. Code: `lib/ops-roles.ts`, `components/ops/OpsSidebar.tsx`, `app/ops/layout.tsx`, `app/api/ops/**`.
- **The Template tab manages published designer templates, not customer weddings** — each card is a design running in production; ops/designer can rename the internal design (`name`), edit the customer-facing title (`display_title`), upload a cover (`snapshot_key` + `designer_assets` kind `snapshot`), and see how many live weddings pin it. This keeps the designer role away from couple/guest personal data. Code: `app/ops/templates/page.tsx`, `lib/server/designer.ts` (`listProductionDesignerTemplates`).
- **Ops fails closed and never shows fabricated data** — when neither env admin nor an `ops_members` role exists, `/api/ops/me` reports `role: null` and every ops page 404s; there is no localStorage fallback, so API errors surface instead of being replaced by mock rows. Code: `app/api/ops/me/route.ts`, `lib/ops-api.ts`.

## Media and lifecycle
- **Single-slot photos are replaced on the server after a successful upload** — the new object is written and the new row inserted first, then the previous row and its R2 object are deleted; the replaced row is found through `content.heroPhotoId/groomPhotoId/bridePhotoId` so legacy rows with non-zero positions still work. This avoids the data loss of delete-first and never leaves the slot empty. Code: `app/api/weddings/[id]/photos/route.ts`.
- **A suspended wedding is indistinguishable from a missing one for guests** — public pages, the public API, the invite API, RSVP and wishes all return not-found/403. Chosen over a dedicated "locked" page so a suspension cannot be used to confirm that a private invitation exists. Code: `lib/server/weddings.ts`, `lib/server/public-wedding.ts`, `app/api/rsvp`, `app/api/wishes`.
- **Miniflare/workerd only starts for `next dev`** — production builds and the deployed Worker get bindings from Cloudflare, so starting the local Workers runtime during `next build` only adds failure modes and build time. Code: `next.config.ts`.

## Template motion (Motion v14)
- **Templates use `m` + one `LazyMotion`, not `motion`** — the engine is the former Framer Motion (renamed to Motion; npm `motion` is a wrapper whose only runtime dependency is `framer-motion`), so this was a rename plus a smaller feature bundle, not a second library. Code: `components/theme/MotionProvider.tsx`.
- **The provider sits at the two render boundaries, not the root layout** — every template mount goes through `TemplatePreviewRenderer` (real invitation, preview, demo, dashboard, landing hero), while `LiveTemplateRenderer`'s `basic-1` branch renders the invitation tree directly and needs its own. Wrapping the root layout would charge the landing/dashboard/ops routes ~34KB gzip of animation they never use.
- **`domAnimation` is sufficient** — no template uses `layout`, `layoutId` or Motion `drag`, so `domMax` is not needed; re-check this if a template adds layout animation.
- **Measured engine cost** (esbuild, identical imports, minified + gzip): `motion` 48.9KB → `m` + `domAnimation` 33.6KB, i.e. −31%. `m` alone is ~5KB; the rest is the feature set.
- **The designer canvas stays on CSS keyframes** — its animation is JSON that the editor preview, the public page and the publish snapshot all read; Motion props are live React state and cannot be serialised or versioned that way. Never animate one element with both `m` and the designer CSS vars — two transforms collide.
- **`strict` is deliberate** — there are no DOM tests, so a missing provider would otherwise silently drop animation; it now throws at render, which the static prerender of `/` and the `/mau/<id>` smoke test catch.

## Template "Đỏ - truyền thống" (`do-truyen-thong`, 2026-11-18)
- **Custom code template, không dùng `ThemedTemplate`** — thiết kế cần bìa hai cánh, ảnh vòm, coverflow album và lịch trình; `ThemedTemplate` không có section schedule và album mặc định là grid. Đây là mẫu thứ 5 đi theo hướng custom (cùng nhóm `nau-toi-gian`, `do-may-man`…).
- **Lịch trình đọc thẳng `data.timeline`** (WeddingInfoEditor đã cho thêm/xoá tối đa 6 mục) — không hardcode giờ trong template, để khách sửa ở dashboard.
- **QR album gate ba lớp**: `plan !== "free"` + có `weddingSlug` + `!hiddenSections.has("albumQr")`. Free ẩn hẳn; Pro/VIP bật tắt bằng toggle có sẵn của dashboard, không thêm UI mới.
- **Meal lock nằm trong `TemplateRsvpSection`**, không tạo form RSVP mới (card_exp §10) — `meat`/`veg` khoá một lựa chọn, `both` cho chọn; `RsvpWishBlock` đã có cùng quy tắc nên hai hệ không lệch.
- **Bìa ở chế độ `contained` phải neo `items-start`** — bìa là `absolute inset-0` phủ toàn bộ trang dài; căn giữa sẽ đẩy khối chữ ra ngoài khung điện thoại (lỗi đã gặp khi preview).
- **Ảnh lazy phải khai báo `width`/`height`** (hộp quà 760×760) — nếu không, ảnh dưới màn hình đầu có chiều cao 0 và layout nhảy khi tải.
- **Ảnh mockup không dùng làm nền thiệp** (card_exp §2): nền đỏ/vòm/khung đều dựng bằng CSS; chỉ hộp quà là asset thật đã tách nền.
- **VietQR tự sinh là quyền Pro/VIP, không phải Free** (2026-11-18) — trước đây `GiftModal` sinh VietQR từ số tài khoản cho mọi gói, làm mất giá trị Pro. Nay Free chỉ thấy số tài khoản/lời chúc; Pro/VIP thấy VietQR, trừ bên nào đã tự tải ảnh QR (khi đó ẩn VietQR của bên đó). Quy tắc: `showVietQr = plan !== "free" && có bên chưa có ảnh QR`. Code: `components/invitation/GiftModal.tsx`.
- **Hiệu ứng cuộn chỉ một kiểu "fade-in up", chạy một lần** theo `animation_guide` — `SectionReveal` bọc từng section; không có ambient motion sau khi hiện, để giữ chất truyền thống trang trọng.
- **Một ngày chỉ hiện 2 lần** (2026-11-18): khối "Sự kiện" và "Thông tin tiệc cưới". Khối gia đình/hero/footer không lặp ngày. Quy ước này ghi trong `card_exp.md` §20.
- **Dấu `&` phải mở đầu dòng khi xuống dòng** — dòng phụ huynh được tách tại `&` thành 2 dòng; tên cô dâu chú rể luôn 3 dòng. Ghi trong `card_exp.md` §20.

## Giới hạn lượt xem thiệp Free (2026-11-18)
- **Đếm MỖI lượt mở**, không đếm unique browser — nghiệp vụ là "mỗi link custom có 30 lần xem tất cả". Trước đó dùng cookie `invite_view_key` nên cùng một máy mở 100 lần vẫn chỉ tính 1, khách không thấy giới hạn.
- **Phạm vi**: chỉ link cá nhân `/m/<guestSlug>` của gói Free. `/w/<slug>` với gói Free đã bị chặn hẳn ("Link công khai chỉ dành cho gói Pro").
- **Ngưỡng**: cho 30 lượt, lượt thứ 31 trả `FreeInviteLimit` (vẫn dùng được hộp quà + gửi lời chúc).
- **Bot/Zalo/Facebook preview không tính** (`isLikelyCrawler`), để share link không đốt lượt.
- **Fail-open**: thiếu RPC/migration thì trả `null` và cho qua — không làm sập thiệp thật. Vì vậy migration v17 phải chạy mới có hiệu lực.
- **UI**: dòng nhắc + nút "Nâng cấp lên gói Pro" nằm ngay dưới thanh tìm kiếm trong tab Khách mời, chỉ hiện với gói Free.

## Template capabilities (2026-11-18)
- **Dashboard chỉ hiện điều khiển cho phần template thật sự có** — nguồn duy nhất `config/template-sections.ts` (`getTemplateSections(templateId)`), gồm `sections`, `couplePhotos`, `hostFirst`. Template mới khai báo ngoại lệ trong `TEMPLATE_OVERRIDES`, không sửa dashboard.
- **Key `hiddenSections`/`sectionOrder` phải khớp tuyệt đối giữa dashboard và template.** Lỗi đã gặp: template dùng `events`, dashboard dùng `map` → section bị đẩy xuống cuối (order 99) và nút ẩn/hiện vô tác dụng. Key chuẩn: family · calendar · map · dresscode · album · albumQr · gift · rsvp · music.
- **`hostFirst` do template quyết định** — dashboard chỉ lưu `"groom" | "bride"`; template phải tự đổi thứ tự cột (trước đây `do-truyen-thong` bỏ qua nên nút bấm không có tác dụng).
- **Một nút nâng cấp chỉ đặt một chỗ** trong mỗi khối; không lặp ở header và không thêm dòng "Chỉ gói Pro/VIP" khi đã có nút.

## Template "Long Phụng" (2026-11-18)
- **Bảng màu chính thức:** `main #69100F`, `text #E9CE91` (khách cung cấp). Suy ra nền `#2A0605`, card đậm `#4A0B0A`, vàng đậm `#C6A45E`. Ban đầu `color_code.txt` rỗng nên đã sample tạm từ mockup; khi có mã chính thức thì thay toàn bộ — **luôn ưu tiên mã khách đưa hơn màu sample**.
- **Ruột thiệp nền đỏ trầm**, không dùng kem: mockup pic1–pic4 đều đỏ, và mô tả cũng nói đỏ là màu nền chủ đạo "ở cả bìa lẫn các mảng khối bên trong". Kem chỉ dùng cho chữ.
- **Charm/Srisakdi bị thay bằng Cormorant Garamond italic**: hai font mô tả yêu cầu không có glyph tiếng Việt; ưu tiên không vỡ dấu hơn là đúng tên font.
- **Tone `velvet`** được thêm vào bộ tone dùng chung (RSVP, gift, nút nhạc) thay vì hard-code trong template, để mẫu sau dùng lại được; tone `red` cũ giữ nguyên cho `do-truyen-thong`.
- **Rồng/phượng tách từ một ảnh đen**: dò đường viền bằng cột/hàng sáng >80% chiều cao, rồi `luminance → alpha` để có line-art trong suốt — asset gốc 7,4MB xuống còn ~85KB/ảnh.
- **Gạch trang trí tiêu đề đặt trên/dưới**, không hai bên: khung preview 390px trên desktop vẫn có viewport 1280 nên `sm:` sẽ bật gạch hai bên và làm tiêu đề xuống dòng.

## Template "Đỏ Rượu Vang" (2026-11-18)
- **Màu:** `#390202` nền + `#E5E4D0` chữ (khách đưa). Dòng `golder outline: #390202` trong `color_code.txt` là **lỗi copy** (viền trùng màu nền) → dùng champagne `#E5C787` theo mô tả; burgundy `#6E0B14`/`#8F111D` cho nền thẻ.
- **Font tên:** Playfair italic, không dùng Pattaya (thiếu glyph tiếng Việt, và mockup cũng là serif).
- **Ruột tối**, không phải trắng kem như mô tả — cả 4 mockup đều nền rượu vang.
- **Album: coverflow** theo mockup, dù mô tả ghi "editorial grid". Lý do: mockup là ảnh thật của mẫu, và mẫu Long Phụng đã dùng lưới nên cần khác biệt. Nếu khách muốn lưới, đổi 1 component là xong.
- **Tone `ruby`** dùng chung thay vì hard-code, để mẫu đỏ-trầm sau này tái sử dụng.
- **Đếm ngược render sau khi mount** (state `now = null` lúc đầu) để không lệch hydration giữa server và client.
- **Asset hoa:** kiểm tra bằng ảnh ghép trên nền thật trước khi dùng; quy trình key + 3 cái bẫy ghi ở `card_exp.md` §22.23.

