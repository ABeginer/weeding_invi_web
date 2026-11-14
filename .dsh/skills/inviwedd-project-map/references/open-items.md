# Open items

## Handoff
- Last task (2026-11-14): **designer template → thiệp thật (version ghim)** + **mẫu Đào Phấn hoàn chỉnh**. Dashboard assignment card + “Cập nhật lên vN”, `/m/<slug>` renders every page of the pinned version with real guest data, text alignment added to the designer, and the Đào Phấn template rebuilt from scratch (3 pages / 42 elements) and published as v2.
- Verified: `npm run typecheck` clean, `npm run lint` 0 errors, `npm run test` 38/38, `npm run build` ok. Headless Chrome screenshots (430 wide) of `/m/998c376174ee` for v1/v2 and `/mau/designer/<id>?v=2&p=0..2`; `/m` 200 with real data (`Văn A`/`Thị B`, `01.01.2027`, guest name, “Trân trọng mời”), no sample fallbacks and no image placeholders.
- Version pinning proven on live data: publishing v2 left the wedding on v1 (`/m` HTML still had the v1 heart position); after pinning to v2 the HTML changed to v2. Template: **Đào Phấn** (id `22add87b-79d6-490c-a8b8-37f3313e077d`), v2, plan free, ritual “Vu Quy”; test wedding slug `aaaaa` (guest slug `998c376174ee`) pinned to v2.
- **Not verified in a browser:** the dashboard assignment card itself (needs Auth0 login); the API/data path and public render are verified.
- In progress: nothing.
- Next step: wire interactive blocks (RSVP, map, music) into designer templates (TODO B4 last item), then consider a designer page for `/w/<slug>` too. The 36 other seeded templates are still drafts.


## Known issues (still open)
1. **Retention has never fired in production** — configured and bundle-validated only; run the dry-run endpoint first.
2. **CSP is untested in a browser** — check console on `/`, `/w/<slug>`, `/m/<slug>`, Turnstile, music, Maps, Zalo preview.
3. **No DB-backed route tests** — route handlers import `@/` aliases and `next/server`, so `node:test` cannot import them; needs Vitest/tsx or a Supabase test project. Pure validation logic is covered instead (38 tests).
4. **114 `react-hooks/set-state-in-effect` / `no-location-assign` warnings** — React Compiler rules; kept at `warn` so CI stays green (0 errors).
5. **5 production `npm audit` advisories** — all transitively inside `@opennextjs/cloudflare → @opennextjs/aws → @node-minify/core → glob/minimatch` (build tooling, not worker runtime); the auto-fix downgrades the adapter to 0.3.0, so it is deliberately not applied.
6. **Duplicate accounts** — same email under two Auth0 providers; no merge route (UI hidden).
7. **`orders` / `bank_transactions` are not created by any committed migration** — they exist in the live project or were created manually.
8. **Bulk import dedupe is page-scoped** — `BulkImportDialog` only sees the current page of guest names.
9. **Windows dev loses R2 bindings** — workerd cannot create its state dirs when the repo is under `Desktop`/`OneDrive` (Defender ACL). The failure is caught and dev keeps running, but `/media/[...key]` is 404; move the repo or allow `workerd.exe` for full parity.
10. **Designer invitations are static** — `/m/<slug>` renders the pinned pages only; RSVP, map, music, gift and the guest boarding pass are not wired into designer layouts yet (TODO B4 last item). The Đào Phấn design therefore has no RSVP page.
11. **Dashboard phone preview still shows the code template** while a designer template is pinned; the “Xem trước” link opens `/mau/designer/<id>?v=<pinned>`.
12. **Test wedding `aaaaa` is now pinned to Đào Phấn v2** — its guest link shows the designer invitation. Unpin via the dashboard card if the owner wants it back on the code template.

## Still blocked on the owner
1. Review the Đào Phấn v2 design (visual taste) and decide whether the test wedding should stay pinned.
2. Deploy, then verify the cron and CSP.
3. Confirm the sellable feature set (pricing copy is truthful but a draft).
4. Decide whether to merge duplicate accounts manually or fund a merge feature.

## Deliberately not stored here
- Secret values, tokens, bank account numbers, real personal emails, and `.env*` contents.
- Debugging chatter or one-off shell output.
- Facts that a single file read answers — a pointer to the file is recorded instead.
