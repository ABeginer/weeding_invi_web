# Database schema

Source of truth is `supabase/*.sql` as committed at git `868ac95`. Nothing here was executed by the agent.

## Migration files (run by hand in Supabase SQL Editor)

| File | What it changes | Applied? |
|---|---|---|
| `supabase/migration_v2.sql` | Drops and recreates `wishes` + `guests`; creates `users`, `weddings`, `guests`, `wishes`, `photos`; adds `responded_at` trigger `guests_set_responded_at`; enables RLS and revokes all from `anon`/`authenticated` | UNKNOWN |
| `supabase/migration_v3.sql` | Creates `events` and `guest_events`; enables RLS + revokes | UNKNOWN |
| `supabase/migration_v4.sql` | Adds `guests.plus_ones` (0–10) and `guests.diet` ('meat'/'veg'); widens `photos.kind` check to `banner, couple, gallery, og, gift` | UNKNOWN |
| `supabase/migration_v5.sql` | Adds `users.theme` ('light'/'dark', default 'light') | UNKNOWN |
| `supabase/migration_v10_ops.sql` | Adds `weddings.suspended`; creates `audit_logs`; RLS + revoke | UNKNOWN |

Missing from the repository: **v6, v7, v8, v9**. They may exist only in the live project — status and content UNVERIFIED. Do not assume the live schema matches the five files above.

## Tables

### `users`
`id text PK` (Auth0 `sub`), `email text`, `created_at timestamptz default now()`, `theme text default 'light' check (theme in ('light','dark'))` (v5). No RLS policies; backend only.

### `weddings`
`id uuid PK`, `owner_id text → users(id) on delete cascade`, `slug text unique check '^[a-z0-9-]{3,40}$'`, `template_id text default 'basic-1'`, `plan text default 'free' check (free|pro|vip)`, `content jsonb default '{}'`, `created_at`, `updated_at`, `suspended boolean default false` (v10). Index `weddings_owner_idx (owner_id)`.
Note: `suspended` is also mirrored inside `content.suspended` by the suspend route and by `lib/ops-api.ts` fallbacks — two sources of truth.

### `guests`
`id uuid PK`, `wedding_id uuid → weddings on delete cascade`, `name text check 1..100`, `slug text unique default 12 hex chars check '^[a-f0-9]{12}$'`, `status text default 'pending' check (pending|accepted|declined)`, `responded_at timestamptz`, `created_at`, `plus_ones int default 0 check 0..10` (v4), `diet text check (meat|veg)` (v4). Index `guests_wedding_idx (wedding_id)`.
Trigger `guests_set_responded_at` sets `responded_at = now()` when `status` changes from/to `pending` (v2).
No `song_request` or `ride_needed` column exists, although the RSVP UI and `lib/types.ts` carry those fields.

### `wishes`
`id uuid PK`, `wedding_id → weddings cascade`, `guest_id uuid → guests on delete set null`, `name 1..100`, `message 1..500`, `created_at`. Index `wishes_wedding_idx (wedding_id, created_at desc)`.

### `photos`
`id uuid PK`, `wedding_id → weddings cascade`, `kind text check (banner|couple|gallery|og|gift)` after v4, `storage_key text unique`, `position int default 0`, `created_at`. Index `photos_wedding_idx (wedding_id, kind, position)`.
`album` is not an allowed kind in the committed check constraint, and `MEDIA_KEY_RE` in `lib/server/storage.ts` does not accept an `album` segment.

### `events`
`id uuid PK`, `wedding_id → weddings cascade`, `title 1..120`, `starts_at timestamptz`, `lunar_date ≤60`, `venue_name 1..120`, `venue_address ≤300`, `map_embed_url ≤2000`, `map_directions_url ≤2000`, `position int default 0`, `created_at`. Index `events_wedding_idx (wedding_id, position)`.

### `guest_events`
`guest_id uuid → guests cascade`, `event_id uuid → events cascade`, `primary key (guest_id, event_id)`.
Visibility rule implemented in `lib/server/weddings.ts`: a guest with no rows sees **all** events; a guest with ≥1 row sees only the assigned ones.

### `audit_logs` (v10)
`id uuid PK`, `admin_email text`, `action text`, `target_type text`, `target_id text`, `reason text check length ≥ 5`, `created_at`. Index `audit_logs_created_idx (created_at desc)`. Writes are best-effort: `recordAuditLog()` swallows insert errors.

## Tables used by code but absent from every committed migration
- `orders` — read/written by `app/api/orders/*`, `app/api/webhooks/bank`, `app/api/ops/orders/*`. Columns inferred from code: `id`, `code`, `user_id`, `wedding_id`, `plan`, `amount_vnd`, `status`, `created_at`, `paid_at`. Schema, constraints and indexes: **UNVERIFIED**.
- `bank_transactions` — written by the webhook and read by ops. Columns inferred: `id`, `ref`, `amount_vnd`, `description`, `received_at`, `matched_order_id`. Schema: **UNVERIFIED**.
- `gifts` — required by `GiftBookView` / `lib/api.ts`, no route and no table anywhere in the repo. **UNVERIFIED / likely missing entirely.**

## RLS and access model
RLS is enabled on every table and `revoke all ... from anon, authenticated` is applied (v2, v3, v10). The backend bypasses RLS by using `SUPABASE_SECRET_KEY` through `db()` in `lib/server/supabase.ts`. There are no policies, so a leaked publishable key cannot read data. `authClient()` (publishable key) is defined but never called.
