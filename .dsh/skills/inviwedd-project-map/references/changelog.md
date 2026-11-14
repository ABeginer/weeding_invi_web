# Changelog

Newest first. One entry per update: date · what changed · why · files involved · git commit.

## 2026-11-14 · v1.0.5 · batch 4 (code `04192e7`)
- Built **Sổ mừng**: `gifts` table (migration v12), GET/POST/PATCH/DELETE routes gated to Pro/VIP, nav/page restored.
- Built **Album**: migration v13 allows `kind = 'album'`, upload enabled, public `noindex` page at `/a/[slug]`, dashboard link.
- Built **retention job**: `purgeExpiredFreeWeddings()` (30 days, batch 50, R2 + DB, dry-run) + `POST /api/ops/retention/run` + daily cron 03:00 UTC through `worker-entry.ts`; validated with `wrangler deploy --dry-run`.
- **Guest list pagination**: server-side `q`/`status` filters, 50 per page, `count`-based `totalPages`, pager in the UI; legacy API shape kept.
- Owner must run migrations v11, v12, v13.
- Files: `app/a/[slug]/page.tsx`, `app/api/weddings/[id]/gifts/**`, `app/api/ops/retention/run/route.ts`, `app/api/weddings/[id]/{guests,photos}/route.ts`, `lib/server/{retention,mappers,storage}.ts`, `lib/api.ts`, `worker-entry.ts`, `wrangler.jsonc`, `components/dashboard/**`, `supabase/migration_v1{1,2,3}*.sql`.

## 2026-11-14 · v1.0.4 · batch 3 (code `b06ebad`)
- Untracked build output and local state: `.open-next/` (2,342 files, ~53 MB), `.wrangler/` and `scratch/` removed from the index and gitignored; tracked files went from 2,778 to 396.
- Rewrote `README.md` (UTF-8), `HANDOFF.md`, `TODO.md`, `INTEGRATION.md`; marked `DESIGN_PLAN.md` historical.
- Added `typecheck` and `test` scripts (`node --test --test-isolation=none`) and `.github/workflows/ci.yml` (install → typecheck → lint → test → build).
- Ops pages now surface API failures: `lib/ops-api.ts` dispatches `ops-api-error`, `app/ops/layout.tsx` renders a dismissible banner with retry.
- Verified: tsc/lint clean, 8/8 tests, build ok, `next start` smoke test ok.
- Files: `.gitignore`, `package.json`, `.github/workflows/ci.yml`, `README.md`, `HANDOFF.md`, `TODO.md`, `INTEGRATION.md`, `DESIGN_PLAN.md`, `lib/ops-api.ts`, `app/ops/layout.tsx`.

## 2026-11-14 · v1.0.3 · batch 2 (code `db98d6c`)
- Public RSVP enforces the plan guest limit; `songRequest`/`rideNeeded` persist end-to-end (new `migration_v11_guest_preferences.sql`, **not applied yet**), are returned by the invite API and prefilled in every template; `map_embed_url` is preserved on event edit.
- Added in-memory rate limiting for RSVP, wishes, invite and check-slug with 429 + `Retry-After`; verified 10×400 → 429 in a live smoke test.
- Added `lib/server/pagination.ts` and removed the silent 1,000-row PostgREST truncation in guest lists, dashboard stats and ops lists; ops stats switched to head counts + month-bounded revenue.
- Pricing copy now matches shipped features (template counts, MP3/album/Excel marked "Sắp có", gift QR stated as shipped, logo row removed); `/w/[slug]` is `noindex`; `.env.example` lists every variable name.
- Owner replaced the Supabase secret key; DB-backed smoke tests (pages + public/invite APIs) now pass locally.
- Files: `app/api/{rsvp,wishes,invite,w/[slug],weddings,ops}/**`, `lib/server/{rate-limit,pagination,mappers}.ts`, `lib/types.ts`, `config/pricing.ts`, `templates/**`, `components/{dashboard,invitation}/**`, `.env.example`, `supabase/migration_v11_guest_preferences.sql`.

