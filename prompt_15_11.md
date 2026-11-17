# PROMPT_15_11 — Autonomous non-owner work for Inviwedd

You are the implementation agent for the Inviwedd wedding-invitation project at:

`C:\Users\thoit\Desktop\weeding_invi_web`

Read this entire file before editing. Then read `HANDOFFV3.md`, `AGENTS.md` (if present),
`TODO.md`, `.dsh/skills/inviwedd-project-map/SKILL.md` and its `references/`, and the
files named below. Work in the existing working tree. Do not discard uncommitted work.

Your job: finish every worthwhile task that does **not** require owner-only access
(no SQL migrations against production, no secrets/Auth0/DNS/paid-plan changes, no live
payment credentials, no production deployment). Leave the project deploy-ready and write
an honest handoff.

---

## 0. Current baseline (verify; do not blindly trust)

- Production: `https://wedding-invitation.inviwedd.workers.dev`
- Last deployed Worker: `5d3ddef9-168b-4a50-ba95-02a4b3db03c6`
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Cloudflare Workers
  via OpenNext, Supabase PostgREST (service role server-side), Auth0 v4, R2.
- Tests at baseline: 54/54. Lint: 0 errors, 124 warnings. Build and deploy dry-run pass.
- Recent working features:
  - `/w/<slug>` and `/m/<guest>` render an assigned Designer template.
  - Dashboard “Mẫu giao diện thiệp” lists 25 code + published Designer templates,
    searchable together, no Designer badge.
  - Dashboard phone preview renders the actual Designer canvas with draft names/date.
  - Homepage Designer cards auto-preview on desktop; catalog is merged.
  - Designer cover: split/card/fade; image/icon/title/button; upload uses asset kind
    `background` (kind `cover` is rejected by the DB CHECK).
  - Designer blocks: calendar month grid, map event card, RSVP anchor; standard
    `RsvpWishBlock` is appended when data exists; RSVP light palette.
  - Designer custom fields: **image only** (`guestField`); dashboard Photos tab upload;
    `content.designerFields`; no arbitrary text/select/date fields yet.
  - `/ops` retries bearer auth before rendering 404.
- `TODO.md` and `open-items.md` are partly stale. Reconcile them with code/production
  instead of copying old claims. In particular, old lines saying “Designer invitations
  are static”, “preview shows code template”, “CTA goes to dashboard”, “v16 pending”,
  “no multi-select”, etc. are no longer all true.
- **Do not run migration v16 again.** It is already applied in production; verify
  read-only if needed (only a designer role currently exists; admin works via
  `ADMIN_EMAILS`).

---

## 1. Hard boundaries (owner-only — do not do)

You must not:

- Run SQL against production Supabase, run migrations, delete/update production rows,
  or touch real customers/weddings.
- Read, print, commit, or change `.env*` values, Cloudflare secrets, Auth0 secrets,
  bank credentials, or tokens.
- Change Auth0 callback URLs, DNS, custom domain, Cloudflare account settings, or buy
  Workers Paid / Supabase Pro.
- Run `npm run deploy` against production. The owner promotes; you produce a green,
  deployable working tree and a dry-run.
- Run `supabase db push`, `wrangler secret put`, `wrangler rollback`, or destructive git
  commands (`reset --hard`, `clean -fd`, force push, rewriting history).
- Edit live payment/webhook state or move money.
- Run `npm audit fix --force` or upgrade Next/OpenNext/Auth0.
- Claim a production fix is verified when you only ran local build/unit tests.

If a task genuinely needs one of the above, write it in `HANDOFFV3.md` under
“Owner actions” and continue with independent code-only work.

---

## 2. Working rules

- Preserve all existing uncommitted changes. Never overwrite another agent’s work
  without reading it.
- Keep diffs small and reversible. One concern per change set.
- No new runtime dependency unless unavoidable. Prefer existing helpers and `node:test`.
- No `any` spam, no disabled TypeScript/ESLint rules merely to pass gates.
- No `console.log` left in app code. Remove debug artifacts and scratch files.
- Vietnamese UI copy with diacritics; use existing theme tokens, not random colors.
- Never expose data URLs or secrets in logs/handoff.
- Use full file paths when reporting.
- Do not use production data to test; use local fixtures/mocks or the existing test
  wedding only if the owner already provided it, and never change it without permission.
- If using subagents, they may only do read-only audits or isolated test files; serialize
  edits to shared files.

