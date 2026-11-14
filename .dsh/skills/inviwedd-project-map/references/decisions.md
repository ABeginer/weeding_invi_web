# Decisions

Each entry: decision → reason → where it lives in code. "Owner" means the repository owner stated it; "code" means it is only inferable from the repository.

## Product and plans
- **The plan is stored on the wedding, not on the user** — one account can own several weddings with different plans, and an order upgrades exactly one wedding. Code: `weddings.plan`, `lib/server/owner.ts`, `app/api/orders`.
- **Prices are 199,000 đ (pro) and 399,000 đ (vip)** — defined once in `lib/server/payments.ts` (`PLAN_PRICES`); display copy in `config/pricing.ts` must match. Code, owner confirmed prices live in `payments.ts`.
- **Free plan limits: 1 wedding, 20 guests, 2 events, 5 gallery photos, 0 gift QR** — the free tier exists to convert to Pro. Code: `config/plans.ts`.
- **Pro: unlimited weddings/guests, 10 events, 30 gallery, 30 album, 2 gift QR. VIP: 20 events, 30 gallery, 300 album, 2 gift QR.** Code: `config/plans.ts`.
- **Free-plan data retention is 30 days** — owner decision, kept because it drives Pro upgrades; do not change it without asking. Implementation status: **not implemented anywhere** (no scheduler, cron or cleanup job in the repo). Advertising copy: `config/pricing.ts` ("30 ngày" / "1 năm" / "Vĩnh viễn").
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

## Security model
- **The browser never talks to Supabase** — there is no Supabase JS client in components; all reads/writes go through Next API routes that use the secret key, and RLS has no policies plus `revoke all` for `anon`/`authenticated`. Code: `lib/server/supabase.ts`, `migration_v2.sql`.
- **Owner auth is a Bearer JWT verified with `jose` (RS256, issuer + audience checked)** — `proxy.ts` guards `/dashboard` with the Auth0 session cookie, and the API trusts only the verified token. Code: `lib/server/auth.ts`, `proxy.ts`.
- **Ops access is an email allowlist on top of the same JWT** — no separate admin role table. Code: `lib/server/ops.ts`.
- **Ops fails closed and never shows fabricated data** — when `ADMIN_EMAIL` is unset, `/api/ops/me` reports `isAdmin: false` and every ops page 404s; there is no localStorage fallback, so API errors surface instead of being replaced by mock rows. Code: `app/api/ops/me/route.ts`, `lib/ops-api.ts`.

## Media and lifecycle
- **Single-slot photos are replaced on the server after a successful upload** — the new object is written and the new row inserted first, then the previous row and its R2 object are deleted; the replaced row is found through `content.heroPhotoId/groomPhotoId/bridePhotoId` so legacy rows with non-zero positions still work. This avoids the data loss of delete-first and never leaves the slot empty. Code: `app/api/weddings/[id]/photos/route.ts`.
- **A suspended wedding is indistinguishable from a missing one for guests** — public pages, the public API, the invite API, RSVP and wishes all return not-found/403. Chosen over a dedicated "locked" page so a suspension cannot be used to confirm that a private invitation exists. Code: `lib/server/weddings.ts`, `lib/server/public-wedding.ts`, `app/api/rsvp`, `app/api/wishes`.
- **Miniflare/workerd only starts for `next dev`** — production builds and the deployed Worker get bindings from Cloudflare, so starting the local Workers runtime during `next build` only adds failure modes and build time. Code: `next.config.ts`.

