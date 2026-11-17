# Open items (Verified & Reconciled 2026-11-15)

## Handoff & Progress
- Latest status: Designer catalog and dashboard integration active, multi-select and in-editor replay active, text effects (`shadow`, `stroke`, `glow`, `goldGradient`) active, map card and color controls active.
- Verification gates (2026-11-15): `typecheck` passed, `eslint . --quiet` passed (0 errors), `npm run test` passed (54/54), `npm run build` passed (46/46 routes).
- Still open: generic text/textarea fields, block completeness (map multi-events, real gift/music/gallery links), RSVP guest preload, editor undo/autosave/dirty guard, export rotation.


## Known issues (still open)
1. **Retention has never fired in production** — configured and bundle-validated only; run the dry-run endpoint first.
2. **CSP is untested in a browser** — check console on `/`, `/w/<slug>`, `/m/<slug>`, Turnstile, music, Maps, Zalo preview.
3. **No DB-backed route tests** — route handlers import `@/` aliases and `next/server`, so `node:test` cannot import them; needs Vitest/tsx or a Supabase test project. Pure validation logic is covered instead (38 tests).
4. **114 `react-hooks/set-state-in-effect` / `no-location-assign` warnings** — React Compiler rules; kept at `warn` so CI stays green (0 errors).
5. **11 `npm audit` advisories** (4 high, 7 moderate) — the high ones are transitively inside `@opennextjs/cloudflare → @opennextjs/aws → @node-minify/core → glob/minimatch` (build tooling, not worker runtime); the moderate ones are in `typescript-eslint → minimatch` (dev tooling). The auto-fix downgrades the adapter to 0.3.0, so it is deliberately not applied.
6. **Duplicate accounts** — same email under two Auth0 providers; no merge route (UI hidden).
7. **`orders` / `bank_transactions` are not created by any committed migration** — they exist in the live project or were created manually.
8. **Bulk import dedupe is page-scoped** — `BulkImportDialog` only sees the current page of guest names.
9. **Windows dev loses R2 bindings** — workerd cannot create its state dirs when the repo is under `Desktop`/`OneDrive` (Defender ACL). The failure is caught and dev keeps running, but `/media/[...key]` is 404; move the repo or allow `workerd.exe` for full parity.
10. **Designer invitations render live elements** — `/m/<slug>` and `/w/<slug>` render the pinned pages with interactive RSVP, calendar, and map blocks.
11. **Dashboard phone preview renders actual designer canvas** with draft names and dates.
12. **Test wedding `aaaaa` is pinned to Đào Phấn v2** — its guest link shows the designer invitation.
13. **Windows integrity labels from the agent sandbox** — workspace files were stamped with a Low mandatory integrity label; `node_modules` + esbuild were raised to Medium to fix the deploy. If `npm install`/another sandbox run reintroduces `Access is denied` on `%TEMP%\open-next-tmp*`, rerun `icacls node_modules\@esbuild\win32-x64 /setintegritylevel Medium /T` (see `env-and-deploy.md`).
14. **Migration v16 is applied in production** (Verified 2026-11-15) — `ops_members` exists; designer role assigned, admin via `ADMIN_EMAILS`.
15. **Ops role UI untested when logged in** — the unauth shell/API guards were smoke-tested; the admin role page, designer sidebar/redirect, and cover upload need a real Auth0 session.
16. **Animation Phase 3/4/5 complete with multi-select and in-editor replay** — loops/parallax/typewriter/wordsIn/flipIn; falling effect with presets/custom icons; exit fadeOut/slideOut/zoomOutExit; multi-select (Shift/Cmd-click) + batch animation; in-editor "Phát tất cả" and "Phát thử" via `ElementAnimator`; animated badge on Layers panel.
17. **Animated elements are still baked into the exported 2x webp** — the exporter writes one background and has no per-element layer storage.
18. **Phase 2 fonts and text effects active** — self-hosted font families + 4 text effects (`shadow`, `stroke`, `glow`, `goldGradient`).
19. **Workers Free CPU is too low for production** — 10 ms/request; Next SSR and the retention cron can exceed it (Error 1102). Workers Paid ($5/mo) is required.
20. **No automated database backups** — Supabase Free has none. Add a weekly `pg_dump` to R2 (free) or move to Supabase Pro before real customer data.
21. **Edge caching is code-level only** — Cache API in `/media` and designer versions was not exercised on a deployed Worker.
22. **`canvas_json` may contain base64 data URLs** — audit/convert to `designer_assets` before the DB approaches 400 MB.
23. **Auth0 RSC cookie vs Bearer divergence** — `/ops` works with a Bearer token even when the server-side Auth0 session cookie is missing; canvas and preview fetch via Bearer API.
24. **Designer catalog preview is iframe-based** — only one desktop hover iframe mounted at a time, cache 60s.
25. **Catalog deep-link / assignment** — integrated with designer template selection.

## Still blocked on the owner
1. Run `supabase/migration_v16_ops_roles_template_meta.sql`, then grant a `designer` email in `/ops/roles` and verify that account sees only Template + Thiết kế mẫu.
2. Enable **Workers Paid** ($5/mo), `npx wrangler login` (or set `CLOUDFLARE_API_TOKEN`), and run `npm run deploy`.
3. Add a Cloudflare Cache Rule for `/media/*` and a weekly Supabase `pg_dump` backup after the first deploy.
4. Review the Đào Phấn v2 design (visual taste) and decide whether the test wedding should stay pinned.
5. After deploy, verify the retention cron and CSP.
6. Confirm the sellable feature set (pricing copy is truthful but a draft).
7. Decide whether to merge duplicate accounts manually or fund a merge feature.

## Deliberately not stored here
- Secret values, tokens, bank account numbers, real personal emails, and `.env*` contents.
- Debugging chatter or one-off shell output.
- Facts that a single file read answers — a pointer to the file is recorded instead.
