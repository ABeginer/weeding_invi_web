# Open items

## Handoff
- Last task (2026-11-14): **batch 2 completed** at git `db98d6c`; skill updated after it. `tsc --noEmit` + `eslint .` clean, `next build` succeeds, and a `next start` smoke test passed against the real database (`/`, `/w/huy-huiya`, `/m/56b24d81c86c`, `/api/public/wedding/huy-huiya`, `/api/invite/...`, `/dashboard` 307, `/ops` fail-closed, 404 paths, rate-limit 429).
- Owner action required now: run `supabase/migration_v11_guest_preferences.sql` (new columns `guests.song_request`, `guests.ride_needed`). Until then RSVP writes silently fall back and song/ride preferences are not persisted.
- In progress: nothing.
- Next step: batch 3 — repository hygiene (`.open-next` committed), stale docs (README/HANDOFF/DESIGN_PLAN/TODO), test script + CI, ops error states instead of empty lists, guests UI pagination, retention implementation, and the Sổ mừng / Album build decision.

## Fixed in batch 2 (git `db98d6c`)
- Public RSVP now enforces the wedding's plan guest limit (free = 20) before inserting a walk-in guest.
- `songRequest` / `rideNeeded` are persisted (migration v11 + graceful fallback), returned by `/api/invite/[slug]`, prefilled through every template, and shown in the dashboard.
- `map_embed_url` is no longer wiped on event edit: the client sends the existing value and the API keeps the column when the key is absent.
- Public writes are rate-limited in memory (RSVP/wishes 10/min, invite 60/min, check-slug 30/min) with 429 + `Retry-After`.
- Reads no longer truncate at 1,000 rows: `lib/server/pagination.ts` pages with `range()` and chunks `.in()` (guests, dashboard stats, ops lists); ops stats uses head counts and a month-bounded revenue query.
- Pricing copy matches shipped features; `/w/[slug]` is `noindex`; `.env.example` documents every variable name.
- Owner replaced the Supabase secret key, so local DB flows work again.

## Known issues (still open, verified)
1. **Retention is a promise without implementation** — free plan advertises 30 days (owner re-confirmed on 2026-11-14) but there is no cron/cleanup job. Implementing deletion is destructive and needs explicit approval plus a scheduled mechanism (Cloudflare Cron Trigger) or a documented manual job.
2. **Guests UI still loads the whole list** — the API no longer truncates, but `GuestTable` fetches every guest and filters client-side; a Pro wedding with thousands of guests will be heavy. Real pagination needs API params + UI.
3. **Ops pages swallow API errors** — most `app/ops/*` pages catch a failed request and render an empty list/zero counters, which looks like "no data" instead of an error banner.
4. **Sổ mừng and Album are hidden, not built** — both need a decision: implement (`gifts` route + table; `album` in the DB check constraint, `VALID_KINDS`, `MEDIA_KEY_RE`) or remove the remaining code.
5. **Duplicate accounts** — the live `users` table already has the same email under `auth0|…` and `google-oauth2|…`; `POST /api/ops/users/[id]/merge` does not exist and the merge UI is hidden.
6. **Unknown schemas** — `orders`, `bank_transactions`, `gifts` are still not created by any committed migration (the owner confirmed the committed migrations are applied, so these were either created manually or are missing).
7. **Docs are stale** — `HANDOFF.md` (removed `/admin/*`, mock `lib/api.ts`, `WishForm.tsx`), `DESIGN_PLAN.md`, `TODO.md` (Cormorant as display font, migrations "chưa chạy"), `README.md` (UTF-16 one-liner).
8. **Repository hygiene** — 2,342 committed `.open-next/` files (~53 MB) plus `.wrangler/` and `scratch/`; `.gitignore` does not exclude them.
9. **No test entry point / CI** — `tests/*.test.ts` use `node:test`, but `package.json` has no `test` script and no runner is installed; `eslint-config-next` is 15.x while `next` is 16.x.
10. **Production env gaps** — `APP_BASE_URL` is still `http://localhost:3000` (canonical/OG/sitemap would point at localhost) and `BANK_*` is unset locally.
11. **`next dev` needs workerd** — `next.config.ts` starts Miniflare only in development, so a sandboxed agent cannot run `next dev`; verification uses `next build` + `next start`.

## Still blocked on the owner
1. Run `supabase/migration_v11_guest_preferences.sql`.
2. Confirm the sellable feature set (or approve the current pricing copy).
3. Decide Sổ mừng / Album: build or remove.
4. Approve retention implementation (destructive deletion) and the schedule.
5. Provide `BANK_*` values when the payment flow should be exercised locally.

## Deliberately not stored here
- Secret values, tokens, bank account numbers, real personal emails, and `.env*` contents.
- Debugging chatter or one-off shell output.
- Facts that a single file read answers — a pointer to the file is recorded instead.