### Mandatory gates after every meaningful change

```bash
npm run typecheck
npx eslint . --quiet
npm run test
npm run build
```

Before final handoff:

```bash
npx opennextjs-cloudflare build
npx wrangler deploy --dry-run
```

On Windows DSH, build may fail inside the sandbox with `spawn EPERM`; use the documented
full-access run for the build (do not disable checks). If a command fails twice:
1. revert only your last change,
2. record command + full error in `HANDOFFV3.md`,
3. pivot to a smaller task.

Do not leave the tree with a failing typecheck/build/test at any checkpoint.

---

## 3. Priority order

### P0 — Finish launch-critical code, no owner access

1. **Baseline + docs truth pass**
   - Run all gates first. If something already fails, fix it before new features.
   - Reconcile `TODO.md` and `.dsh/skills/inviwedd-project-map/references/open-items.md`
     with current code. Remove/fix stale claims; add a short “Verified 2026-11-15” note.
   - `git status`; list modified/untracked files in `HANDOFFV3.md`.
2. **Designer dynamic fields — finish the model**
   - Current model: `DesignerElementBase.guestField?: { label: string }` (effectively image
     only) in `components/ops/designer-types.ts`.
   - Required:
     - Support `kind: "image" | "text" | "textarea"` (and optionally `maxLength`).
     - Designer can mark a **text element** as “Khách điền” with a label; if the text
       element already has a standard placeholder, keep the standard placeholder behavior.
     - `collectDesignerImageFields` in `lib/designer-fields.ts` must become a general
       `collectDesignerFields` returning `{ key, label, kind }`; update all callers.
     - `DesignerTemplateRenderer` must use `values[`field:${element.id}`]` for image and
       text; text fallback should remain element text when no guest value.
     - Dashboard needs a fields editor for **text/textarea** too. Do not put image-only
       fields in the Photos tab and text fields nowhere: create a shared
       `DesignerFieldsEditor` component (client) used by `WeddingInfoEditor` or by a new
       “Trường theo mẫu” card; images can stay in Photos tab, text fields go in Info tab.
     - `content.designerFields` already exists in `lib/wedding-types.ts`; preserve schema.
     - Add tests for field collection and value resolution.
   - Files: `components/ops/designer-types.ts`, `components/ops/designer-canvas.tsx`,
     `components/designer/designer-template-renderer.tsx`, `lib/designer-fields.ts`,
     `components/dashboard/WeddingInfoEditor.tsx`, `PhotosManager.tsx`,
     `WeddingDetailView.tsx`, `lib/designer-invite.ts`, `lib/wedding-types.ts`.
3. **Designer block completeness**
   - `components/designer/designer-template-renderer.tsx` currently has calendar/map/RSVP
     but gift/gallery/music are placeholders; map card uses event 1 + a small event 2.
   - Required code-only work:
     - Map: render all available events (max 2–3) with a compact list and a directions
       link per event; do not leave “Lễ 2” as text only. Keep current card visual when
       one event.
     - Gift block: turn it into a real anchor/button to the standard gift section or a
       real QR if data is available. Prefer appending a standard gift section to
       `DesignerInvitation` (similar to RSVP) rather than faking QR.
     - Gallery block: anchor to the real gallery/album; use `data.photos` if available.
     - Music block: use the standard music control (or hide if no music); do not render
       a dead button.
     - RSVP block: keep anchor; standard RSVP is appended.
   - Add `values` needed from events/gift/photos in `lib/designer-invite.ts`.
   - Do not add a schema migration for blocks; blocks are JSON.
4. **RSVP completeness**
   - `DesignerInvitation` appends `RsvpWishBlock` when `data` exists.
   - Preload the guest’s existing RSVP state when available. Extend
     `PublicGuestWeddingData` in `lib/server/public-wedding.ts` with status/plusOnes/diet/
     song/ride (they exist on `guests`), then pass to `DesignerInvitation` and
     `RsvpWishBlock` in `app/m/[slug]/page.tsx`.
   - Ensure `/w` (public mode) does not preload personal state.
   - Add a pure test for the mapping if practical.
