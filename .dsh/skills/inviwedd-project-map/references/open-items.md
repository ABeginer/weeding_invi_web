# Open items

## Handoff
- Last task (2026-11-14): **batch 4 completed** at git `04192e7` — Sổ mừng, Album, retention cron and guest pagination. Skill updated after it.
- Verified: `npm run typecheck`, `npm run lint`, `npm run test` (8/8), `npm run build`, `wrangler deploy --dry-run` (custom worker entry + cron bundle ok), and a `next start` smoke test (`/a/huy-huiya` 200, `/a/<invalid>` 404, gifts API 401 without auth, retention endpoint 403 without admin).
- Owner ran migrations v11, v12 and v13 on 2026-11-14; the agent re-verified through the REST API and rendered `/a/<slug>` with a temporary album photo, then deleted all test rows (0 remaining).
- In progress: nothing.
- Next step: after the next deploy, confirm the retention cron fires (`wrangler tail` → `[retention]`, or call `POST /api/ops/retention/run` with `dryRun:true` as an admin), then work through `TODO.md`.

## Fixed in batch 4 (git `04192e7`)
- Sổ mừng: `gifts` table migration + full CRUD API (Pro/VIP gate) + restored nav/page and summary UI.
- Album: `album` kind accepted by API/DB/regex, upload re-enabled, public `/a/[slug]` album page linked from the dashboard, `noindex`.
- Retention: purge function (R2 + DB, batch 50, dry-run), ops endpoint with audit log, daily Cloudflare Cron at 03:00 UTC via `worker-entry.ts`.
- Guest list: server-side search/status filtering and 50-per-page pagination with a pager; legacy no-`page` API response kept.

## Fixed in batch 3 (git `b06ebad`, `c638848`, `7ebded2`, `c0eb3ed`)
Build output untracked (2,778 → 396 tracked files), docs rewritten, `typecheck`/`test` scripts + CI, ops error banner.

## Fixed in batch 2 (git `db98d6c`)
Plan guest limit on public RSVP, song/ride persistence, map embed preservation, in-memory rate limits, 1k-row truncation removed, pricing copy, `/w` noindex, `.env.example`.

## Fixed in batch 1 (git `0c3c7e5`)
Sổ mừng/Album no longer fake working; bulk event assignment fixed; photo replacement without data loss; Turnstile retry; `/m` SSR-first; ops fail-closed; suspended weddings blocked.

## Known issues (still open, verified)
1. **Retention has never run** — cron is configured and bundle-validated, but its runtime behaviour (secret access from `process.env` in a scheduled event) is verified only after a real deploy; run the dry-run endpoint first.
3. **Duplicate accounts** — the live `users` table has the same email under two Auth0 providers; `POST /api/ops/users/[id]/merge` does not exist and the merge UI is hidden.
4. **Unknown schemas** — `orders`, `bank_transactions` are still not created by any committed migration.
5. **Dead code** — ~350 lines of unreachable mock data in `lib/ops-api.ts`, unused `authClient()` in `lib/server/supabase.ts`.
6. **Performance leftovers** — 7 Google Fonts `@import`ed in `app/globals.css` alongside 3 `next/font` families; landing page is `force-dynamic` just to read the session; gallery images are 2048px with no responsive variants.
7. **Dependencies slightly misaligned** — `eslint-config-next` 15.x vs `next` 16.x; `critters` unused.
8. **Bulk import dedupe is page-scoped** — `BulkImportDialog` receives only the current page of names, so duplicates across pages are not detected client-side.
9. **`next dev` needs workerd** — sandboxed agents verify with `next build` + `next start`.

## Still blocked on the owner
1. Run migrations v11, v12, v13.
2. After deploy: confirm the cron fires (`wrangler tail` → `[retention]`), optionally after a `dryRun` call.
3. Confirm the sellable feature set (pricing is now truthful but still a draft).

## Deliberately not stored here
- Secret values, tokens, bank account numbers, real personal emails, and `.env*` contents.
- Debugging chatter or one-off shell output.
- Facts that a single file read answers — a pointer to the file is recorded instead.
