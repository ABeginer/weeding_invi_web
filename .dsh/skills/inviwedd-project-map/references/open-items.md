# Open items

## Handoff
- Last task (2026-11-14): **template collection** — new `/thiep-cuoi` page with a flat focus carousel and a glass preview popup, feature config, homepage teaser, navbar/footer/sitemap links, registry asset fields.
- Verified: `npm run typecheck` clean, `npm run lint` 0 errors, `npm run build` ok (`/thiep-cuoi` prerendered static), page 200 with h1/carousel/live region, homepage has no template cards, sitemap + canonical present, no 3D/hex/rgb/console.log in the new components.
- **Missing assets:** none of the 24 templates has `public/templates/<id>/preview.webp` or `snapshot.webp`; the UI falls back to placeholders. Add ~700×1240 webp (<120KB) and 750px-wide snapshot webp (<600KB) per template.
- In progress: nothing.
- Next step: add the preview/snapshot images, then verify the carousel/popup interactions in a real browser (keyboard, swipe, focus trap, snapshot pause, reduced motion) since the agent environment has no browser.


## Known issues (still open)
1. **Retention has never fired in production** — configured and bundle-validated only; run the dry-run endpoint first.
2. **CSP is untested in a browser** — check console on `/`, `/w/<slug>`, `/m/<slug>`, Turnstile, music, Maps, Zalo preview.
3. **No DB-backed route tests** — route handlers import `@/` aliases and `next/server`, so `node:test` cannot import them; needs Vitest/tsx or a Supabase test project. Pure validation logic is covered instead (29 tests).
4. **98 `react-hooks/set-state-in-effect` warnings** — React Compiler rules; kept at `warn` so CI stays green.
5. **5 production `npm audit` advisories** — all transitively inside `@opennextjs/cloudflare → @opennextjs/aws → @node-minify/core → glob/minimatch` (build tooling, not worker runtime); the auto-fix downgrades the adapter to 0.3.0, so it is deliberately not applied.
6. **Duplicate accounts** — same email under two Auth0 providers; no merge route (UI hidden).
7. **`orders` / `bank_transactions` are not created by any committed migration** — they exist in the live project or were created manually.
8. **Bulk import dedupe is page-scoped** — `BulkImportDialog` only sees the current page of guest names.
9. **Windows dev loses R2 bindings** — workerd cannot create its state dirs when the repo is under `Desktop`/`OneDrive` (Defender ACL). The failure is caught and dev keeps running, but `/media/[...key]` is 404; move the repo or allow `workerd.exe` for full parity.

## Still blocked on the owner
1. Deploy, then verify the cron and CSP.
2. Confirm the sellable feature set (pricing copy is truthful but a draft).
3. Decide whether to merge duplicate accounts manually or fund a merge feature.

## Deliberately not stored here
- Secret values, tokens, bank account numbers, real personal emails, and `.env*` contents.
- Debugging chatter or one-off shell output.
- Facts that a single file read answers — a pointer to the file is recorded instead.