5. **Editor UX code-only**
   - `components/ops/designer-canvas.tsx`:
     - Undo/redo for content changes (snapshot `{...content, pages}` into a bounded
       history stack; keyboard Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z; do not include cover? Include
       cover/accent if simple; reset when template loads).
     - Autosave: debounce PATCH `canvas_json` after edits (e.g. 1500ms) with a visible
       “Đang lưu…”/“Đã lưu” state; do not autosave while dragging; manual save remains.
     - Dirty guard: before route leave, warn if unsaved (best-effort `beforeunload`).
     - Add a crop tool only if time permits; otherwise leave a clear TODO.
   - Do not regress cover, layers, block colors, or publish.
6. **Export correctness**
   - `exportBackground` currently draws images/text without rotation. Add rotation for
     image/photo and text around the element center; keep dimensions/positions correct.
   - Do not implement per-element layer export (needs storage/schema); document it.
7. **Performance**
   - Split decorative Designer fonts from root layout if not already; only load where
     needed.
   - Lazy-load catalog iframes (`loading="lazy"`, mount only the visible/hovered card).
   - Keep API cache 60s; avoid full-app iframe for every card.
   - Measure before/after with simple curl/Lighthouse notes; do not chase micro-wins.
8. **Tests and quality**
   - Add pure unit tests for: dynamic field collection/resolution, event/map values,
     RSVP mapping, undo/redo reducer if extracted, autosave debounce logic if extracted.
   - Aim for 60+ tests; keep existing 54 green.
   - Fix only low-risk lint warnings that do not require broad template refactors.
   - Do not chase all 124 React Compiler warnings; document them.
   - Add a `HANDOFFV3.md` note on remaining warnings/audit.

### P1 — Code-only features if P0 is green

1. **Designer cover composition**
   - Current 3 presets + image/icon/title/button. If time, add text/icon overlays to the
     cover config and a cover canvas preview; keep it JSON-only.
   - Do not add DB columns.
   - Test the cover upload path code; do not use production auth.
2. **Font Phase 2 (safe subset)**
   - Add only fonts already self-hosted or verify Vietnamese + license; do not pull new
     Google fonts blindly. Add “Bộ chữ” presets using existing families.
   - Text effects already exist; extend font sets, not new runtime dependencies.
3. **Catalog thumbnails**
   - Generate/assign designer cover/snapshot images from canvas if a static asset can be
     created locally; otherwise document. Do not make every card load a full iframe.
   - `/mau-thiep` separate page is deferred; leave unlinked.
4. **Ops pagination/filtering**
   - Move large lists to SQL only if simple; otherwise document.
5. **Photo wall** (large, code + migration)
   - Only if all P0 is green. Write migration file + API + UI + tests, but **do not apply
     migration**. Mark owner action. Do not start after 03:30.
6. **Export layers** (large)
   - Do not hack; document storage/API design in HANDOFFV3.

### P2 — Optimization/cleanup

- Remove dead code/assets only after `grep` proves no references. Never delete
  `vendor/critters-stub`, `.npmrc`, deploy assets, or unknown images.
- Remove scratch files (`scratch/*.mjs`, test screenshots, temp HTML).
- `git diff --check`; do not fix CRLF noise.
- Keep `HANDOFFV3.md` current.

---

## 4. Exact data flows and where to edit

Read these before changing:

### Designer field flow
```
Designer canvas (`designer-canvas.tsx`)
  -> DesignerElementBase.guestField
  -> canvas_json (Supabase designer_template_versions)
  -> public `/m` or `/w` renders `DesignerTemplateRenderer`
  -> values map from `buildDesignerInviteValues` (`lib/designer-invite.ts`)
  -> dashboard loads latest canvas via `/api/weddings/[id]` (`designerCanvas`)
  -> `collectDesignerImageFields` / new `collectDesignerFields`
  -> dashboard writes `content.designerFields`
  -> public renderer reads `values[`field:${element.id}`]`
```

### Key files
- `components/ops/designer-types.ts` — element/block/cover/canvas types.
- `components/ops/designer-canvas.tsx` — editor, save/publish, cover, block colors.
- `components/designer/designer-template-renderer.tsx` — public/editor render, blocks.
- `components/designer/designer-cover.tsx` — cover open animations.
- `components/designer/designer-invitation.tsx` — pages + appended RSVP.
- `components/invitation/RsvpWishBlock.tsx` — standard RSVP; do not fork it unless needed.
- `lib/designer-invite.ts` — values map and event formatting.
- `lib/designer-fields.ts` — field collection.
- `lib/wedding-types.ts`, `lib/wedding-data.ts` — content schema/normalization.
- `components/dashboard/WeddingInfoEditor.tsx` — picker + fields.
- `components/dashboard/PhotosManager.tsx` — image fields.
- `components/dashboard/WeddingDetailView.tsx` — preview canvas loading.
- `app/m/[slug]/page.tsx`, `app/w/[slug]/page.tsx` — public render.
- `app/api/weddings/[id]/route.ts` — `designerCanvas` response.
- `lib/server/designer.ts`, `lib/server/public-wedding.ts` — latest/pinned canvas and guest data.
- `tests/designer*.test.ts` — unit tests.

