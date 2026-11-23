---
name: inviwedd-project-map
description: "Use at the start of any task on the Inviwedd wedding invitation project and after any major change to it"
version: 1.1.9
metadata:
  hermes:
    tags: [project, architecture, memory]
---

# Inviwedd project map

## When to Use
Load this skill at the start of every task in this repository, and again after any major change (see Update protocol).
> ⚠️ **LƯU Ý:** File [AGENT.md](../../../AGENT.md) ở thư mục gốc là bản đồ kiến trúc cập nhật thời gian thực mới nhất cho toàn bộ AI Agent. BẮT BUỘC đọc và cập nhật `AGENT.md` sau mỗi thay đổi file/route/schema quan trọng.

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
- `card_exp.md` (repo root) — bài học làm template (bug đã gặp + cách tránh); **đọc trước khi tạo mẫu mới**.

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
2026-11-18 · **Lời chúc: 1 người = 1 lời** (unique `author_key`, migration **v18 chưa chạy**), **duyệt lời chúc** (`approved`, duyệt tay/tự động + popup cảnh báo), **dải lời chúc chạy ngang seamless** trong block lời chúc (áp dụng mọi mẫu) · **Template `do-ruou-vang` "Đỏ Rượu Vang"** (nền #390202, sao ✦ nhấp nháy, hoa hồng góc bìa, viền kép vàng, **đếm ngược** giờ cưới, album coverflow có chấm, tone `ruby`) · **Template `long-phung` "Long Phụng Đỏ"** (rồng/phượng line-art vàng tách từ asset khách, bìa tách rèm + parallax + bụi vàng, ruột nền đỏ trầm, album lưới editorial, tone `velvet`) · **Template capabilities** (`config/template-sections.ts`: dashboard chỉ hiện phần template thật có; kéo thả thứ tự bằng Pointer Events nên chạy cả mobile; key chuẩn `family/calendar/map/dresscode/album/albumQr/gift/rsvp/music`; `map` = "Sự kiện và chỉ đường"; `hostFirst`, `couplePhotos` khai báo theo template; `albumQr` chỉ hiện từ gói Pro vì `getTemplateSections` nhận cả `plan`) · **Free link 30 lượt mở** (`track_guest_view_open`, nhắc + nút Pro dưới thanh search; migration v17 **chưa chạy**) · **`do-truyen-thong` "Đỏ - Truyền thống"** (custom code: bìa hai cánh + tiếng ting, hero vòm, sự kiện, lịch trình từ `data.timeline`, coverflow album, RSVP khoá món, QR album Pro-gated) · **Motion v14** (`m` + `LazyMotion domAnimation` qua `components/theme/MotionProvider.tsx`) · **VietQR tự sinh = Pro/VIP** · Guest table: bulk delete + bảng gọn một màn hình · Designer versioning (Đào Phấn v10), migrations v11–v16 applied. Verified 2026-11-18: typecheck, lint 0 errors, test 74/74, build 46/46, ảnh chụp thật 390/1280px cho `do-truyen-thong`. Missing: real Auth0 CTA test, P0 payment/CSP/backup checks, per-template music, export layers, new fonts, pass 768px, xác nhận nhánh Pro của VietQR và view-limit sau khi chạy migration.
