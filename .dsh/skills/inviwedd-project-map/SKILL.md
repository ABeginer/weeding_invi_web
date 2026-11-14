---
name: inviwedd-project-map
description: "Use at the start of any task on the Inviwedd wedding invitation project and after any major change to it"
version: 1.0.7
metadata:
  hermes:
    tags: [project, architecture, memory]
---

# Inviwedd project map

## When to Use
Load this skill at the start of every task in this repository, and again after any major change (see Update protocol). Read `references/open-items.md` first: it holds the handoff block, known blockers and owner-blocked questions. Use this map instead of re-exploring the tree; open the pointed file only when you need detail.

## Project in one paragraph
Inviwedd is a Vietnamese-only SaaS that sells personalised online wedding invitations. A couple creates a wedding on a slug, picks one of the built-in templates, edits content, uploads photos and events, then shares a public link (`/w/<slug>`) or per-guest links (`/m/<guestSlug>`) that show the guest's name and let them RSVP and leave a wish. Access is per-wedding (`weddings.plan` = free | pro | vip) and is upgraded by a bank-transfer order. There is also a Vietnamese-utility section (`/cong-cu`) and an internal operations console (`/ops`).

## Architecture map
```
guest browser / owner dashboard
        │ HTTPS (Next.js App Router)
        ▼
Cloudflare Worker (OpenNext, nodejs_compat)
        │                         └── Auth0 (login, RS256 JWT verified with jose)
        │ service-role key
        ▼
Supabase Postgres (RLS on; anon + authenticated revoked)
        ▲
        │ POST /api/webhooks/bank  (header: x-webhook-secret)
Google Apps Script  ◄── bank transfer notification email
        │
        └── VietQR payload built in lib/server/vietqr.ts
Photos: Cloudflare R2 bucket `thiep-cuoi-photos` (binding PHOTOS), served by /media/[...key]
```

## Repo layout
- `app/` — App Router: pages, `app/api/**/route.ts`, sitemap/robots; `proxy.ts` is Next 16 middleware (guards `/dashboard`, mounts Auth0 routes).
- `components/` — UI by area: `invitation/`, `dashboard/`, `landing/`, `create/`, `ops/`, `tools/`, `theme/`, `ui/`.
- `lib/` — client API (`api.ts`), types, wedding content data, lunar calendar, budget calc, theme tokens.
- `lib/server/` — server-only: `http.ts` (wrappers), `auth.ts`, `supabase.ts`, `owner.ts`, `ops.ts`, `weddings.ts`, `public-wedding.ts`, `storage.ts`, `turnstile.ts`, `payments.ts`, `vietqr.ts`, `validate.ts`, `mappers.ts`.
- `templates/` — 24 invitation templates; `registry.ts` is the catalog; `themed/` is the shared engine for most templates.
- `config/` — site, plans/limits, pricing table, landing copy, tools copy, ritual config, bank copy.
- `content/` — demo wedding data used by template demos.
- `supabase/` — hand-run SQL migrations (v2, v3, v4, v5, v10).
- `public/` — photos, music, template covers, QR images.
- `.open-next/`, `.wrangler/`, `.next/`, `scratch/` — build output and local state; all gitignored since batch 3 (they used to be committed).
- `tests/`, `scripts/` — node:test files and `check-contrast.mjs`; run checks with `npm run typecheck|lint|test|build` (CI runs the same four).

## Where to look
- `references/api-routes.md` — every `route.ts`: method, path, auth, purpose.
- `references/db-schema.md` — tables, constraints, triggers, migration list + status.
- `references/env-and-deploy.md` — env variable names, who reads them, deploy and post-deploy checks.
- `references/decisions.md` — product/technical decisions and the reason for each.
- `references/open-items.md` — handoff, known bugs, owner-blocked items.
- `references/changelog.md` — dated change log, newest first.

## Working agreements
- SQL migrations are delivered as separate `.sql` files, never pasted inline in chat.
- Never assume a migration has been run. Ask the owner, then record the status.
- Never print, read or store secrets or `.env*` files. Ask the owner to set secrets with `npx wrangler secret put NAME`.
- Do not deploy unless the owner asks.
- Ask before any change that cannot be undone (data deletion, plan changes, removing routes).
- UI copy is Vietnamese with correct diacritics. Application UI uses theme tokens (`bg`, `surface`, `text`, `accent-*`), not hard-coded colors; invitation templates intentionally own their own palettes.
- API errors are `{ error, code }`; handlers are wrapped with `route()`, `authRoute()` or `opsRoute()` from `lib/server/http.ts` / `lib/server/ops.ts`; dynamic route params are a Promise.

## Update protocol
Update when: a route or page group is added/renamed/removed; a migration is added or its status changes; an env var, binding, script or `wrangler.jsonc` setting changes; auth, payments, plan limits or pricing change; a feature lands or a product decision is made; 5+ files changed in one task; or you are about to stop / context is ~70% full.
Steps: edit only the affected file with a small patch; prepend one dated line to `references/changelog.md` (what, why, files); update **Last verified** and bump the patch version; keep `SKILL.md` under 8,000 characters and move detail into `references/`; if stopping mid-task, rewrite the Handoff block at the top of `references/open-items.md`; re-read the saved file to confirm; tell the owner in one line.

At session start: read `references/open-items.md`, compare **Last verified** with `git log`, and patch this skill before starting the task if newer commits exist.

## Last verified
2026-11-14 · migrations v11–v13 applied and verified · batch 5 adds CSP/HSTS + 22 unit tests. Verified with `npm run typecheck`, `npm run lint`, `npm run test` (22/22), `next build`, `wrangler deploy --dry-run`, and a `next start` smoke test with headers. Retention cron and CSP still need a real-browser/production check.