### Known pitfalls
- Do **not** reintroduce native iframe scroll for preview; use
  `lib/frame-scroll.ts` `frameOffsetMax`/`setFrameOffset`.
- Do **not** make `/w` ignore Designer again; it must include
  `getPublicWeddingBySlug(..., { includeDesignerTemplate: true })`.
- Do **not** use asset kind `cover` for uploads; DB CHECK allows
  `photo|png|svg|background|snapshot`. Use `background`.
- Do **not** set only `--inv-*` for RSVP; Tailwind uses `--color-inv-*`, so set both
  (or use inline explicit colors).
- Do **not** return early from `DesignerCover` after hiding without restoring body/html
  overflow; `restorePageScroll` must run.
- Do **not** put every Designer card in an iframe; one preview at a time.
- Do **not** run `npm run deploy`.

---

## 5. Testing guide

Use `node:test` for pure logic. Do not add Vitest/Playwright unless you can justify it
and it is necessary; a new dependency is a larger risk.

Suggested tests:
- `designer-fields.test.ts`: collect image/text/textarea fields, dedupe by id, labels.
- `designer-invite.test.ts`: event title/time/day/month/year/lunar, map URLs, second
  event, custom fields.
- `designer-blocks.test.ts`: block color fallback, order, RSVP anchor.
- `designer-history.test.ts`: undo/redo snapshot behavior if you extract a reducer.
- Keep `tests/designer-animation.test.ts` and all existing tests green.

Do not test live DB/payment/Auth0 in this session.

---

## 6. Time plan (adjust to actual clock)

- 0–30m: read, baseline gates, create/refresh `HANDOFFV3.md`.
- 30–75m: docs truth pass + fix baseline failures.
- 75–180m: dynamic text fields + dashboard field editor.
- 180–270m: blocks (map all events, gift/gallery/music/RSVP) + RSVP preload.
- 270–360m: editor undo/autosave, export rotation, performance.
- 360–420m: tests, full gates, handoff.
- If past 03:30: stop starting large features; finish/handoff only.
- Checkpoint at ~02:00 and ~04:00: update `HANDOFFV3.md`.

---

## 7. HANDOFFV3.md contract

`HANDOFFV3.md` already exists. Update it:
- after baseline,
- after each phase,
- after each green gate,
- at 02:00/04:00 checkpoints,
- at the end.

Format:

```md
# HANDOFFV3 — 2026-11-15

Updated: <ISO/local time>
Production (owner-deployed): <version>
Agent status: GREEN / YELLOW / RED
Current phase: <...>

## 1. TL;DR for the owner (5 lines)
## 2. Baseline and what changed (files + why)
## 3. Verified (commands, results, tests)
## 4. Open P0/P1/P2 + exact next command
## 5. Owner-only actions (why blocked)
## 6. Decisions/risks/rollback
## 7. Files changed + uncommitted status
## 8. Next 24h
```

Rules:
- No secrets, tokens, real customer data, or base64 blobs.
- Mark every claim **verified** vs **not verified**.
- Include failing command output if something is blocked.
- If work stops early, handoff must still be complete and honest.

---

## 8. Definition of done

- `npm run typecheck`, `npx eslint . --quiet`, `npm run test`, `npm run build` green.
- `npx opennextjs-cloudflare build` and `npx wrangler deploy --dry-run` green.
- New behavior covered by at least one pure test where practical.
- No P0 regression in `/`, `/w`, `/m`, `/ops`, dashboard, Designer editor.
- Docs reconciled; `HANDOFFV3.md` updated with exact status and owner actions.
- Production **not deployed** by you; owner has a clear `npm run deploy` instruction.

Start by reading and running the baseline gates. Do not ask for permission for code-only
work; proceed. If blocked by owner access, record it and continue.