## 2026-11-14 · v1.0.2 · owner confirmations + env diagnosis
- Owner confirmed all committed migrations are applied; `db-schema.md` now records APPLIED for v2, v3, v4, v5, v10 and notes that no v6–v9 files exist.
- Owner confirmed Auth0 SDK config lives in the local env (`AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`), the bank webhook is sent by a Google Apps Script project outside the repo, `ADMIN_EMAIL` is configured, and the 30-day free-plan retention commitment stays.
- Diagnosed the local DB failure: `SUPABASE_URL` is the correct project (`xklihgeirdxyormuxcoh.supabase.co`) with no old URL and no OS-level override; `SUPABASE_SECRET_KEY` is a well-formed `sb_secret_` key but the project answers `401 Unregistered API key`, so the URL/key pair is mismatched. Key replacement is owner-blocked.
- Added `ADMIN_EMAIL` to `.env.local` (value not recorded here). No other env value was read aloud or stored.
- Files: `references/{db-schema,env-and-deploy,decisions,open-items,changelog}.md`, `SKILL.md`; `\.env.local` (gitignored).

## 2026-11-14 · v1.0.1 · batch 1 unblock fixes (code `0c3c7e5`)
- Fixed the eight blockers recorded at v1.0.0:
  - Sổ mừng: nav entry removed; page renders a "đang hoàn thiện" notice (no route/table existed).
  - Album: upload disabled with an explicit message until the DB kind and `MEDIA_KEY_RE` support it.
  - Bulk event assignment: calls the existing nested route instead of a missing `/api/guests/[id]/events`.
  - Single-slot photos: the API now uploads the new object first and replaces the old row afterwards (no delete-first data loss), keyed by the content photo id.
  - Turnstile: a failed script load is retryable and shows a visible error instead of silently locking the form.
  - `/m/[slug]`: renders immediately from server data; the per-guest fetch only hydrates RSVP status and never blocks first paint.
  - Ops: the client mock fallback is gone, `/api/ops/me` fails closed when `ADMIN_EMAIL` is unset, the merge button is hidden (no route), and no fabricated data is displayed.
  - Suspended weddings: blocked on `/w`, `/m`, `/api/public/wedding/[slug]`, `/api/invite/[slug]`, RSVP and wishes; `suspended` is read with a fallback to `content.suspended` when migration v10 has not run.
- `next.config.ts`: Miniflare/workerd starts only for `next dev`, so production builds no longer need the Workers runtime.
- Verified: `tsc --noEmit` and `eslint .` clean; `next build` succeeds; `next start` smoke test passed for `/`, `/cong-cu*`, `/m/<invalid>`, `/ops`, `/sitemap.xml`, `/robots.txt`, `/dashboard` (307 to login), and 404 paths for `/w/ab`, `/api/public/wedding/ab`, `/api/invite/ab`, `/media/*`.
- New known issue: the local Supabase credential is rejected ("Unregistered API key"), so every DB-backed route returns 500 locally; owner must rotate/update it. Not caused by these changes.
- Files: `app/api/{invite,rsvp,wishes,ops/me}/**`, `app/api/weddings/[id]/photos/route.ts`, `app/dashboard/so-mung/page.tsx`, `app/m/[slug]/page.tsx`, `app/ops/users/[id]/page.tsx`, `components/{TurnstileWidget,dashboard/*,invitation/InvitePageClient}.tsx`, `lib/{api,ops-api}.ts`, `lib/server/{weddings,public-wedding}.ts`, `next.config.ts`.

## 2026-11-14 · v1.0.0 · initial skill creation
- Created `inviwedd-project-map` on the owner's request, because context is lost between sessions and the repository had no durable project map.
- Recorded: architecture and repo layout, all 37 `route.ts` files / 47 handlers with their auth layer, the 5 committed migrations and the tables they create (plus the three tables used by code but absent from migrations), the 20 environment variable names and where each is read, the product/technical decisions with reasons, and the open blockers found in a read-only review.
- Verified from a read-only pass at git `868ac95`; `tsc --noEmit` and `eslint .` both pass. No source file modified, no `.env*` read, no migration executed.
- Files: `.dsh/skills/inviwedd-project-map/SKILL.md`, `references/{api-routes,db-schema,env-and-deploy,decisions,open-items,changelog}.md`.
