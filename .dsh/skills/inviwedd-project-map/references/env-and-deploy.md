# Environment and deploy

Names only — never values. Do not read `.env*`; this list was derived from `env("NAME")` and `process.env.NAME` in the code at git `868ac95`.

## Variables referenced in code (20)

| Name | Read by | Purpose | Where to set |
|---|---|---|---|
| `SUPABASE_URL` | `lib/server/supabase.ts` (`env()`) | Supabase project URL | dev: local env file; prod: `npx wrangler secret put SUPABASE_URL` |
| `SUPABASE_SECRET_KEY` | `lib/server/supabase.ts` | Server-side key used by `db()`; bypasses RLS | secret |
| `AUTH0_DOMAIN` | `lib/server/auth.ts`, `lib/auth0.ts` | JWT issuer + JWKS URL for `jose`; Auth0 SDK domain | secret |
| `AUTH0_AUDIENCE` | `lib/server/auth.ts`, `lib/auth0.ts` | Expected JWT audience; passed as `authorizationParameters.audience` | secret |
| `AUTH0_CLIENT_ID` | Auth0 SDK (`@auth0/nextjs-auth0` SSR routes) | OAuth client id; not referenced by repository code | secret |
| `AUTH0_CLIENT_SECRET` | Auth0 SDK | OAuth client secret; not referenced by repository code | secret |
| `AUTH0_SECRET` | Auth0 SDK | Session cookie encryption secret; not referenced by repository code | secret |
| `APP_BASE_URL` | `config/site.ts`, Auth0 SDK | Base URL for canonical/OG/sitemap URL building | var/secret |
| `SITE_URL` | `config/site.ts` | Fallback base URL (after `APP_BASE_URL`) | var |
| `NEXT_PUBLIC_SITE_URL` | `config/site.ts` | Third fallback base URL, client-visible | build-time var |
| `NEXT_PUBLIC_SITE_NAME` | `config/site.ts` | Brand name override, default `Inviwedd` | build-time var |
| `TURNSTILE_SECRET_KEY` | `lib/server/turnstile.ts` | Server-side Turnstile verification; when missing, dev skips and production fails closed | secret |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `components/TurnstileWidget.tsx` | Widget site key; when missing the widget is skipped and the server rejects submissions | build-time var |
| `SHARE_SHOW_GUEST_NAME` | `app/m/[slug]/page.tsx` | Only `"true"` puts the guest name in the OG title | var |
| `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` | `app/layout.tsx` | Cloudflare Web Analytics beacon, injected only when set | build-time var |
| `BANK_BIN` | `app/api/orders/route.ts` | Bank BIN for the VietQR payload | secret |
| `BANK_NAME` | `app/api/orders/route.ts` | Bank display name in the transfer modal | secret |
| `BANK_ACCOUNT_NO` | `app/api/orders/route.ts` | Receiving account number | secret |
| `BANK_ACCOUNT_NAME` | `app/api/orders/route.ts` | Receiving account holder | secret |
| `BANK_WEBHOOK_SECRET` | `app/api/webhooks/bank/route.ts` | Shared secret compared to the `x-webhook-secret` header | secret |
| `ADMIN_EMAIL` | `lib/server/ops.ts` | Comma-separated **bootstrap super-admin** allowlist for `/ops`; always admin, cannot be demoted from the UI | secret |
| `ADMIN_EMAILS` | `lib/server/ops.ts` | Alias used when `ADMIN_EMAIL` is empty | secret |

Notes:
- `config/site.ts` falls back to `http://localhost:3000` when none of `APP_BASE_URL`, `SITE_URL`, `NEXT_PUBLIC_SITE_URL` is set. In production that silently corrupts sitemap, canonical and OG URLs.
- `ADMIN_EMAIL` is configured in the local environment with the owner's admin address (value deliberately not stored here). Since v16, `/api/ops/me` resolves `admin`/`designer` from this env list **or** `ops_members`; if both are empty the role is `null` and every ops page 404s (fail closed).
- The Auth0 SDK configuration lives in the local environment too. Owner-confirmed 2026-11-14; the names the SDK consumes are `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` and `AUTH0_SECRET`. Values are never stored in this skill.
- `NEXT_PUBLIC_*` values are inlined at build time by Next.js; they must be present when `opennextjs-cloudflare build` runs, not only at runtime.

## Local environment state (owner-confirmed 2026-11-14)
- `SUPABASE_URL` points at the current project (`xklihgeirdxyormuxcoh.supabase.co`); `SUPABASE_SECRET_KEY` was replaced by the owner and now returns 200 on `/rest/v1/*`, so DB-backed pages work locally.
- **Windows dev caveat:** `next dev` starts workerd through `initOpenNextCloudflareForDev()`. If the repository sits under `Desktop`/`OneDrive`, Windows Defender Controlled Folder Access blocks `CreateDirectory` and workerd dies with `ERR_RUNTIME_FAILURE`. `next.config.ts` therefore persists Miniflare state in `os.tmpdir()` and catches the failure, logging a warning and continuing without Cloudflare bindings — the dev server runs, but `/media/[...key]` returns 404 (R2 unavailable). Set `CLOUDFLARE_DEV_BINDINGS=0` to skip workerd entirely, or move the repo outside Desktop / allow `workerd.exe` in Defender for full dev parity.
- `APP_BASE_URL` is still `http://localhost:3000` locally; production sets the real domain.
- `BANK_*` variables are not present locally, so `/api/orders` cannot build a VietQR payload in this environment.
- `supabase/migration_v11_guest_preferences.sql` (and v12/v13) are applied; RSVP preferences, Sổ mừng and Album now work against the live database. `migration_v14_designer.sql` and `migration_v15_designer_versions.sql` were run by the owner on 2026-11-14 and verified read-only. One designer template is published (**Đào Phấn** v2) and pinned to the test wedding slug `aaaaa` (guest slug `998c376174ee`); the remaining 36 templates are drafts.
- `migration_v16_ops_roles_template_meta.sql` (ops roles + `display_title`) is **not run yet**. Until it is: `ADMIN_EMAIL` is the only working ops identity, `/ops/roles` shows a migration hint, and the Template page can rename designs/upload covers but not edit the customer title.


