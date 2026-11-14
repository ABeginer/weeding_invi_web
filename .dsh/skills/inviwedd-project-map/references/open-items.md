# Open items

## Handoff
- Last task (2026-11-14): **batch 6–7** — ops client rewritten without mock data, fonts self-hosted via `next/font`, landing page static, ESLint upgraded to Next 16 flat config, gallery downsized, validation helpers extracted + tests (29 total), duplicate constants/pages/assets removed.
- Verified: `npm run typecheck` clean, `npm run lint` 0 errors (98 React Compiler warnings), `npm run test` 29/29, `npm run build` ok (`/` is now `○` static), `next start` smoke test ok, no `fonts.googleapis.com` reference in the built HTML/CSS.
- In progress: nothing.
- Next step: after deploy verify the retention cron (`wrangler tail` → `[retention]`) and CSP in a real browser.

## Known issues (still open)
1. **Retention has never fired in production** — configured and bundle-validated only; run the dry-run endpoint first.
2. **CSP is untested in a browser** — check console on `/`, `/w/<slug>`, `/m/<slug>`, Turnstile, music, Maps, Zalo preview.
3. **No DB-backed route tests** — route handlers import `@/` aliases and `next/server`, so `node:test` cannot import them; needs Vitest/tsx or a Supabase test project. Pure validation logic is covered instead (29 tests).
4. **98 `react-hooks/set-state-in-effect` warnings** — React Compiler rules; kept at `warn` so CI stays green.
5. **5 production `npm audit` advisories** — all transitively inside `@opennextjs/cloudflare → @opennextjs/aws → @node-minify/core → glob/minimatch` (build tooling, not worker runtime); the auto-fix downgrades the adapter to 0.3.0, so it is deliberately not applied.
6. **Duplicate accounts** — same email under two Auth0 providers; no merge route (UI hidden).
7. **`orders` / `bank_transactions` are not created by any committed migration** — they exist in the live project or were created manually.
8. **Bulk import dedupe is page-scoped** — `BulkImportDialog` only sees the current page of guest names.

## Still blocked on the owner
1. Deploy, then verify the cron and CSP.
2. Confirm the sellable feature set (pricing copy is truthful but a draft).
3. Decide whether to merge duplicate accounts manually or fund a merge feature.

## Deliberately not stored here
- Secret values, tokens, bank account numbers, real personal emails, and `.env*` contents.
- Debugging chatter or one-off shell output.
- Facts that a single file read answers — a pointer to the file is recorded instead.
