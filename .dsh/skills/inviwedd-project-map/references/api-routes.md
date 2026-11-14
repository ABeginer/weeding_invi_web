# API routes

Verified against git `868ac95`. 37 `route.ts` files, 47 exported handlers.

Auth legend:
- `public` — no auth wrapper.
- `public+Turnstile` — no auth; `verifyTurnstileToken` plus a `website` honeypot are checked first.
- `webhook secret` — `x-webhook-secret` compared to `BANK_WEBHOOK_SECRET` with `safeEqual`.
- `JWT` — `authRoute()`: `Authorization: Bearer` verified by `lib/server/auth.ts`; 401 when absent/invalid.
- `JWT+owner` — same, then `getOwnedWedding(id, user.id)` scopes the row; 404 when not owned.
- `admin` — `opsRoute()`: JWT plus `ADMIN_EMAIL`/`ADMIN_EMAILS` allowlist; 403 otherwise.

| Method | Path | Auth | Purpose | File |
|---|---|---|---|---|
| GET | `/api/invite/[slug]` | public | Guest name, status, plusOnes, diet and the events visible to that guest | `app/api/invite/[slug]/route.ts` |
| POST | `/api/me` | JWT | Upsert `users` row, return profile + theme | `app/api/me/route.ts` |
| PATCH | `/api/me/theme` | JWT | Persist light/dark brand theme | `app/api/me/theme/route.ts` |
| POST | `/api/rsvp` | public+Turnstile | Update a guest RSVP by slug, or insert a walk-in guest by `weddingSlug`; optionally saves a wish | `app/api/rsvp/route.ts` |
| POST | `/api/wishes` | public+Turnstile | Insert one wish (guest slug or wedding slug) | `app/api/wishes/route.ts` |
| GET | `/api/public/wedding/[slug]` | public | Public wedding payload: content, events, photos, plan | `app/api/public/wedding/[slug]/route.ts` |
| GET | `/api/weddings/check-slug?slug=` | public | Slug validity + availability | `app/api/weddings/check-slug/route.ts` |
| GET | `/api/weddings` | JWT | List weddings owned by the caller | `app/api/weddings/route.ts` |
| POST | `/api/weddings` | JWT | Create a wedding (always `plan: free`, slug + allowed template) | `app/api/weddings/route.ts` |
| GET | `/api/weddings/[id]` | JWT+owner | Wedding + events + photos | `app/api/weddings/[id]/route.ts` |
| PATCH | `/api/weddings/[id]` | JWT+owner | Update template and/or full content | `app/api/weddings/[id]/route.ts` |
| DELETE | `/api/weddings/[id]` | JWT+owner | Delete wedding and its R2 objects | `app/api/weddings/[id]/route.ts` |
| PATCH | `/api/weddings/[id]/content` | JWT+owner | Update content + template, validates that referenced photo ids belong to the wedding | `app/api/weddings/[id]/content/route.ts` |
| GET | `/api/weddings/[id]/events` | JWT+owner | List events | `app/api/weddings/[id]/events/route.ts` |
| POST | `/api/weddings/[id]/events` | JWT+owner | Create event (plan event limit) | `app/api/weddings/[id]/events/route.ts` |
| PATCH | `/api/weddings/[id]/events` | JWT+owner | Reorder events | `app/api/weddings/[id]/events/route.ts` |
| PATCH | `/api/weddings/[id]/events/[eventId]` | JWT+owner | Update one event | `app/api/weddings/[id]/events/[eventId]/route.ts` |
| DELETE | `/api/weddings/[id]/events/[eventId]` | JWT+owner | Delete one event | `app/api/weddings/[id]/events/[eventId]/route.ts` |
| GET | `/api/weddings/[id]/guests` | JWT+owner | List guests (`.limit(2000)`) with event ids | `app/api/weddings/[id]/guests/route.ts` |
| POST | `/api/weddings/[id]/guests` | JWT+owner | Create guest (plan guest limit) | `app/api/weddings/[id]/guests/route.ts` |
| POST | `/api/weddings/[id]/guests/bulk` | JWT+owner | Bulk create ≤500 names (plan guest limit) | `app/api/weddings/[id]/guests/bulk/route.ts` |
| PATCH | `/api/weddings/[id]/guests/[guestId]` | JWT+owner | Rename guest | `app/api/weddings/[id]/guests/[guestId]/route.ts` |
| DELETE | `/api/weddings/[id]/guests/[guestId]` | JWT+owner | Delete guest | `app/api/weddings/[id]/guests/[guestId]/route.ts` |
| POST | `/api/weddings/[id]/guests/[guestId]/events` | JWT+owner | Replace the guest's event assignments | `app/api/weddings/[id]/guests/[guestId]/events/route.ts` |
| GET | `/api/weddings/[id]/photos` | JWT+owner | List photos | `app/api/weddings/[id]/photos/route.ts` |
| POST | `/api/weddings/[id]/photos` | JWT+owner | Upload photo (≤5 MB, jpeg/png/webp, magic-byte check) with per-kind plan limit | `app/api/weddings/[id]/photos/route.ts` |
| PATCH | `/api/weddings/[id]/photos` | JWT+owner | Reorder gallery photos | `app/api/weddings/[id]/photos/route.ts` |
| DELETE | `/api/weddings/[id]/photos/[photoId]` | JWT+owner | Delete photo row + R2 object | `app/api/weddings/[id]/photos/[photoId]/route.ts` |
| GET | `/api/weddings/[id]/wishes` | JWT+owner | List wishes (`.limit(1000)`) | `app/api/weddings/[id]/wishes/route.ts` |
| GET | `/api/weddings/[id]/stats` | JWT+owner | Dashboard aggregates: status counts, headcount, diets, per-event visibility | `app/api/weddings/[id]/stats/route.ts` |
| POST | `/api/orders` | JWT | Create or reuse (24 h) a pending order and return VietQR payload + bank info | `app/api/orders/route.ts` |
| GET | `/api/orders/[id]` | JWT (owner) | Order status for polling | `app/api/orders/[id]/route.ts` |
| POST | `/api/webhooks/bank` | webhook secret | Record bank transaction, match `INV-XXXXXX` in description, mark order paid, upgrade wedding plan | `app/api/webhooks/bank/route.ts` |
| GET | `/api/ops/me` | none (manual JWT read) | Returns `{ email, isAdmin }`; returns 200 with `isAdmin: true` when `ADMIN_EMAIL` is unset | `app/api/ops/me/route.ts` |
| GET | `/api/ops/stats` | admin | User/wedding/order/revenue counters | `app/api/ops/stats/route.ts` |
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
- `GET|POST /api/weddings/[id]/gifts`, `PATCH|DELETE /api/weddings/[id]/gifts/[giftId]` — called by `components/dashboard/GiftBookView.tsx` through `lib/api.ts`; no route and no `gifts` table exist, so "Sổ mừng" always fails.
- `PUT /api/guests/[guestId]/events` — called by `assignGuestEvents` in `lib/api.ts` (used for bulk event assignment in `GuestTable`); only the nested `/api/weddings/[id]/guests/[guestId]/events` exists.
- `POST /api/ops/users/[id]/merge` — called by `mergeOpsUser` in `lib/ops-api.ts`; no route exists, so the merge dialog falls back to the localStorage mock.

## Not present (checked, absent)
`/api/admin/*` routes and any `SESSION_SECRET` usage: not in the repository at git `868ac95`.
