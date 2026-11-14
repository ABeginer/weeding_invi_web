# Environment and deploy

Names only — never values. Do not read `.env*`; this list was derived from `env("NAME")` and `process.env.NAME` in the code at git `868ac95`.

## Variables referenced in code (20)

| Name | Read by | Purpose | Where to set |
|---|---|---|---|
| `SUPABASE_URL` | `lib/server/supabase.ts` (`env()`) | Supabase project URL | dev: local env file; prod: `npx wrangler secret put SUPABASE_URL` |
| `SUPABASE_SECRET_KEY` | `lib/server/supabase.ts` | Server-side key used by `db()`; bypasses RLS | secret |
| `SUPABASE_PUBLISHABLE_KEY` | `lib/server/supabase.ts` (`authClient()`, unused) | Dead code path; no caller exists | not needed today |
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
| `ADMIN_EMAIL` | `lib/server/ops.ts` | Comma-separated allowlist for `/ops` routes | secret |
| `ADMIN_EMAILS` | `lib/server/ops.ts` | Alias used when `ADMIN_EMAIL` is empty | secret |

Notes:
- `config/site.ts` falls back to `http://localhost:3000` when none of `APP_BASE_URL`, `SITE_URL`, `NEXT_PUBLIC_SITE_URL` is set. In production that silently corrupts sitemap, canonical and OG URLs.
- `ADMIN_EMAIL` is configured in the local environment with the owner's admin address (value deliberately not stored here). `opsRoute()` denies everyone when it is unset, and `/api/ops/me` reports `isAdmin: false` in that case.
- The Auth0 SDK configuration lives in the local environment too. Owner-confirmed 2026-11-14; the names the SDK consumes are `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` and `AUTH0_SECRET`. Values are never stored in this skill.
- `NEXT_PUBLIC_*` values are inlined at build time by Next.js; they must be present when `opennextjs-cloudflare build` runs, not only at runtime.

## Local environment state (owner-confirmed 2026-11-14)
- `SUPABASE_URL` points at the current project (`xklihgeirdxyormuxcoh.supabase.co`); `SUPABASE_SECRET_KEY` was replaced by the owner and now returns 200 on `/rest/v1/*`, so DB-backed pages work locally.
- `APP_BASE_URL` is still `http://localhost:3000`; production must set the real domain or canonical/OG/sitemap URLs will point at localhost.
- `BANK_*` variables are not present locally, so `/api/orders` cannot build a VietQR payload in this environment.
- `supabase/migration_v11_guest_preferences.sql` (and v12/v13) are applied; RSVP preferences, Sổ mừng and Album now work against the live database.


## Deploy

Scripts (`package.json`): `dev` = `next dev`; `build` = `next build`; `preview` = `opennextjs-cloudflare build && opennextjs-cloudflare preview`; `deploy` = `opennextjs-cloudflare build && opennextjs-cloudflare deploy`; `lint` = `eslint .`.

`wrangler.jsonc`: worker `wedding-invitation`, **main `worker-entry.ts`** (custom entry that re-exports the OpenNext handler and adds the retention `scheduled` handler), assets `.open-next/assets` bound as `ASSETS`, self-reference binding `WORKER_SELF_REFERENCE`, image binding `IMAGES` (unused because `next.config.ts` sets `images.unoptimized`), R2 binding `PHOTOS` to bucket `thiep-cuoi-photos`, `triggers.crons` `0 3 * * *`, `compatibility_date` `2026-11-12`, flags `nodejs_compat` + `global_fetch_strictly_public`. There are no `vars` in the file.

`worker-entry.ts` is bundled by Wrangler, not Next, so it is excluded from `tsconfig.json` and ESLint; validate it with `npx wrangler deploy --dry-run`.

`open-next.config.ts` uses the default config with the R2 incremental cache commented out, so ISR/caching runs without a shared incremental cache.

Secrets are set by the owner, never pasted in chat: `npx wrangler secret put NAME`.

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
