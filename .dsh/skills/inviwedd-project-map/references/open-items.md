# Open items

## Handoff
- Last task (2026-11-14): **batch 3 completed** at git `b06ebad`; skill updated after it. `tsc --noEmit`, `eslint .`, `node:test` (8/8) and `next build` all pass; `next start` smoke test passed (`/`, `/w/huy-huiya`, `/m/56b24d81c86c`, `/api/invite/...`, `/api/ops/me` 200 with `isAdmin:false`, `/dashboard` 307, `/ops` 200, `/w/ab` 404).
- Owner action still required: run `supabase/migration_v11_guest_preferences.sql` (columns `guests.song_request`, `guests.ride_needed`). Until then RSVP writes fall back and song/ride preferences are dropped.
- In progress: nothing.
- Next step: product decisions (Sổ mừng / Album / retention), then engineering follow-ups in `TODO.md` (guests UI pagination, remove dead ops mock, CSP/HSTS, font imports, dependency alignment).

## Fixed in batch 3 (git `b06ebad`, `c638848`, `7ebded2`, `c0eb3ed`)
- Repository hygiene: `.open-next/` (2,342 files, ~53 MB), `.wrangler/` and `scratch/` are no longer tracked (files kept on disk) and are gitignored; tracked files dropped from 2,778 to 396.
- Docs rewritten: `README.md` (UTF-8, setup/scripts/deploy), `HANDOFF.md`, `TODO.md`, `INTEGRATION.md` conventions; `DESIGN_PLAN.md` marked historical.
- Tooling: `npm run typecheck` and `npm run test` (`node --test --test-isolation=none`), plus `.github/workflows/ci.yml` running install → typecheck → lint → test → build.
- Ops: API failures now dispatch `ops-api-error` and `app/ops/layout.tsx` shows a dismissible banner with a retry action instead of silently rendering empty tables.

## Fixed in batch 2 (git `db98d6c`)
- Public RSVP enforces the wedding's plan guest limit before inserting a walk-in guest.
- `songRequest` / `rideNeeded` persist (migration v11 + fallback), are returned by the invite API, prefilled in every template and shown in the dashboard.
- `map_embed_url` is preserved on event edit.
- In-memory rate limiting for RSVP/wishes (10/min), invite (60/min), check-slug (30/min) with 429 + `Retry-After`.
- Reads paginate via `lib/server/pagination.ts` (no 1,000-row truncation); ops stats uses head counts.
- Pricing copy matches shipped features; `/w/[slug]` is `noindex`; `.env.example` documents every variable.

## Fixed in batch 1 (git `0c3c7e5`)
Sổ mừng/Album no longer pretend to work; bulk event assignment uses the real route; photo replacement no longer deletes first; Turnstile is retryable; `/m/[slug]` renders from SSR; ops mock fallback removed and access fails closed; suspended weddings are blocked.

## Known issues (still open, verified)
1. **Retention is a promise without implementation** — free plan advertises 30 days (owner re-confirmed 2026-11-14) but there is no cron/cleanup job. Deleting data needs explicit approval and a scheduled mechanism.
2. **Guests UI still loads the whole list** — the API no longer truncates, but `GuestTable` fetches every guest and filters client-side.
3. **Sổ mừng and Album are hidden, not built** — need a decision: implement (`gifts` route + table; `album` in DB constraint, `VALID_KINDS`, `MEDIA_KEY_RE`) or remove the code.
4. **Duplicate accounts** — the live `users` table has the same email under two Auth0 providers; `POST /api/ops/users/[id]/merge` does not exist and the merge UI is hidden.
5. **Unknown schemas** — `orders`, `bank_transactions`, `gifts` are still not created by any committed migration.
6. **Production env gaps** — `APP_BASE_URL` is `http://localhost:3000` locally and `BANK_*` is unset, so payment flows cannot run.
7. **`next dev` needs workerd** — Miniflare starts only in development (by design), so sandboxed agents verify with `next build` + `next start`.
8. **Dependencies slightly misaligned** — `eslint-config-next` 15.x vs `next` 16.x; `critters` is an unused direct dependency.
9. **Dead code** — ~350 lines of unreachable mock data in `lib/ops-api.ts`, unused gift helpers in `lib/api.ts`, `authClient()` in `lib/server/supabase.ts`.
10. **Performance leftovers** — 7 Google Fonts `@import`ed in `app/globals.css` alongside 3 `next/font` families; landing page is `force-dynamic` just to read the session; gallery images are 2048px with no responsive variants.

## Still blocked on the owner
1. Run `supabase/migration_v11_guest_preferences.sql`.
2. Decide Sổ mừng / Album: build or remove.
3. Approve retention implementation (destructive) and its schedule.
4. Provide `BANK_*` values when the payment flow should be exercised.
5. Confirm the sellable feature set (pricing copy is now truthful but only as a draft).

## Deliberately not stored here
- Secret values, tokens, bank account numbers, real personal emails, and `.env*` contents.
- Debugging chatter or one-off shell output.
- Facts that a single file read answers — a pointer to the file is recorded instead.
