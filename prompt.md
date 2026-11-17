# NIGHT SHIFT PROMPT — Inviwedd launch hardening + finishing work

You are an autonomous senior full-stack engineer working overnight on the Inviwedd
wedding-invitation project at `C:\Users\thoit\Desktop\weeding_invi_web`.

Your goal is **not** to invent a new architecture. Your goal is to get the existing
product safely launch-ready, finish the highest-value unfinished work, reduce risk,
and leave a clear handoff. Work continuously, but never ship a broken build.

---

## 0. Read first (do not skip)

Read these before editing:

1. `AGENTS.md` / project instructions if present.
2. `TODO.md` — note: it is partly stale; reconcile with code/production.
3. `.dsh/skills/inviwedd-project-map/SKILL.md` + its `references/`:
   - `open-items.md`, `decisions.md`, `db-schema.md`, `api-routes.md`,
     `env-and-deploy.md`, `changelog.md`.
4. `PRODUCTION_CAPACITY.md`.
5. `README.md`, `package.json`, `wrangler.jsonc`, `next.config.ts`.
6. Recent code: `components/designer/*`, `components/landing/*`,
   `components/templates/*`, `app/ops/*`, `app/api/public/designer-templates/route.ts`,
   `app/mau/**`, `lib/frame-scroll.ts`, `lib/server/*`.
7. `git status` and `git diff --stat` before touching anything. Preserve all
   uncommitted work.

Production: `https://wedding-invitation.inviwedd.workers.dev`
Current known-good Worker version at handoff: `a8847a17-c726-46e2-90d4-facbfc7b4654`.

Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Cloudflare Workers
via OpenNext, Supabase Postgres/PostgREST (service role server-side), Auth0 v4,
Cloudflare R2. Node scripts. No new framework.

---

## 1. Hard rules

- **Never** print, commit, or put secrets in `HANDOFFV2.MD`; no `.env*` values,
  tokens, bank data, real emails, or customer data.
- **Never** run destructive DB/SQL, delete production rows/objects, change DNS,
  rotate secrets, change Auth0 callback URLs, or buy/upgrade a plan unless the owner
  explicitly asked in this prompt. If required, record it as an owner action.
- **Do not** run `npm audit fix --force`, upgrade Next/OpenNext/Auth0, or rewrite the
  app. Keep the current structure.
- **Do not** run `supabase` migrations against production without the owner. Verify
  schema read-only. `v16` may already be applied in production; do not assume.
- **Do not** commit/push unless the owner asked. Work in the working tree and leave
  the final diff reviewable. Never `git reset --hard`, `git clean -fd`, or force push.
- Preserve deploy fixes: `.npmrc`, `vendor/critters-stub`, package/package-lock
  changes needed for OpenNext. Do not delete them.
- Do not add npm dependencies unless unavoidable and justified. Prefer existing
  libraries/utilities.
- No `console.log` left in app code. No disabling ESLint/TS checks to make a gate
  pass. No `any` spam.
- User-facing copy must be Vietnamese with diacritics; use theme tokens/classes, not
  random hard-coded colors.
- Use small, reversible changes. Do not start a giant refactor while production is
  broken.
- One editor/agent writes files at a time. If using parallel subagents, they must be
  read-only audits; serialize edits.

---

## 2. Priority order — launch first, features second

### P0 — Launch blockers / production safety (do first)

1. **Baseline production health**
   - `npx wrangler whoami`, `npx wrangler deployments list` (read-only).
   - Check production: `/`, `/mau-thiep`, `/api/public/designer-templates`,
     `/mau/basic-1?embed=1`, `/mau/designer/22add87b-79d6-490c-a8b8-37f3313e077d/embed`,
     `/m`, `/w`, `/ops`, `/ops/designer/<id>`, `/media/...`.
   - Record status codes and console/network errors. Do not fix by hiding errors.
   - Verify current deploy version and Worker secrets **names only**.
2. **Auth/roles**
   - Verify `/api/ops/me` with a real session (Bearer) and role admin/designer.
   - Verify `/ops/designer/[id]` is the client-fetch version (no RSC cookie dependency)
     and that no canvas data leaks to unauthenticated/forbidden users.
   - Check production `ops_members` read-only; if no admin, do **not** guess an email.
     Record owner action. `ADMIN_EMAILS` is the bootstrap.
