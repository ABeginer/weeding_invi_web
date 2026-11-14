# Open items

## Handoff
- Last task (2026-11-14): full read-only review of the repository at git `868ac95`. No source file was modified. `npx tsc --noEmit` and `npm run lint` both pass clean, so the problems below are logical/behavioural, not type or lint errors.
- In progress: nothing.
- Next step: the owner picks a fix batch. Suggested order — (1) the 8 blockers in "Known bugs", (2) data-loss and plan-bypass items, (3) repo hygiene (committed build output, missing migrations, stale docs).
- Files that will be touched first when fixing: `components/dashboard/GiftBookView.tsx` + a new `app/api/weddings/[id]/gifts/route.ts`, `app/api/weddings/[id]/photos/route.ts` (+ album migration), `lib/api.ts`, `components/dashboard/PhotosManager.tsx`, `components/dashboard/GuestTable.tsx`, `lib/ops-api.ts`, `lib/server/public-wedding.ts`.

## Known bugs (verified at git `868ac95`)
1. **Gift book has no backend** — `GiftBookView` calls `/api/weddings/{id}/gifts`; no route, no `gifts` table. Pro/VIP users see a load error; every add/edit/delete fails.
2. **Album uploads cannot succeed** — API `VALID_KINDS` omits `album`, the DB check constraint omits it, and `MEDIA_KEY_RE` rejects an `album` path segment; the dashboard still offers the upload. `PLAN_LIMITS` and the pricing table sell 30/300 album photos.
3. **Bulk event assignment always fails** — `assignGuestEvents` calls the non-existent `PUT /api/guests/{id}/events`.
4. **Replacing a hero/portrait photo deletes the old one first** — `PhotosManager` deletes then uploads, so a failed upload leaves the slot empty.
5. **Ops console shows fabricated data** — `fetchOrMock` silently falls back to a localStorage mock on any failed request; `/api/ops/me` returns `isAdmin: true` when `ADMIN_EMAIL` is unset; a `?mock_non_admin=1` debug switch remains in the code. "Suspend wedding" and "confirm order" report success while only mutating the mock.
6. **`suspended` is never enforced on public pages** — ops can suspend a wedding but `/w`, `/m` and `/api/public/wedding/*` keep serving it (no public query selects the flag).
7. **Turnstile can permanently block RSVP/wishes** — a failed script load is cached forever, the widget silently renders nothing, and the server rejects every submit for a missing token.
8. **`/m/[slug]` throws away its server-rendered data** — `InvitePageClient` starts in a full-page loading skeleton and shows "Không thể tải thiệp mời" if the follow-up `/api/invite/[slug]` call fails.
9. **Public RSVP bypasses the guest limit** — inserting a guest by `weddingSlug` in `/api/rsvp` does not check `plan.guests` (only the dashboard routes do), so a free wedding can receive unlimited guests.
10. **`songRequest` / `rideNeeded` are collected and dropped** — sent by both RSVP components, never read by the server, no columns exist, and the dashboard "Bài hát yêu cầu" panel is therefore always empty.
11. **`map_embed_url` is wiped on every event edit** — `EventsManager` sends `mapEmbedUrl: null` unconditionally.
12. **Pricing copy contradicts the code** — "3 mẫu" free vs 23 selectable free templates; "mẫu độc quyền" VIP while `vip-1` is a placeholder; "Tải nhạc MP3 lên" has no field, UI or route; storage retention (30 days / 1 year / forever) has no implementation; "no logo" for paid plans has no variant; gift QR is sold as "Sắp có" but is fully shipped.
13. **No rate limiting on any public endpoint** (`/api/rsvp`, `/api/wishes`, `/api/invite/[slug]`, `/api/weddings/check-slug`); Turnstile is the only gate.
14. **Ops lists load every row then paginate in memory**, and `.limit(2000)` on guests exceeds the Supabase PostgREST default cap of 1,000 rows — data is silently truncated.
15. **`/w/[slug]` has no `robots: noindex`** (only `robots.txt` disallows it).
16. **Docs are stale** — `HANDOFF.md` describes `/admin/*`, a mock `lib/api.ts` and a `WishForm.tsx` that no longer exist; `DESIGN_PLAN.md` describes the old layout; `TODO.md` names Cormorant Garamond as the display font (the code uses Lora); `README.md` is a UTF-16 one-liner.
17. **Repository hygiene** — `git ls-files` = 2,778 files, of which 2,342 are committed `.open-next/` build output (~53 MB) plus 10 `.wrangler/` and 40 `scratch/` files; `.gitignore` does not exclude them.
18. **No test entry point** — `tests/*.test.ts` use `node:test`, but `package.json` has no `test` script, no runner/loader is installed, and there is no CI directory.

## Owner-blocked questions
1. Which of the five committed migrations have actually been applied, and what do the missing v6–v9 do? (Status is `UNKNOWN` everywhere in this skill.)
2. Do `orders`, `bank_transactions` and `gifts` exist in the live project? Their schemas are `UNVERIFIED`; only columns inferable from code are recorded.
3. Confirm the sellable feature set so `config/pricing.ts` can be rewritten to match reality (templates per tier, music upload, retention, logo, gift QR).
4. Which email address(es) belong in `ADMIN_EMAIL` for production ops access?
5. Should the 30-day free retention be implemented (cron + cleanup) or removed from the pricing copy?
6. Where is the Google Apps Script that sends the bank webhook? It is not in this repository (`UNVERIFIED`); it determines whether the webhook contract can be changed safely.

## Deliberately not stored here
- Secret values, tokens, bank account numbers, real personal emails, and `.env*` contents.
- Debugging chatter or one-off shell output.
- Facts that a single file read answers — a pointer to the file is recorded instead.
