# Database schema

Source of truth is `supabase/*.sql` as committed at git `868ac95`. Nothing here was executed by the agent.

## Migration files (run by hand in Supabase SQL Editor)

Owner confirmation (2026-11-14): **all migration files in this repository have been applied** to the live project. Status is recorded as APPLIED on that statement only; no migration was executed by the agent.

| File | What it changes | Applied? |
|---|---|---|
| `supabase/migration_v2.sql` | Drops and recreates `wishes` + `guests`; creates `users`, `weddings`, `guests`, `wishes`, `photos`; adds `responded_at` trigger `guests_set_responded_at`; enables RLS and revokes all from `anon`/`authenticated` | APPLIED (owner) |
| `supabase/migration_v3.sql` | Creates `events` and `guest_events`; enables RLS + revokes | APPLIED (owner) |
| `supabase/migration_v4.sql` | Adds `guests.plus_ones` (0–10) and `guests.diet` ('meat'/'veg'); widens `photos.kind` check to `banner, couple, gallery, og, gift` | APPLIED (owner) |
| `supabase/migration_v5.sql` | Adds `users.theme` ('light'/'dark', default 'light') | APPLIED (owner) |
| `supabase/migration_v10_ops.sql` | Adds `weddings.suspended`; creates `audit_logs`; RLS + revoke | APPLIED (owner) |
| `supabase/migration_v11_guest_preferences.sql` | Adds `guests.song_request` (≤200 chars) and `guests.ride_needed` (bool) | **NOT APPLIED — pending owner** |
| `supabase/migration_v12_gifts.sql` | Creates `gifts` (Sổ mừng), index, RLS + revoke | **NOT APPLIED — pending owner** |
| `supabase/migration_v13_album_kind.sql` | Recreates `photos_kind_check` to include `album` | **NOT APPLIED — pending owner** |

The repository contains no v6–v9 files; the owner states the files present are the complete set that was run. Because v10 is applied, `weddings.suspended` exists — the `content.suspended` fallback in `lib/server/weddings.ts` stays as harmless defensive code.

Migrations v11–v13 were written by the agent and have **not** been executed. Until the owner runs them: song/ride preferences fall back to being dropped, `/api/weddings/[id]/gifts` fails because the table is missing, and album uploads are rejected by the DB check constraint. The code already handles the missing guest columns; the gifts/album paths will start working as soon as the SQL runs.


## Tables

### `users`
`id text PK` (Auth0 `sub`), `email text`, `created_at timestamptz default now()`, `theme text default 'light' check (theme in ('light','dark'))` (v5). No RLS policies; backend only.

### `weddings`
`id uuid PK`, `owner_id text → users(id) on delete cascade`, `slug text unique check '^[a-z0-9-]{3,40}$'`, `template_id text default 'basic-1'`, `plan text default 'free' check (free|pro|vip)`, `content jsonb default '{}'`, `created_at`, `updated_at`, `suspended boolean default false` (v10). Index `weddings_owner_idx (owner_id)`.
Note: `suspended` is also mirrored inside `content.suspended` by the suspend route and by `lib/ops-api.ts` fallbacks — two sources of truth.

### `guests`
`id uuid PK`, `wedding_id uuid → weddings on delete cascade`, `name text check 1..100`, `slug text unique default 12 hex chars check '^[a-f0-9]{12}$'`, `status text default 'pending' check (pending|accepted|declined)`, `responded_at timestamptz`, `created_at`, `plus_ones int default 0 check 0..10` (v4), `diet text check (meat|veg)` (v4), `song_request text check ≤200` (v11, pending), `ride_needed boolean default false` (v11, pending). Index `guests_wedding_idx (wedding_id)`.
Trigger `guests_set_responded_at` sets `responded_at = now()` when `status` changes from/to `pending` (v2).

### `wishes`
`id uuid PK`, `wedding_id → weddings cascade`, `guest_id uuid → guests on delete set null`, `name 1..100`, `message 1..500`, `created_at`. Index `wishes_wedding_idx (wedding_id, created_at desc)`.

### `photos`
`id uuid PK`, `wedding_id → weddings cascade`, `kind text check (banner|couple|gallery|og|gift)` after v4 and `+album` after v13, `storage_key text unique`, `position int default 0`, `created_at`. Index `photos_wedding_idx (wedding_id, kind, position)`.
`MEDIA_KEY_RE` in `lib/server/storage.ts` accepts the same six kind segments; album files are served by `/media/...` like the others.

### `gifts` (v12, pending)
`id uuid PK`, `wedding_id → weddings cascade`, `guest_id → guests on delete set null`, `giver_name 1..100`, `amount_vnd bigint 0..1e9`, `method text check (cash|bank|other)`, `note ≤300`, `thanked_at timestamptz`, `created_at`. Index `gifts_wedding_idx (wedding_id, created_at desc)`. RLS + revoke. API gates the whole feature on `plan` being pro/vip.

### `events`
`id uuid PK`, `wedding_id → weddings cascade`, `title 1..120`, `starts_at timestamptz`, `lunar_date ≤60`, `venue_name 1..120`, `venue_address ≤300`, `map_embed_url ≤2000`, `map_directions_url ≤2000`, `position int default 0`, `created_at`. Index `events_wedding_idx (wedding_id, position)`.

### `guest_events`
`guest_id uuid → guests cascade`, `event_id uuid → events cascade`, `primary key (guest_id, event_id)`.
Visibility rule implemented in `lib/server/weddings.ts`: a guest with no rows sees **all** events; a guest with ≥1 row sees only the assigned ones.

### `audit_logs` (v10)
`id uuid PK`, `admin_email text`, `action text`, `target_type text`, `target_id text`, `reason text check length ≥ 5`, `created_at`. Index `audit_logs_created_idx (created_at desc)`. Writes are best-effort: `recordAuditLog()` swallows insert errors.

## Tables used by code but absent from every committed migration
The owner confirmed that every committed migration was applied, and none of them creates these three tables. Their live existence therefore still needs confirmation — they may have been created manually in the dashboard.

- `orders` — read/written by `app/api/orders/*`, `app/api/webhooks/bank`, `app/api/ops/orders/*`. Columns inferred from code: `id`, `code`, `user_id`, `wedding_id`, `plan`, `amount_vnd`, `status`, `created_at`, `paid_at`. Schema, constraints and indexes: **UNVERIFIED**.
- `bank_transactions` — written by the webhook and read by ops. Columns inferred: `id`, `ref`, `amount_vnd`, `description`, `received_at`, `matched_order_id`. Schema: **UNVERIFIED**.
- `gifts` — required by `GiftBookView` / `lib/api.ts`, no route and no table anywhere in the repo. **UNVERIFIED / likely missing entirely.**

## RLS and access model
RLS is enabled on every table and `revoke all ... from anon, authenticated` is applied (v2, v3, v10). The backend bypasses RLS by using `SUPABASE_SECRET_KEY` through `db()` in `lib/server/supabase.ts`. There are no policies, so a leaked publishable key cannot read data. `authClient()` (publishable key) is defined but never called.