3. **Critical end-to-end flows** (browser, test data only):
   login → dashboard → create/test wedding → guest link → RSVP → wishes →
   gift entry → photo upload → designer template assign → publish → catalog →
   guest invitation (`/m/...`) → music/RSVP interaction.
   Use existing test wedding `aaaaa` / guest `998c376174ee` only; do not touch real
   customer weddings. Do not send external notifications/emails.
4. **Money/webhooks**
   - Inspect bank webhook signature/idempotency and order confirm/cancel.
   - Use test payload only; do not move real money. If no sandbox, document risk.
5. **Security**
   - 401/403 for missing/forged tokens; owner isolation; suspended wedding blocks;
     rate-limit behavior; Turnstile behavior; no draft/public data leak;
     public catalog only published; no secret in client bundle.
6. **Reliability**
   - Check `/api/ops/retention/run` dry-run; check cron config.
   - Ensure no 5xx, no hydration errors, no broken images in main flows.
   - Confirm DB/R2 backup/restore story; free Supabase has no backups. Record a
     `pg_dump`/owner-action plan if credentials are unavailable.
7. **Performance**
   - Measure production LCP/CLS/INP on mobile (Lighthouse/Chrome), especially `/`,
     `/mau-thiep`, `/m/<guest>`, `/mau/basic-1?embed=1`.
   - Current known optimizations: decorative fonts `preload:false`; covers lazy;
     iframe previews only hover/click; 60s catalog cache. Do not regress them.
   - Fix only high-impact issues that are safe. Do not make the landing page dynamic.
8. **SEO/ops metadata**
   - `/mau-thiep` metadata, sitemap, robots, canonical, OG images.
   - Error pages/404 for missing template/wedding; no stack traces.

Only after P0 is green should you deploy and call it launch-ready.

### P1 — Finish product (timeboxed after P0)

Work in this order; stop and hand off if a task becomes risky:

1. **Animation Phase 5 remainder**:
   - Multi-select elements in canvas (Shift/Cmd-click) and apply a chosen animation
     to all selected; update selection outlines/panel.
   - In-editor "Phát thử" for selected element and "Phát tất cả" (replay) using the
     public engine; don't just open the preview page.
   - Animated badge in the layers/list panel (selected badge already exists).
   - Keep exit/replay/auto-apply working; do not regress `ElementAnimator`.
2. **Text/font finishing**:
   - Font sets/text effects (shadow, stroke, glow, gold gradient) using existing fonts
     first. Add new families only after verifying Vietnamese subset + license; if
     unsure, do not add.
   - No per-font hard-coded colors; theme tokens.
3. **Designer catalog quality**:
   - Per-template music if feasible using existing upload/R2/media route; otherwise
     document.
   - Better first-page thumbnail if the current cover is only a background; avoid
     loading full iframes for every card.
   - Direct catalog CTA → dashboard/assignment if safe.
4. **Photo wall / live QR (B2)**: only if P0/P1 are fully green and there is enough
   time. This is a multi-table + upload + moderation + wall feature; do not start it
   after 03:30. If started, ship a vertical slice with migration + API + UI + tests.
5. **Export per-element layers**: requires new storage/API and publish changes.
   Do not hack around it. Ship only with a migration and full tests; otherwise leave
   a precise storage/API design in `HANDOFFV2.MD`.

### P2 — Optimize and clean (after P0, alongside P1 if safe)

- Reconcile stale docs with reality (TODO items already done: preview images via
  `coverImage`, v16 may be applied, canvas/client preview changes).
- Remove dead code/assets only after `grep` proves no references; do not delete
  `vendor/critters-stub`, deploy assets, or unknown images.
- Fix broken template covers `/templates/<id>/cover.*`; ensure `getTemplateCollection`
  uses `coverImage`.
- Improve preview scrolling/scrollbar only via `lib/frame-scroll.ts` body transform;
  native scroll is intentionally not used because embeds lock it.
- Safe perf wins: lazy images, font preload discipline, API cache, avoid full-app
  iframes for every card, reduce oversized images, cache immutable media.
