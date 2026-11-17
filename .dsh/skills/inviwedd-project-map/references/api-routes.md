# API routes

Verified against the working tree at 2026-11-14 (public designer catalog). 53 `route.ts` files, 70 exported handlers.

Auth legend:
- `public` — no auth wrapper.
- `public+Turnstile` — no auth; `verifyTurnstileToken` plus a `website` honeypot are checked first.
- `webhook secret` — `x-webhook-secret` compared to `BANK_WEBHOOK_SECRET` with `safeEqual`.
- `JWT` — `authRoute()`: `Authorization: Bearer` verified by `lib/server/auth.ts`; 401 when absent/invalid.
- `JWT+owner` — same, then `getOwnedWedding(id, user.id)` scopes the row; 404 when not owned.
- `admin` — `opsRoute()`: JWT plus role `admin` (email in `ADMIN_EMAIL`/`ADMIN_EMAILS` or `ops_members`, migration v16); 403 otherwise.
- `admin+designer` — `opsDesignerRoute()`: JWT plus role `admin` or `designer` from `ops_members`; 403 otherwise.

| Method | Path | Auth | Purpose | File |
|---|---|---|---|---|
| GET | `/api/invite/[slug]` | public (rate-limited 60/min) | Guest name, status, plusOnes, diet, songRequest, rideNeeded and the events visible to that guest | `app/api/invite/[slug]/route.ts` |
| POST | `/api/me` | JWT | Upsert `users` row, return profile + theme | `app/api/me/route.ts` |
| PATCH | `/api/me/theme` | JWT | Persist light/dark brand theme | `app/api/me/theme/route.ts` |
| POST | `/api/rsvp` | public+Turnstile (rate-limited 10/min) | Update a guest RSVP by slug, or insert a walk-in guest by `weddingSlug` (enforces the plan guest limit); persists plus-ones, diet, song request, ride; 403 when suspended | `app/api/rsvp/route.ts` |
| POST | `/api/wishes` | public+Turnstile (rate-limited 10/min) | Insert one wish (guest slug or wedding slug); 403 when the wedding is suspended | `app/api/wishes/route.ts` |
| GET | `/api/public/wedding/[slug]` | public | Public wedding payload: content, events, photos, plan, `designerTemplate` (pinned version canvas or `null`) | `app/api/public/wedding/[slug]/route.ts` |
| GET | `/api/public/designer-templates` | public | Published designer templates for the homepage catalog (id, name, displayTitle, plan, ritual, version, coverUrl); edge-cached 60s | `app/api/public/designer-templates/route.ts` |
| GET | `/api/weddings/check-slug?slug=` | public (rate-limited 30/min) | Slug validity + availability | `app/api/weddings/check-slug/route.ts` |
| GET | `/api/weddings` | JWT | List weddings owned by the caller | `app/api/weddings/route.ts` |
| POST | `/api/weddings` | JWT | Create a wedding (always `plan: free`, slug + allowed template) | `app/api/weddings/route.ts` |
| GET | `/api/weddings/[id]` | JWT+owner | Wedding + events + photos + `designerTemplate` info (`pinnedVersion`, `latestVersion`) | `app/api/weddings/[id]/route.ts` |
| PATCH | `/api/weddings/[id]` | JWT+owner | Update template and/or full content | `app/api/weddings/[id]/route.ts` |
| DELETE | `/api/weddings/[id]` | JWT+owner | Delete wedding and its R2 objects | `app/api/weddings/[id]/route.ts` |
| GET | `/api/designer-templates` | JWT | Published designer templates for the dashboard picker (id, name, `displayTitle`, plan, ritual, latest version, cover url) | `app/api/designer-templates/route.ts` |
| PATCH | `/api/weddings/[id]/designer-template` | JWT+owner | Assign/clear a designer template and pin a version; blocks unpublished templates and plan mismatch; 503 when migrations v14/v15 are missing | `app/api/weddings/[id]/designer-template/route.ts` |
| PATCH | `/api/weddings/[id]/content` | JWT+owner | Update content + template, validates that referenced photo ids belong to the wedding | `app/api/weddings/[id]/content/route.ts` |
| GET | `/api/weddings/[id]/events` | JWT+owner | List events | `app/api/weddings/[id]/events/route.ts` |
| POST | `/api/weddings/[id]/events` | JWT+owner | Create event (plan event limit) | `app/api/weddings/[id]/events/route.ts` |
| PATCH | `/api/weddings/[id]/events` | JWT+owner | Reorder events | `app/api/weddings/[id]/events/route.ts` |
| PATCH | `/api/weddings/[id]/events/[eventId]` | JWT+owner | Update one event; keeps `map_embed_url` untouched when the client omits it | `app/api/weddings/[id]/events/[eventId]/route.ts` |
| DELETE | `/api/weddings/[id]/events/[eventId]` | JWT+owner | Delete one event | `app/api/weddings/[id]/events/[eventId]/route.ts` |
| GET | `/api/weddings/[id]/guests` | JWT+owner | List guests. Without `page` returns all rows (legacy); with `page` returns `{items,page,pageSize,total,totalPages}` and supports `q` + `status` filters | `app/api/weddings/[id]/guests/route.ts` |
| POST | `/api/weddings/[id]/guests` | JWT+owner | Create guest (plan guest limit) | `app/api/weddings/[id]/guests/route.ts` |
| POST | `/api/weddings/[id]/guests/bulk` | JWT+owner | Bulk create ≤500 names (plan guest limit) | `app/api/weddings/[id]/guests/bulk/route.ts` |
| PATCH | `/api/weddings/[id]/guests/[guestId]` | JWT+owner | Rename guest | `app/api/weddings/[id]/guests/[guestId]/route.ts` |
| DELETE | `/api/weddings/[id]/guests/[guestId]` | JWT+owner | Delete guest | `app/api/weddings/[id]/guests/[guestId]/route.ts` |
| POST | `/api/weddings/[id]/guests/[guestId]/events` | JWT+owner | Replace the guest's event assignments | `app/api/weddings/[id]/guests/[guestId]/events/route.ts` |
| GET | `/api/weddings/[id]/photos` | JWT+owner | List photos | `app/api/weddings/[id]/photos/route.ts` |
| POST | `/api/weddings/[id]/photos` | JWT+owner | Upload photo (≤5 MB, jpeg/png/webp, magic-byte check) with per-kind plan limit; single-slot kinds replace the previous photo after a successful insert; accepts `album` | `app/api/weddings/[id]/photos/route.ts` |
| PATCH | `/api/weddings/[id]/photos` | JWT+owner | Reorder gallery photos | `app/api/weddings/[id]/photos/route.ts` |
| DELETE | `/api/weddings/[id]/photos/[photoId]` | JWT+owner | Delete photo row + R2 object | `app/api/weddings/[id]/photos/[photoId]/route.ts` |
| GET | `/api/weddings/[id]/wishes` | JWT+owner | List wishes (`.limit(1000)`) | `app/api/weddings/[id]/wishes/route.ts` |
| GET | `/api/weddings/[id]/stats` | JWT+owner | Dashboard aggregates: status counts, headcount, diets, per-event visibility | `app/api/weddings/[id]/stats/route.ts` |
| POST | `/api/orders` | JWT | Create or reuse (24 h) a pending order and return VietQR payload + bank info | `app/api/orders/route.ts` |
| GET | `/api/orders/[id]` | JWT (owner) | Order status for polling | `app/api/orders/[id]/route.ts` |
| POST | `/api/webhooks/bank` | webhook secret | Record bank transaction, match `INV-XXXXXX` in description, mark order paid, upgrade wedding plan | `app/api/webhooks/bank/route.ts` |
| GET | `/api/ops/me` | none (manual JWT read) | Returns `{ email, isAdmin, role }`; role resolved from env admin list or `ops_members`; `role: null` when unauthenticated/unauthorized | `app/api/ops/me/route.ts` |
| GET | `/api/weddings/[id]/gifts` | JWT+owner, Pro/VIP | Gift list + totals (`totalVnd`, `count`, `unthankedCount`) | `app/api/weddings/[id]/gifts/route.ts` |
| POST | `/api/weddings/[id]/gifts` | JWT+owner, Pro/VIP | Create a gift entry (giver, amount, method, note, optional guest) | `app/api/weddings/[id]/gifts/route.ts` |
| PATCH | `/api/weddings/[id]/gifts/[giftId]` | JWT+owner, Pro/VIP | Update a gift or toggle `thanked` (sets `thanked_at`) | `app/api/weddings/[id]/gifts/[giftId]/route.ts` |
| DELETE | `/api/weddings/[id]/gifts/[giftId]` | JWT+owner, Pro/VIP | Delete a gift entry | `app/api/weddings/[id]/gifts/[giftId]/route.ts` |
| GET | `/api/ops/stats` | admin | Counters via head counts + month-bounded revenue query | `app/api/ops/stats/route.ts` |
| GET | `/api/ops/designer/templates` | admin+designer | List designer templates (optional `q` name search) | `app/api/ops/designer/templates/route.ts` |
| POST | `/api/ops/designer/templates` | admin+designer | Create a designer template (`name`, `plan`, `ritual`) | `app/api/ops/designer/templates/route.ts` |
| GET | `/api/ops/designer/templates/[id]` | admin+designer | One designer template incl. `canvas_json` | `app/api/ops/designer/templates/[id]/route.ts` |
| PATCH | `/api/ops/designer/templates/[id]` | admin+designer | Save canvas JSON, name, status or `background_key` | `app/api/ops/designer/templates/[id]/route.ts` |
| POST | `/api/ops/designer/templates/[id]/publish` | admin+designer | Copy the current canvas into `designer_template_versions` (version+1) and mark published | `app/api/ops/designer/templates/[id]/publish/route.ts` |
| GET | `/api/ops/designer/assets` | admin+designer | List designer assets | `app/api/ops/designer/assets/route.ts` |
| POST | `/api/ops/designer/assets` | admin+designer | Upload a designer webp asset to R2 (`kind`, `dataUrl`) | `app/api/ops/designer/assets/route.ts` |
| GET | `/api/ops/templates` | admin+designer | Published templates running in production + usage count + `needsMigration` | `app/api/ops/templates/route.ts` |
| PATCH | `/api/ops/templates/[id]` | admin+designer | Rename a design (`name`) and/or its customer title (`displayTitle`); audit log | `app/api/ops/templates/[id]/route.ts` |
| POST | `/api/ops/templates/[id]/cover` | admin+designer | Upload a WebP cover (≤4 MB) → R2 + `snapshot_key` + `designer_assets`; audit log | `app/api/ops/templates/[id]/cover/route.ts` |
| GET | `/api/ops/roles` | admin | Role list + env-admin flags + `needsMigration` | `app/api/ops/roles/route.ts` |
| POST | `/api/ops/roles` | admin | Grant/update `admin`/`designer` by email; audits; self-demotion and env-admin demotion blocked | `app/api/ops/roles/route.ts` |
| DELETE | `/api/ops/roles?email=` | admin | Revoke a role; audits; env-admin and self removal blocked | `app/api/ops/roles/route.ts` |
| POST | `/api/ops/designer/import` | admin | Import a code template into a designer template | `app/api/ops/designer/import/route.ts` |
| POST | `/api/ops/designer/seed-styles` | admin | Seed the original draggable style set | `app/api/ops/designer/seed-styles/route.ts` |
| POST | `/api/ops/retention/run` | admin | Run the 30-day purge job; `dryRun` lists candidates, otherwise deletes DB rows + R2 objects and writes an audit log | `app/api/ops/retention/run/route.ts` |
| GET | `/api/ops/users` | admin | Paginated user list (filter + slice in memory) | `app/api/ops/users/route.ts` |
| GET | `/api/ops/users/[id]` | admin | One user + their weddings | `app/api/ops/users/[id]/route.ts` |
| GET | `/api/ops/weddings` | admin | Paginated wedding list (loads all rows, filters in memory) | `app/api/ops/weddings/route.ts` |
| GET | `/api/ops/weddings/[id]` | admin | One wedding detail | `app/api/ops/weddings/[id]/route.ts` |
| POST | `/api/ops/weddings/[id]/plan` | admin | Force a plan change | `app/api/ops/weddings/[id]/plan/route.ts` |
| POST | `/api/ops/weddings/[id]/suspend` | admin | Set/clear `suspended` + audit log | `app/api/ops/weddings/[id]/suspend/route.ts` |
| GET | `/api/ops/orders` | admin | Order list | `app/api/ops/orders/route.ts` |
| POST | `/api/ops/orders/[id]/confirm` | admin | Mark order paid and upgrade the wedding | `app/api/ops/orders/[id]/confirm/route.ts` |
| POST | `/api/ops/orders/[id]/cancel` | admin | Cancel a pending order | `app/api/ops/orders/[id]/cancel/route.ts` |
| GET | `/api/ops/bank-transactions` | admin | Bank transaction list | `app/api/ops/bank-transactions/route.ts` |
| POST | `/api/ops/bank-transactions/[id]/match` | admin | Manually match a transaction to an order and upgrade | `app/api/ops/bank-transactions/[id]/match/route.ts` |
| GET | `/api/ops/audit` | admin | Audit log list | `app/api/ops/audit/route.ts` |

## Called by the client but missing in `app/api`
- `PUT /api/guests/[guestId]/events` — no longer called; bulk assignment uses the nested route below.
- `POST /api/ops/users/[id]/merge` — called by `mergeOpsUser` in `lib/ops-api.ts`; no route exists, so the merge UI is hidden.

## Not present (checked, absent)
`/api/admin/*` routes and any `SESSION_SECRET` usage: not in the repository at git `868ac95`.
