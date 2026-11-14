# Open items

## Handoff
- Last task (2026-11-14): **batch 1 (8 blockers) completed** at git `0c3c7e5`. Code was modified, `tsc --noEmit` + `eslint .` are clean, `next build` succeeds, and a production-server smoke test passed.
- In progress: nothing.
- Next step: batch 2 — data/security. Suggested order: public RSVP guest-limit enforcement + rate limiting, persist `songRequest`/`rideNeeded` (new columns + RSVP write + mapper) or remove the inputs, stop wiping `map_embed_url`, real pricing copy, pagination instead of load-all, `/w` noindex, `.env.example` completeness.
- Owner must do first: replace the rejected Supabase credential in the local env (see Known issue 1); otherwise no DB-backed page can be tested locally.
- Files likely touched next: `app/api/rsvp/route.ts`, `lib/server/mappers.ts`, `supabase/` (new migration), `config/pricing.ts`, `lib/ops-api.ts`, `components/dashboard/*`, `app/w/[slug]/page.tsx`.

## Fixed in batch 1 (git `0c3c7e5`)
1. Sổ mừng has no backend → nav entry removed and the page now explains the feature is not ready. **Still not implemented** (no `gifts` route/table); restoring it needs a real route + migration.
2. Album upload could never succeed → the upload control is disabled with a clear message. Still needs `album` in the DB check constraint, `VALID_KINDS` and `MEDIA_KEY_RE` before re-enabling.
3. Bulk event assignment called a missing route → now uses `/api/weddings/[id]/guests/[guestId]/events`.
4. Replacing a hero/portrait photo deleted the old file first → server now inserts the new photo, then deletes the replaced row; content ids drive the replacement so legacy positions do not break.
5. Turnstile could permanently lock the form → failed script loads are retryable and show a visible error.
6. `/m/[slug]` discarded server-rendered data → renders from `initialData` immediately; the per-guest request only hydrates status/plus-ones/diet.
7. Ops console showed fabricated data → mock fallback removed, `/api/ops/me` fails closed when `ADMIN_EMAIL` is unset, merge button hidden.
8. `suspended` was never enforced → blocked on public pages, public API, invite API, RSVP and wishes. Suspended weddings now behave as "not found" for guests.

## Known issues (still open, verified)
9. **Public RSVP bypasses the guest limit** — inserting a guest by `weddingSlug` in `/api/rsvp` does not check `plan.guests`; only the dashboard routes do.
10. **`songRequest` / `rideNeeded` are collected and dropped** — sent by both RSVP components, never read by the server, no columns exist; the dashboard panel stays empty.
11. **`map_embed_url` is wiped on every event edit** — `EventsManager` sends `mapEmbedUrl: null` unconditionally.
12. **Pricing copy contradicts the code** — "3 mẫu" free vs 23 selectable free templates; VIP "mẫu độc quyền" while `vip-1` is a placeholder; "Tải nhạc MP3 lên" has no field/UI/route; retention has no implementation; gift QR is sold as "Sắp có" but ships.
13. **No rate limiting on any public endpoint** (`/api/rsvp`, `/api/wishes`, `/api/invite/[slug]`, `/api/weddings/check-slug`).
14. **Ops lists load every row then paginate in memory**, and `.limit(2000)` on guests exceeds the Supabase PostgREST default cap of 1,000 rows.
15. **`/w/[slug]` has no `robots: noindex`** (only `robots.txt` disallows it).
16. **Docs are stale** — `HANDOFF.md`, `DESIGN_PLAN.md`, `TODO.md` describe removed `/admin/*` routes, a mock `lib/api.ts`, `WishForm.tsx`, and Cormorant as display font; `README.md` is a UTF-16 one-liner.
17. **Repository hygiene** — 2,342 committed `.open-next/` files (~53 MB) plus `.wrangler/` and `scratch/`; `.gitignore` does not exclude them.
18. **No test entry point / CI** — `tests/*.test.ts` use `node:test` but `package.json` has no `test` script and no runner is installed.
19. **Local Supabase credential rejected** — `next start` logs `"Unregistered API key"` for every DB query, so DB-backed routes return 500 in this environment. Owner must update the secret; not caused by code changes.

## Owner-blocked questions
1. Which of the five committed migrations have actually been applied, and what do the missing v6–v9 do? (Status is `UNKNOWN` everywhere in this skill.)
2. Do `orders`, `bank_transactions` and `gifts` exist in the live project? Their schemas are `UNVERIFIED`.
3. Confirm the sellable feature set so `config/pricing.ts` can be rewritten to match reality.
4. Which email address(es) belong in `ADMIN_EMAIL` for production ops access?
5. Should the 30-day free retention be implemented (cron + cleanup) or removed from the pricing copy?
6. Where is the Google Apps Script that sends the bank webhook? Not in this repository (`UNVERIFIED`).
7. Should the Sổ mừng and Album features be built now (route + migration) or stay hidden?

## Deliberately not stored here
- Secret values, tokens, bank account numbers, real personal emails, and `.env*` contents.
- Debugging chatter or one-off shell output.
- Facts that a single file read answers — a pointer to the file is recorded instead.