- Ops list SQL pagination if safe; do not break admin queries.
- Do not chase the 98 `react-hooks/set-state-in-effect` warnings or audit highs;
  they are non-blocking and documented.
- Run `git diff --check`; do not “fix” CRLF noise.

---

## 3. Verification gates (mandatory)

After **every** meaningful change set:

```bash
npm run typecheck
npx eslint . --quiet
npm run test
npm run build
```

Before deploy:

```bash
npx opennextjs-cloudflare build
npx wrangler deploy --dry-run
```

Deploy only when all gates are green and P0 is done:

```bash
npm run deploy
```

On Windows, if a command is blocked by the sandbox/ACL, use the documented
`icacls` fix for `node_modules\@esbuild\win32-x64`; never disable checks.

If a gate fails twice:
- revert only your last change (not the whole working tree),
- record the failure and command output in `HANDOFFV2.MD`,
- pivot to a smaller task.

If deploy fails twice:
- do not keep retrying; record the exact error and rollback to the previous known-good
  version in Cloudflare if production is broken.

### Deploy safety
- Record the version before/after.
- Verify production endpoints after deploy (HTTP 200 + no console errors).
- If any critical endpoint 5xx/404 regresses: rollback immediately to the previous
  version; do not attempt heroic fixes on production.
- Never change `APP_BASE_URL`, Auth0 callback URLs, DNS, or secrets as part of a
  code deploy.

---

## 4. HANDOFFV2.MD (create and update continuously)

Create `HANDOFFV2.MD` at repo root **before starting P0** and update it:

- at baseline,
- after each P0 item,
- after each deployed version,
- at 02:00 / 04:00 checkpoints,
- at the end.

Use this structure (Vietnamese is fine; keep it concise and factual):

```md
# HANDOFFV2 — Night Shift

Updated: <ISO time>
Production version: <id> — <url>
Overall: GREEN / YELLOW / RED

## 1. TL;DR for the owner (5 lines)
## 2. What changed tonight (files + why)
## 3. Verified (commands, results, browser flows)
## 4. Production status (endpoints, version, deploy time)
## 5. P0 blockers still open
## 6. P1/P2 work remaining + exact next command
## 7. Risks / rollback notes
## 8. Owner actions (migration/secrets/paid plan/backup/DNS)
```

Rules for the handoff:
- Never include secrets, tokens, real emails/phones, bank data, customer data.
- Include exact commit-less file paths and test results.
- Mark every claim as **verified** vs **not verified**.
- The owner must be able to read it in 5 minutes and know what to do.
- If work stops early, the handoff must still be complete and honest.

---

## 5. Current known baseline (do not blindly trust; verify)

- Production: `https://wedding-invitation.inviwedd.workers.dev`, Worker `a8847a17`.
- Deployed: public designer catalog + `/mau-thiep`, code-template live iframe previews
  with body-transform auto-scroll, hidden scrollbars, popup music, canvas/preview
  Bearer API, animation Phases 1/3/4/5, font preload optimization.
- Tests: 53/53; typecheck/lint/build/deploy dry-run green at last handoff.
- Known pending: Phase 5 multi-select/editor replay, Phase 2 font sets/new families,
  per-template music, export layers, B2 photo wall, B4 some preview/export items.
- Production `ops_members` may only contain a designer; do not guess an admin email.
- `TODO.md` contains stale items; reconcile with code/production.
- Do not reintroduce:
  - native scroll in embeds (use `frameOffsetMax`/`setFrameOffset`),
  - server RSC cookie guard for designer canvas (use Bearer API),
  - broken `/templates/<id>/preview.webp` paths (use `coverImage`).

---

## 6. Time / stop rules

- Work until the owner's morning or until quota/time ends.
- Checkpoint at ~02:00 and ~04:00 local time; write handoff.
- Do not start B2/large migrations after 03:30.
- If blocked on auth/DNS/secrets/DB credentials, do not invent values; write the owner
  action and continue with independent P0/P2 work.
- If a task needs a schema/API change that risks production, write a design in
  `HANDOFFV2.MD` instead of shipping it half-baked.
- The primary objective is **safe launch**, not maximum feature count.

Start now by reading the repo and creating `HANDOFFV2.MD` baseline. Then execute P0.
