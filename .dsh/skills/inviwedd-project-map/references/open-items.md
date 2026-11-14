# Open items

## Handoff
- Last task (2026-11-14): batch 1 (8 blockers) completed at git `0c3c7e5`; skill updated after owner answers (this revision). `tsc --noEmit` + `eslint .` clean, `next build` succeeds, `next start` smoke test passed.
- Blocking local verification: `SUPABASE_SECRET_KEY` is rejected by the project (`Unregistered API key`). URL is correct; the key does not belong to it. Owner must paste the current secret key. Nothing DB-backed can be tested until then.
- In progress: nothing.
- Next step: batch 2 — public RSVP guest-limit enforcement + rate limiting, persist `songRequest`/`rideNeeded` (new columns + RSVP write + mapper), stop wiping `map_embed_url`, pricing copy, pagination, `/w` noindex, `.env.example`, and implementation of the 30-day retention.
- Files likely touched next: `app/api/rsvp/route.ts`, `lib/server/mappers.ts`, `supabase/` (new migration), `config/pricing.ts`, `lib/ops-api.ts`, `components/dashboard/*`, `app/w/[slug]/page.tsx`.

## Owner answers received (2026-11-14)
- **Migrations:** all migration files committed in this repository have been applied to the live project. Recorded as APPLIED in `db-schema.md`.
- **Auth0:** the SDK configuration is present in the local env — `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`.
- **Bank webhook sender:** a Google Apps Script project (hosted in Google Apps Script, source not in this repository).
- **Ops admin:** `ADMIN_EMAIL` is configured with the owner's admin address (value not stored here).
- **Retention:** the 30-day free-plan retention commitment stays.

## Fixed in batch 1 (git `0c3c7e5`)
1. Sổ mừng has no backend → nav entry removed and the page explains the feature is not ready. **Still not implemented** (no `gifts` route/table); restoring it needs a real route + migration.
2. Album upload could never succeed → the upload control is disabled with a clear message. Still needs `album` in the DB check constraint, `VALID_KINDS` and `MEDIA_KEY_RE` before re-enabling.
3. Bulk event assignment called a missing route → now uses `/api/weddings/[id]/guests/[guestId]/events`.
4. Replacing a hero/portrait photo deleted the old file first → server inserts the new photo, then deletes the replaced row; content ids drive the replacement so legacy positions do not break.
5. Turnstile could permanently lock the form → failed script loads are retryable and show a visible error.
6. `/m/[slug]` discarded server-rendered data → renders from `initialData` immediately; the per-guest request only hydrates status/plus-ones/diet.
7. Ops console showed fabricated data → mock fallback removed, `/api/ops/me` fails closed when `ADMIN_EMAIL` is unset, merge button hidden.
8. `suspended` was never enforced → blocked on public pages, public API, invite API, RSVP and wishes.

## Known issues (still open, verified)
9. **Public RSVP bypasses the guest limit** — inserting a guest by `weddingSlug` in `/api/rsvp` does not check `plan.guests`; only the dashboard routes do.
10. **`songRequest` / `rideNeeded` are collected and dropped** — sent by both RSVP components, never read by the server, no columns exist; the dashboard panel stays empty.
11. **`map_embed_url` is wiped on every event edit** — `EventsManager` sends `mapEmbedUrl: null` unconditionally.
12. **Pricing copy contradicts the code** — "3 mẫu" free vs 23 selectable free templates; VIP "mẫu độc quyền" while `vip-1` is a placeholder; "Tải nhạc MP3 lên" has no field/UI/route; gift QR is sold as "Sắp có" but ships. The retention row is correct as a promise and needs implementation, not a copy change (owner decision).
13. **No rate limiting on any public endpoint** (`/api/rsvp`, `/api/wishes`, `/api/invite/[slug]`, `/api/weddings/check-slug`).
14. **Ops lists load every row then paginate in memory**, and `.limit(2000)` on guests exceeds the Supabase PostgREST default cap of 1,000 rows.
15. **`/w/[slug]` has no `robots: noindex`** (only `robots.txt` disallows it).
16. **Docs are stale** — `HANDOFF.md`, `DESIGN_PLAN.md`, `TODO.md` describe removed `/admin/*` routes, a mock `lib/api.ts`, `WishForm.tsx`, and Cormorant as display font; `README.md` is a UTF-16 one-liner.
17. **Repository hygiene** — 2,342 committed `.open-next/` files (~53 MB) plus `.wrangler/` and `scratch/`; `.gitignore` does not exclude them.
18. **No test entry point / CI** — `tests/*.test.ts` use `node:test` but `package.json` has no `test` script and no runner is installed.
19. **Supabase secret key rejected (blocks local DB testing)** — URL is the correct project; the `sb_secret_` key returns `401 Unregistered API key`, so every DB-backed route 500s locally. Owner must replace the key. Not caused by code changes.

## Still blocked on the owner
1. Do `orders`, `bank_transactions` and `gifts` exist in the live project, and with what schema? No committed migration creates them.
2. Confirm the sellable feature set so `config/pricing.ts` can be rewritten to match reality.
3. Should Sổ mừng and Album be built now (route + migration) or stay hidden?
4. Paste the current Supabase secret key for this project (Dashboard → Project Settings → API Keys) so DB flows can be verified.
5. Provide `BANK_*` values when the payment flow should be exercised locally.

## Deliberately not stored here
- Secret values, tokens, bank account numbers, real personal emails, and `.env*` contents.
- Debugging chatter or one-off shell output.
- Facts that a single file read answers — a pointer to the file is recorded instead.
