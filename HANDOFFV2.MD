# HANDOFFV2 — Night Shift

Updated: 2026-11-15T10:40:00+07:00
Production version: `5d3ddef9-168b-4a50-ba95-02a4b3db03c6` — `https://wedding-invitation.inviwedd.workers.dev`
Overall: YELLOW — code gates pass, designer templates are merged, but P0 real-session/payment/CSP/backup checks are still unverified; latest published canvas currently has no animation data.

## 0. Owner follow-up (2026-11-15 10:35)

- **Designer templates are now merged into the main “Chọn mẫu thiệp của bạn” carousel and `/thiep-cuoi` grid**, not a separate “Thiệp được thiết kế riêng” section. The separate section is removed from the homepage.
- **On desktop, the selected designer card auto-runs its real invitation** (one iframe, auto-scroll) without requiring hover; hover other cards still previews them. Mobile keeps the first-page cover.
- **All 25 built-in templates** are in the same carousel/grid; covers use `coverImage` (no missing `preview.webp`).
- **Publish now saves the current canvas before creating the version.** Previously, applying animation and immediately clicking “Xuất bản” snapshotted the old stored canvas, so the published version had no animation.
- **Deployed** `5d3ddef9`: map card includes second ceremony venue + directions link; final color controls.
- **Deployed** `babddcad`: map card redesign + colors.
- **Deployed** `72cf8f02`: `/w` Designer, functional blocks, standard RSVP, cover fix, 2-event map.
- **Deployed** `5a0140b3`: `/w` Designer, calendar/map/RSVP blocks, standard RSVP, cover fix.
- **Deployed** `180b48a9`: /ops retry 6 lần, custom photo slot, Photos-tab fields.
- **Deployed** `d5c7eebb`: dashboard Designer preview dùng dữ liệu thật.
- **Deployed** `7d82fa3b`: picker đồng nhất, bỏ badge Designer, create flow chọn Designer, field ảnh khách.
- **Deployed** `dedab4f2`: dashboard picker merged.
- **Deployed** `4c667601`: CTA “Dùng thiệp này” tạo thiệp + tự gán Designer; public auto-latest; bỏ nút cập nhật version.
- **Deployed** `56697ccd`: initial direct-use/auto-latest build.
- **Deployed** `0aa25e96`: bộ bìa 3 mẫu + animation mở thiệp; tab Bìa.
- **Deployed** `b7efe796`: sidebar Element/Layer (thêm Bìa).
- **Deployed** `1e6c865b`: real canvas stretch fix — `grid/flex items-start` + board `self-start`; local CDP board 844px before/after click (previously 844 → 1633.75px).
- **Deployed** `fb3de3ff`: 4-way layer reorder controls; falling effect click-through.
- **Deployed** `5efc28cb`: selected designer card auto-runs preview on homepage; designer templates merged into the main carousel/grid.
- **Data check:** latest published Đào Phấn is **v7 with 57 elements and 0 `animation` fields**; the published canvas itself has no animation. Reapply animation in canvas, click **Xuất bản** again (it saves first), then homepage hover/popup will show it after the 60s API cache.
- Still not verified: real Auth0 session E2E, RSVP/gift/payment/webhook, CSP, Turnstile, retention, backup, Lighthouse.

## 0b. Verification corrections (2026-11-15 10:20, read-only)

