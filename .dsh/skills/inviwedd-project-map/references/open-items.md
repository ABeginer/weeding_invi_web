# Open items

## Handoff
- Last task (2026-11-14): **batch 5** — security headers, unit tests, dead-code cleanup. Verified: `tsc`, `eslint`, **22/22** tests, `next build`, `next start` smoke test with CSP/HSTS headers present.
- Migrations v11–v13 are applied; Sổ mừng + Album verified end-to-end with temporary rows (deleted afterwards).
- In progress: nothing.
- Next step: after deploy, confirm the retention cron fires (`wrangler tail` → `[retention]`) and sanity-check CSP in a real browser (Turnstile, music, Google Maps, Zalo share). Then the remaining engineering items below.

## Fixed in batch 5 (working tree, committed after `04192e7`)
- Added `Strict-Transport-Security` and a CSP (with Turnstile/Cloudflare/Google Fonts/Google Maps allowances) to `next.config.ts`.
- Added 22 unit tests: `tests/rate-limit.test.ts`, `tests/pagination.test.ts`, `tests/payments.test.ts` (VietQR, order codes, `safeEqual`).
- Removed the unused `authClient()` from `lib/server/supabase.ts` and `SUPABASE_PUBLISHABLE_KEY` from `.env.example`.

## Fixed in batch 4 (git `04192e7`)
Sổ mừng (table + CRUD + UI), Album (kind + upload + `/a/[slug]`), retention job + daily Cloudflare cron, server-side guest pagination.

## Fixed in batches 1–3
See git history `0c3c7e5`, `db98d6c`, `b06ebad`, `c638848`, `7ebded2`, `c0eb3ed`: the eight blockers, RSVP/limit/rate-limit hardening, repo hygiene, docs rewrite, CI.

## Known issues (still open, verified)
1. **Retention has never fired in production** — configured and bundle-validated only. Test with the dry-run endpoint, then watch the 03:00 UTC cron.
2. **CSP is untested in a browser** — `curl` only proves the header exists. Check the console for violations on `/`, `/w/<slug>`, `/m/<slug>` and inside Zalo/Messenger.
3. **`lib/ops-api.ts` still carries ~350 lines of dead mock data** (unreachable, but shipped to the client bundle). Rewrite it as a thin fetch client.
4. **No DB-backed route tests** — RSVP limits, ownership checks and gifts are only covered by typechecking and manual smoke tests.
5. **`eslint-config-next` is 15.x while `next` is 16.x** — `npm install` is blocked inside the sandbox (npm cache outside workspace); run outside the sandbox then lint.
6. **Google Fonts `@import`** — six families are used by `templates/themed/theme-configs.ts`; replacing the import with `next/font` requires switching those `fontFamily` values to CSS variables.
7. **Landing page is `force-dynamic`** only to read the Auth0 session.
8. **Gallery images are 2048px with no srcset.**
9. **Duplicate accounts** — same email under two Auth0 providers; no merge route (UI hidden).
10. **`orders` / `bank_transactions` are not created by any committed migration** — they exist in the live project or were created manually.

## Still blocked on the owner
1. Deploy, then verify the cron + CSP.
2. Confirm the sellable feature set (pricing copy is truthful but a draft).
3. Decide whether to merge duplicate accounts manually or fund a merge feature.

## Deliberately not stored here
- Secret values, tokens, bank account numbers, real personal emails, and `.env*` contents.
- Debugging chatter or one-off shell output.
- Facts that a single file read answers — a pointer to the file is recorded instead.
