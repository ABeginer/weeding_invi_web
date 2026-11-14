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
- **Ops access is an email allowlist on top of the same JWT** — no separate admin role table. Code: `lib/server/ops.ts`.
- **Ops fails closed and never shows fabricated data** — when `ADMIN_EMAIL` is unset, `/api/ops/me` reports `isAdmin: false` and every ops page 404s; there is no localStorage fallback, so API errors surface instead of being replaced by mock rows. Code: `app/api/ops/me/route.ts`, `lib/ops-api.ts`.

## Media and lifecycle
- **Single-slot photos are replaced on the server after a successful upload** — the new object is written and the new row inserted first, then the previous row and its R2 object are deleted; the replaced row is found through `content.heroPhotoId/groomPhotoId/bridePhotoId` so legacy rows with non-zero positions still work. This avoids the data loss of delete-first and never leaves the slot empty. Code: `app/api/weddings/[id]/photos/route.ts`.
- **A suspended wedding is indistinguishable from a missing one for guests** — public pages, the public API, the invite API, RSVP and wishes all return not-found/403. Chosen over a dedicated "locked" page so a suspension cannot be used to confirm that a private invitation exists. Code: `lib/server/weddings.ts`, `lib/server/public-wedding.ts`, `app/api/rsvp`, `app/api/wishes`.
- **Miniflare/workerd only starts for `next dev`** — production builds and the deployed Worker get bindings from Cloudflare, so starting the local Workers runtime during `next build` only adds failure modes and build time. Code: `next.config.ts`.