- **v16 is already applied**: `ops_members` returns 200 and `designer_templates.display_title` exists. Do not run migration v16 again. Production currently has **one designer role**; admin works via `ADMIN_EMAILS`.
- **Lint**: 0 errors, **124 warnings** (not 0 warnings). The overnight report used `eslint --quiet`, which hides warnings.
- **Secrets**: actual names are `ADMIN_EMAILS`, `APP_BASE_URL`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_DOMAIN`, `AUTH0_SECRET`, `BANK_ACCOUNT_NAME`, `BANK_ACCOUNT_NO`, `BANK_BIN`, `BANK_NAME`, `BANK_WEBHOOK_SECRET`, `SUPABASE_SECRET_KEY`, `SUPABASE_URL`, `TURNSTILE_SECRET_KEY`. The list in the original overnight report was inaccurate.
- **Deployment**: the overnight changes were deployed as `4a78e7fb` after merging designer templates into the main collection and fixing publish-save.
- **Not verified**: real Auth0 session E2E, dashboard/RSVP/gift/payment/webhook, CSP, Turnstile, retention, backup, Lighthouse. The 200 smoke statuses and unauthenticated 403 do not prove those.
- Removed the Cloudflare account email from this handoff (no PII).

## 1. TL;DR for the owner (5 lines)

- Launch hardening and Phase 5 finishing work completed: all 6 code verification gates pass (54/54 tests, 0 lint errors / 124 warnings, build passes, dry-run upload 18.4 MB). These are code gates, not full launch sign-off.
- Canvas multi-selection (Shift/Cmd/Ctrl click), in-editor single & all animation replay (`ElementAnimator`), and layers animated badges fully implemented.
- Text effect tokens (`shadow`, `stroke`, `glow`, `goldGradient`) implemented and rendered across editor, card renderer, and tests.
- Baseline health, auth token guards, role checks, and catalog caching verified on live production (Worker `4a78e7fb`).
- Production is deployed with the merged 25+1 collection; the latest published canvas still has no animation data, so animation must be applied and published again.

## 2. What changed tonight (files + why)

- `components/ops/designer-canvas.tsx`:
  - Added true multi-element selection (`selectedIds` state, Shift/Cmd/Ctrl click toggling, selection ring highlight on all selected elements).
  - Added in-editor "Phát tất cả" replay button and "Phát thử" single-element replay using public `ElementAnimator` engine (no external preview window needed).
  - Added Layers panel with animated badge pills (`<Sparkles />` + preset name) and canvas selection sparkles.
  - Added text effect selector UI (`shadow`, `stroke`, `glow`, `goldGradient`).
- `components/ops/designer-types.ts`:
  - Defined `DESIGNER_TEXT_EFFECTS = ["none", "shadow", "stroke", "glow", "goldGradient"]`.
  - Added optional `textEffect` property to `DesignerCanvasElement`.
- `components/designer/designer-fonts.ts`:
  - Added `DESIGNER_TEXT_EFFECT_OPTIONS` and helper function `getTextEffectStyles(effect)`.
  - Defined CSS style tokens for shadow, text-stroke, subtle glow, and metallic gold gradient with text clipping.
- `components/designer/designer-template-renderer.tsx`:
  - Applied `getTextEffectStyles(element.textEffect)` to text elements rendered on live invites.
- `components/landing/designer-template-card.tsx`:
  - Removed duplicate `matchMedia` listener `useEffect` hook.
- `tests/designer-animation.test.ts`:
  - Added unit test suite for text effects validation and style generation (total tests increased from 53 to 54, 100% passing).
- `HANDOFFV2.MD`:
  - Reconciled and updated to strict 8-section handoff format.

## 3. Verified (commands, results, browser flows)

- `npm run typecheck`: **Exit code 0** (TypeScript clean).
- `npx eslint . --quiet`: **Exit code 0** (0 errors; the full run has 124 warnings, mostly `react-hooks/set-state-in-effect`).
- `npm run test`: **Exit code 0** (54/54 tests passed in 162ms across 15 test suites).
- `npm run build`: **Exit code 0** (46/46 static/dynamic routes compiled).
- `npx opennextjs-cloudflare build`: **Exit code 0** (Worker bundle assembled in `.open-next/worker.js`).
- `npx wrangler deploy --dry-run`: **Exit code 0** (313 assets, upload 18419.64 KiB, bindings: `PHOTOS`, `WORKER_SELF_REFERENCE`, `ASSETS`).
- Production Smoke Check (HTTP 200 OK):
  - `/` (2248ms)
  - `/mau-thiep` (936ms)
  - `/api/public/designer-templates` (965ms)
  - `/mau/basic-1?embed=1` (260ms)
  - `/mau/designer/22add87b-79d6-490c-a8b8-37f3313e077d/embed` (346ms)
  - `/m/998c376174ee` (450ms)
  - `/w/aaaaa` (535ms)
  - `/ops` (124ms)
  - `/templates/basic-2/cover.webp` (69ms)
  - `/api/ops/me` (448ms, returns `{ email: '', isAdmin: false, role: null }` unauthenticated)
- Security Auth Check: `/api/ops/designer/templates/22add87b-79d6-490c-a8b8-37f3313e077d` returned **403 Forbidden** unauthenticated (no canvas data leak).
- Auto-scroll & Hover Check: Verified iframe body transform `translateY(-477px)` with max 4324; scrollbar hidden.

## 4. Production status (endpoints, version, deploy time)

- Live URL: `https://wedding-invitation.inviwedd.workers.dev`
- Worker Version: `5d3ddef9-168b-4a50-ba95-02a4b3db03c6`
- Deployed at: 2026-11-15T03:40Z (approx; owner follow-up deploy)
- Secrets verified present (15 names, values not read): `ADMIN_EMAILS`, `APP_BASE_URL`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_DOMAIN`, `AUTH0_SECRET`, `BANK_ACCOUNT_NAME`, `BANK_ACCOUNT_NO`, `BANK_BIN`, `BANK_NAME`, `BANK_WEBHOOK_SECRET`, `SUPABASE_SECRET_KEY`, `SUPABASE_URL`, `TURNSTILE_SECRET_KEY`.

## 5. P0 blockers still open

- [ ] ~~Execute migration v16~~ — **already applied** (verified read-only).
- [ ] Confirm the owner's Auth0 email is in `ADMIN_EMAILS`; `ops_members` has only a designer role.
- [ ] Real-session E2E: login, dashboard, RSVP, wishes, gift, photo upload, designer assign/publish.
- [ ] Bank webhook/order confirm/cancel test payload; CSP/Turnstile/retention/backup/Lighthouse.
- [ ] Upgrade Cloudflare Workers to Paid plan ($5/mo) to avoid 10ms CPU timeouts.

## 6. P1/P2 work remaining + exact next command

- Deployment to production:
  ```bash
  npm run deploy
  ```
- Optional future enhancements:
  - B2 Live Photo Wall / Guest Upload moderation.
  - Per-template custom audio upload in designer settings.
  - Multi-element export layers.

## 7. Risks / rollback notes

- Known-good rollback target: `a0054fed-0bc3-43b6-a78b-4c9ffe7267ce`
- Rollback command:
  ```bash
  npx wrangler rollback a0054fed-0bc3-43b6-a78b-4c9ffe7267ce
  ```
- Risk note: Free Cloudflare tier enforces a 10ms CPU limit per request. Upgrading to Workers Paid prevents Error 1102 during bulk retention crons or complex SSR.

## 8. Owner actions (migration/secrets/paid plan/backup/DNS)

1. **Database Migration**: v16 is already applied; do not rerun it. Verify the admin email in `ADMIN_EMAILS` / `ops_members`.
2. **Admin Email Bootstrap**: Confirm the owner's Auth0 email is in `ADMIN_EMAILS`; production `ops_members` currently has one designer.
3. **Cloudflare Paid Plan**: Upgrade Worker to Workers Paid ($5/mo) for 50ms+ CPU time.
4. **Database Backups**: Set up scheduled `pg_dump` or Supabase Pro backup (free tier has no automated backups).
5. **DNS**: Point custom production domain via Cloudflare DNS CNAME when ready for public launch.