## Deploy

Scripts (`package.json`): `dev` = `next dev`; `build` = `next build`; `preview` = `opennextjs-cloudflare build && opennextjs-cloudflare preview`; `deploy` = `opennextjs-cloudflare build && opennextjs-cloudflare deploy`; `lint` = `eslint .`.

`wrangler.jsonc`: worker `wedding-invitation`, **main `worker-entry.ts`** (custom entry that re-exports the OpenNext handler and adds the retention `scheduled` handler), assets `.open-next/assets` bound as `ASSETS`, self-reference binding `WORKER_SELF_REFERENCE`, R2 binding `PHOTOS` to bucket `thiep-cuoi-photos`, `triggers.crons` `0 3 * * *`, `compatibility_date` `2026-11-12`, flags `nodejs_compat` + `global_fetch_strictly_public`. There are no `vars` in the file. The unused `IMAGES` binding was removed in the capacity pass (`images.unoptimized` means it was never used).

`worker-entry.ts` is bundled by Wrangler, not Next, so it is excluded from `tsconfig.json` and ESLint; validate it with `npx wrangler deploy --dry-run`.

`open-next.config.ts` uses the default config with the R2 incremental cache commented out, so ISR/caching runs without a shared incremental cache.

### Windows deploy caveats (verified 2026-11-14)
- `opennextjs-cloudflare build` compiles the config with esbuild into `%TEMP%`. If `node_modules\@esbuild\win32-x64\esbuild.exe` carries a **Low mandatory integrity label** (left by a sandbox/agent run), esbuild runs low-integrity and fails with `Failed to write to output file: ...open-next.config.mjs: Access is denied`. Fix: `icacls node_modules\@esbuild\win32-x64 /setintegritylevel Medium /T` (the agent did this; `npm install` keeps the label). Alternative workaround: copy `esbuild.exe` to a normal folder and set `ESBUILD_BINARY_PATH`.
- Next 16's middleware runtime statically references `critters` even though `experimental.optimizeCss` is off, and OpenNext's Node-middleware bundle does not externalize it. The repo uses `vendor/critters-stub` as a `file:` dependency plus `.npmrc` `install-links=true` so npm copies a real directory instead of a junction (OpenNext copies node_modules entries with `fs.symlink`, so a junction becomes a broken relative link). The stub throws if `optimizeCss` is ever enabled; install the real `critters` and drop the `file:vendor/critters-stub` entry in that case.
- `wrangler whoami` reports **not authenticated** in this environment. The owner must run `npx wrangler login` or set `CLOUDFLARE_API_TOKEN` before `npm run deploy`; the build step itself now completes.
- `npx wrangler deploy --dry-run` reports ~18.7 MiB total / **~4.08 MiB gzip** including assets; the Worker script is ~16.7 MiB uncompressed. Cloudflare's current limit is **64 MiB uncompressed with no gzip cap**, so size is not a blocker. Workers Paid ($5/mo) is still required in practice because the free plan allows only **10 ms CPU/request** (SSR and the retention cron can exceed it; Error 1102), while the free 100k requests/day is ample at 100 DAU. See `PRODUCTION_CAPACITY.md` for the capacity model and migration thresholds.

Secrets are set by the owner, never pasted in chat: `npx wrangler secret put NAME`.

### Caching (2026-11-14)
- `/media/[...key]` checks `caches.default` before R2 and stores the immutable response (Cache API, per data center); `s-maxage` added for a future CDN Cache Rule. Cache API reduces R2 Class B/CPU but the request still invokes the Worker.
- `getDesignerVersion(templateId, version)` caches the immutable published canvas JSON for 1 day via Cache API.
- `/m/[slug]` and `/w/[slug]` wrap the public wedding fetch in React `cache()` so metadata + page share one DB read per request.
- `lib/server/supabase.ts` caches one Supabase client per isolate.
- Not done: Cloudflare Cache Rule for `/media/*` (to bypass the Worker), full HTML caching for `/w`/`/m`, and route-group font splitting.

## Post-deploy checks
1. `/` renders and `/sitemap.xml` + `/robots.txt` contain the real domain (not localhost).
2. `/cong-cu`, `/cong-cu/doi-am-lich`, `/cong-cu/bang-tinh-dam-cuoi` load.
3. `/w/<known-slug>` renders server-side; `/m/<known-guest-slug>` shows the guest name.
4. `/dashboard` redirects anonymous users to `/auth/login`.
5. `/ops` returns 404 for a non-admin; with `ADMIN_EMAIL` set, `/api/ops/me` reports `isAdmin: true` and lists real rows (not mock).
6. Upload a photo: compresses client-side, stores in R2, serves from `/media/...` with `Cache-Control: immutable`.
7. Turnstile widget renders on the invitation and the RSVP submit succeeds.
8. Share `/w/<slug>` in Zalo/Facebook: preview shows the couple, never the guest name, with a 1200×630-friendly image.
9. `node scripts/check-contrast.mjs` still passes.
10. `POST /api/webhooks/bank` with a valid `x-webhook-secret` creates a transaction. The sender is a Google Apps Script project (owner-confirmed 2026-11-14); its source is not in this repository, so changes to the webhook contract must be coordinated with the owner.
