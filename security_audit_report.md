# Security Audit Report — Inviwedd Platform
**Date:** November 19, 2026  
**Target:** Inviwedd Web Application (`Next.js 16` + `Cloudflare Workers / OpenNext` + `Supabase` + `Auth0`)  
**Scope:** Full-stack read-only security audit covering 10 core security domains.  
**Auditor:** Automated AppSec Security Engine (Antigravity)

---

## Executive Summary & Security Posture

The Inviwedd platform demonstrates strong baseline architectural hygiene in several key areas:
- **Authentication & Authorization:** All primary wedding management APIs enforce ownership checks (`getOwnedWedding(id, user.id)`) and tenant isolation (`wedding_id = wedding.id`).
- **Input Validation & Mass Assignment:** Mutations strictly employ Zod validation schemas or explicit object key whitelisting, preventing unauthorized column overwrites (`plan`, `owner_id`).
- **Public Anti-Abuse:** RSVP and guest wish endpoints are heavily guarded with IP rate limits, honeypot traps, timestamp velocity checks, and Cloudflare Turnstile captchas.
- **File Uploads & Storage:** Media uploads enforce server-side magic byte inspection (JPEG, PNG, WebP, MP3), strict byte size caps, UUID-based storage keys, and regex-validated path traversal prevention.
- **HTTP Security Headers:** Comprehensive Content Security Policy (CSP), HSTS, `X-Content-Type-Options`, and `X-Frame-Options` are configured in `next.config.ts`.

However, the audit identified **1 CRITICAL**, **5 HIGH**, and **3 MEDIUM** severity vulnerabilities that require remediation prior to production commercialization. The most severe flaw is a **plaintext leak of the 4-digit Assistant PIN** in the public wedding API, combined with a **hardcoded fallback HMAC secret** and **zero rate limiting on PIN verification**, which allows full unauthorized access to private guest lists and wedding check-in controls.

### Findings Breakdown
| Severity | Count | Summary |
| :--- | :---: | :--- |
| **CRITICAL** | 1 | Plaintext 4-Digit Assistant PIN Leaked in Public Wedding API |
| **HIGH** | 5 | Hardcoded HMAC Secrets, PIN Brute-Force, Plan Gating Bypass, Missing Table Migrations |
| **MEDIUM** | 3 | Cross-Tenant Photo Moderation, Permissions-Policy Camera Conflict, Unsanitized JSON-LD |
| **LOW / INFO** | 3 | Timing-safe string comparisons, JWT revocation lifetime, Dev env file parser |
| **PASSED** | 8 | IDOR, Mass Assignment, Plan Gating, Anti-Spam, Storage Traversal, XSS, Redirects |

---

## Findings by Severity

```
CRITICAL
└── SEC-01: Plaintext 4-Digit Assistant PIN Leaked in Public Wedding API

HIGH
├── SEC-02: Hardcoded Fallback Secret & Missing Env Var for Share Cookie HMAC
├── SEC-03: Hardcoded Fallback Secret & Missing Env Var for LED Display Token
├── SEC-04: Zero Rate Limiting & Lockout on 4-Digit PIN Verification Endpoint
├── SEC-05: Server-Side Plan Gating Bypass on Share & Check-in APIs
└── SEC-06: Missing Version-Controlled Database Migrations for Financial Tables

MEDIUM
├── SEC-07: Photo ID Ownership Verification Missing in Photo Moderation API
├── SEC-08: Permissions-Policy Camera Restriction Breaks QR Check-in Scanner
└── SEC-09: Direct JSON.stringify in Inline JSON-LD Scripts on Homepage

LOW / INFO
├── SEC-10: Non-Constant Time Equality Checks on Cryptographic Tokens
├── SEC-11: Stateless Bearer JWT Lifetimes Lack Immediate Server Revocation
└── SEC-12: Custom Synchronous .env.local Disk Parser in Server Runtime
```

---

### [CRITICAL] SEC-01: Plaintext 4-Digit Assistant PIN Leaked in Public Wedding API

- **Location:**  
  `app/api/public/wedding/[slug]/route.ts:13`  
  `lib/server/public-wedding.ts:198`
- **Vulnerable Code Pattern:**
  ```typescript
  // lib/server/public-wedding.ts:194-202
  return {
    slug: row.slug,
    templateId: row.template_id,
    plan: (row.plan as WeddingPlan) ?? "free",
    content: normalizeWeddingContent(row.content), // ⚠️ Exposes raw content directly
    events,
    photos,
    designerTemplate,
  };

  // app/api/public/wedding/[slug]/route.ts:8-15
  const wedding = await getPublicWeddingBySlug(slug);
  return json(wedding, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
  ```
- **Risk Summary:**  
  `normalizeWeddingContent(row.content)` extracts and returns `content.sharePin` (e.g. `"1234"`) and `content.sharePinEnabled`. Because `GET /api/public/wedding/[slug]` is completely public and edge-cached by Cloudflare, any anonymous visitor, web crawler, or external observer inspecting the JSON response can view the wedding's private 4-digit Assistant PIN. With this PIN, an attacker can authenticate to `/share/[slug]` and `/api/share/guests`, exposing the full private guest list, guest phone numbers, table assignments, and check-in statuses.
- **Suggested Fix:**  
  Sanitize the public wedding data payload before returning it to anonymous clients. Specifically strip `sharePin`, `sharePinEnabled`, and internal `photoModeration` mappings:
  ```typescript
  // In lib/server/public-wedding.ts or a dedicated sanitizer:
  const publicContent = { ...normalizeWeddingContent(row.content) };
  delete (publicContent as Record<string, unknown>).sharePin;
  delete (publicContent as Record<string, unknown>).sharePinEnabled;
  ```

---

### [HIGH] SEC-02: Hardcoded Fallback Secret & Missing Env Var for Share Cookie HMAC

- **Location:**  
  `lib/share-pin.ts:5-6`
- **Vulnerable Code Pattern:**
  ```typescript
  // lib/share-pin.ts:5-6
  const SHARE_SECRET =
    process.env.SHARE_TOKEN_SECRET || "inviwedd-family-share-secret-2026";
  ```
- **Risk Summary:**  
  The environment variable `SHARE_TOKEN_SECRET` is not documented or present in `.env.example`. In any deployment where this secret is not explicitly configured, the application falls back to a static, publicly known string. An attacker who knows this default secret can compute valid HMAC-SHA256 signatures offline and forge the `inviwedd_share_${slug}` cookie for any wedding without ever needing the PIN.
- **Suggested Fix:**  
  1. Add `SHARE_TOKEN_SECRET` to `.env.example`.  
  2. In `lib/share-pin.ts`, remove the hardcoded fallback and enforce a mandatory environment variable check that fails closed:
  ```typescript
  const secret = process.env.SHARE_TOKEN_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SHARE_TOKEN_SECRET must be configured in production.");
  }
  const SHARE_SECRET = secret || "dev-only-share-secret";
  ```

---

### [HIGH] SEC-03: Hardcoded Fallback Secret & Missing Env Var for LED Display Token

- **Location:**  
  `lib/led-token.ts:5-6`
- **Vulnerable Code Pattern:**
  ```typescript
  // lib/led-token.ts:5-6
  const LED_SECRET =
    process.env.LED_TOKEN_SECRET || "inviwedd-led-secret-token-key-2026";
  ```
- **Risk Summary:**  
  Similar to SEC-02, `LED_TOKEN_SECRET` is omitted from `.env.example` and defaults to a hardcoded string. If omitted in production, anyone can generate valid 12-character hexadecimal LED authorization tokens (`generateLedToken(slug)`) for any wedding, bypassing the VIP authorization requirement for `/led/[slug]?token=...`.
- **Suggested Fix:**  
  Add `LED_TOKEN_SECRET` to `.env.example` and remove the static fallback in production environments, requiring a cryptographically secure random secret.

---

### [HIGH] SEC-04: Zero Rate Limiting & Lockout on 4-Digit PIN Verification Endpoint

- **Location:**  
  `app/api/share/verify-pin/route.ts:8-45`
- **Vulnerable Code Pattern:**
  ```typescript
  // app/api/share/verify-pin/route.ts:42-44
  if (content.sharePin !== pin) {
    return fail("Mã PIN không chính xác. Vui lòng thử lại.", 401);
  }
  ```
- **Risk Summary:**  
  A 4-digit numeric PIN has only 10,000 possible permutations (`0000`–`9999`). The `POST /api/share/verify-pin` endpoint has no IP rate limiting, no wedding-slug rate limiting, and no failed-attempt counter or exponential backoff. An attacker can write a basic script to iterate through all 10,000 combinations in under 30 seconds and obtain a valid 7-day session cookie.
- **Suggested Fix:**  
  1. Apply an aggressive rate limit (e.g. `rateLimit(req, `verify-pin:${slug}`, 5, 900_000)` — max 5 attempts per 15 minutes).  
  2. Lock out further verification attempts after 5 consecutive failures.  
  3. Use constant-time comparison (`safeEqual(content.sharePin, pin)`).

---

### [HIGH] SEC-05: Server-Side Plan Gating Bypass on Share & Check-in APIs

- **Location:**  
  `app/api/share/verify-pin/route.ts:25-45`  
  `app/api/share/guests/route.ts:25-40`  
  `app/api/share/check-in/route.ts:25-45`  
  `app/api/share/moderate-photo/route.ts:25-45`
- **Vulnerable Code Pattern:**
  ```typescript
  // app/api/share/verify-pin/route.ts:25-39
  const { data: wedding, error } = await client
    .from("weddings")
    .select("id, slug, content") // ⚠️ Does not select or check wedding.plan!
    .eq("slug", slug)
    .maybeSingle();

  const content = normalizeWeddingContent(wedding.content);
  if (!content.sharePinEnabled || !content.sharePin) { ... }
  ```
- **Risk Summary:**  
  The Family Share Portal (`/share/[slug]`) and guest check-in features are intended exclusively for **VIP** tier subscribers. While frontend UI pages (`app/share/[slug]/page.tsx:32`) check `if (wedding.plan !== "vip")`, the underlying API routes only verify the PIN or cookie and completely ignore `wedding.plan`. A Free or Pro user who manually enables `sharePinEnabled: true` in their wedding content can utilize the entire VIP assistant and check-in API suite without upgrading.
- **Suggested Fix:**  
  In `app/api/share/verify-pin/route.ts` and all `/api/share/*` handlers, select `plan` and enforce:
  ```typescript
  if (wedding.plan !== "vip") {
    return fail("Tính năng chỉ dành cho gói VIP.", 403);
  }
  ```

---

### [HIGH] SEC-06: Missing Version-Controlled Database Migrations for Financial Tables

- **Location:**  
  `supabase/migrations/`  
  `staging_init.sql`
- **Vulnerable Code Pattern:**  
  The tables `orders` and `bank_transactions` are queried by `app/api/webhooks/bank/route.ts`, `app/api/ops/bank-transactions/`, and `lib/server/payments.ts`, but neither table is declared in any migration file in `supabase/` or `staging_init.sql`.
- **Risk Summary:**  
  Because these tables exist only as uncommitted manual schema in production, any fresh deployment, staging environment, or disaster recovery rollout will result in runtime errors. Furthermore, there is no guarantee that Row Level Security (RLS) is enabled or that permissions are revoked from `anon` and `authenticated` roles, risking unauthorized direct PostgREST table access.
- **Suggested Fix:**  
  Create a migration (e.g., `supabase/migrations/20261119_orders_and_banking.sql`) creating both tables with proper types, indexes, and explicit RLS:
  ```sql
  create table public.orders ( ... );
  alter table public.orders enable row level security;
  revoke all on public.orders from anon, authenticated;

  create table public.bank_transactions ( ... );
  alter table public.bank_transactions enable row level security;
  revoke all on public.bank_transactions from anon, authenticated;
  ```

---

### [MEDIUM] SEC-07: Photo ID Ownership Verification Missing in Photo Moderation API

- **Location:**  
  `app/api/share/moderate-photo/route.ts:58-61`
- **Vulnerable Code Pattern:**
  ```typescript
  // app/api/share/moderate-photo/route.ts:58-61
  const nextModeration = {
    ...(content.photoModeration || {}),
    [photoId]: action === "approve" ? "approved" : "rejected",
  };
  ```
- **Risk Summary:**  
  When an assistant marks a photo as approved or rejected, the endpoint updates `wedding.content.photoModeration[photoId]` directly without verifying that `photoId` exists in the database and belongs to `wedding.id`. While this does not leak data across tenants, it allows polluting the wedding's JSON content with arbitrary keys or unverified photo IDs.
- **Suggested Fix:**  
  Verify photo ownership before modifying the moderation dictionary:
  ```typescript
  const { data: photo } = await client
    .from("photos")
    .select("id")
    .eq("id", photoId)
    .eq("wedding_id", wedding.id)
    .maybeSingle();
  if (!photo) return fail("Không tìm thấy ảnh.", 404);
  ```

---

### [MEDIUM] SEC-08: Permissions-Policy Camera Restriction Breaks QR Check-in Scanner

- **Location:**  
  `next.config.ts:112`  
  `components/share/QrCheckInScanner.tsx:114`
- **Vulnerable Code Pattern:**
  ```typescript
  // next.config.ts:112
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()", // ⚠️ Camera is disabled globally!
  }

  // components/share/QrCheckInScanner.tsx:114
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
  });
  ```
- **Risk Summary:**  
  The HTTP security header `Permissions-Policy` explicitly sets `camera=()`, disabling browser camera access across all origins. When an assistant opens the QR check-in camera scanner at `/share/[slug]`, modern browsers will reject `getUserMedia` with a `NotAllowedError` or security restriction, completely breaking QR code check-in functionality.
- **Suggested Fix:**  
  Permit first-party origin camera access in `next.config.ts`:
  ```typescript
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  }
  ```

---

### [MEDIUM] SEC-09: Direct JSON.stringify in Inline JSON-LD Scripts on Homepage

- **Location:**  
  `app/page.tsx:75, 81`
- **Vulnerable Code Pattern:**
  ```typescript
  // app/page.tsx:72-83
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(webApplicationSchema),
    }}
  />
  ```
- **Risk Summary:**  
  Unlike `components/tools/JsonLd.tsx` which safely replaces `/</g` with `\\u003c`, `app/page.tsx` directly injects `JSON.stringify(...)` into an inline `<script>`. While the schemas currently contain static data, unescaped `</script>` tags in JSON-LD payloads can cause script breakout and XSS vulnerabilities if dynamic or user-influenced content is introduced.
- **Suggested Fix:**  
  Refactor `app/page.tsx` to use the standardized `<JsonLd data={webApplicationSchema} />` component.

---

### [LOW / INFO] SEC-10: Non-Constant Time Equality Checks on Cryptographic Tokens

- **Location:**  
  `lib/led-token.ts:29`  
  `lib/share-pin.ts:54`
- **Vulnerable Code Pattern:**
  ```typescript
  // lib/led-token.ts:29
  return candidateToken.trim().toLowerCase() === expected.toLowerCase();

  // lib/share-pin.ts:54
  return expectedHex === providedHex;
  ```
- **Risk Summary:**  
  Standard JavaScript `===` string equality comparison terminates on the first mismatched byte, creating micro-timing discrepancies that theoretically allow timing attacks to reconstruct token characters.
- **Suggested Fix:**  
  Use the existing constant-time equality utility `safeEqual(expectedHex, providedHex)` from `lib/server/payments.ts`.

---

### [LOW / INFO] SEC-11: Stateless Bearer JWT Lifetimes Lack Immediate Server Revocation

- **Location:**  
  `lib/server/auth.ts:25-78`
- **Risk Summary:**  
  The owner authentication system validates Auth0 Bearer access tokens cryptographically using `jose.jwtVerify` (RS256 with JWKS). While this is modern and scalable, stateless JWTs cannot be revoked immediately upon user password reset or account suspension without an active blocklist or checking the Auth0 Management API.
- **Suggested Fix:**  
  Ensure Auth0 access token lifetimes are kept short (5 to 15 minutes) and verify whether critical operations require an active user status check against Supabase `users.suspended`.

---

### [LOW / INFO] SEC-12: Custom Synchronous .env.local Disk Parser in Server Runtime

- **Location:**  
  `lib/server/supabase.ts:14-38`  
  `next.config.ts:8-27`
- **Risk Summary:**  
  Both files include custom filesystem read logic to manually parse `.env.local`. In production on Cloudflare Workers, `fs` is stubbed or unavailable. While conditional guards (`process.env.NODE_ENV !== "production"`) prevent execution in production, non-standard env loaders can mask configuration bugs.
- **Suggested Fix:**  
  Rely on Next.js standard environment loading mechanisms and Cloudflare Wrangler bindings.

---

## Detailed Audit Checklist & Verification Matrix

### 1. IDOR & Ownership Checks (`app/api/**`)
- **Status: PASSED**
- **Verification:**
  - Every authenticated route under `app/api/weddings/[id]/*` executes `getOwnedWedding(id, user.id)`.
  - Child entities (`events`, `guests`, `photos`, `gifts`, `wishes`) verify `.eq("wedding_id", wedding.id)` before updates or deletions.
  - Ops routes enforce `opsRoute` and `opsDesignerRoute` with admin email and role checks against `ops_members`.

### 2. Mass Assignment & Input Validation
- **Status: PASSED**
- **Verification:**
  - Direct `req.json()` payloads are never passed straight to Supabase `.insert()` or `.update()`.
  - Strict Zod schemas (`weddingContentInputSchema`, `weddingContentPatchSchema`, `weddingEventInputSchema`) parse incoming data.
  - Handlers construct clean dictionaries (`const patch: Record<string, unknown> = {}`), explicitly blocking tampering with `plan`, `owner_id`, or timestamps.

### 3. Server-Side Plan Gating
- **Status: PARTIALLY PASSED (See SEC-05)**
- **Verification:**
  - Guest count limit (20 guests for Free) is strictly enforced in `guests/route.ts:114` and `guests/bulk/route.ts:63`.
  - Custom MP3 upload is blocked for Free users in `music/route.ts:25`.
  - Photo limits are verified against `getPlanLimits(wedding.plan)` in `photos/route.ts:119`.
  - Public album uploads require Pro+ in `public/wedding/[slug]/photos/route.ts:42`.
  - *Exception:* `/api/share/*` routes omit plan checks (documented in SEC-05).

### 4. Supabase RLS & Service Role Key Security
- **Status: PARTIALLY PASSED (See SEC-06)**
- **Verification:**
  - `SUPABASE_SECRET_KEY` is confined entirely to server-side code (`lib/server/supabase.ts`). Zero instances in `'use client'` files or `NEXT_PUBLIC_*` variables.
  - All existing tables in migration files enable RLS and execute `revoke all on table from anon, authenticated`.
  - *Exception:* `orders` and `bank_transactions` lack migration definitions (documented in SEC-06).

### 5. Sensitive Data Exposure
- **Status: FAILED (See SEC-01)**
- **Verification:**
  - `GET /api/public/wedding/[slug]` leaks `content.sharePin` and `content.sharePinEnabled` to all unauthenticated visitors.

### 6. Public Endpoint Abuse & Anti-Spam
- **Status: PASSED**
- **Verification:**
  - RSVP and Wishes endpoints enforce:
    - IP rate limiting (10 requests per minute).
    - Honeypot field detection (`honeypot` must be empty).
    - Form timing validation (submissions under 1200ms are rejected as bots).
    - Cloudflare Turnstile token validation via `verifyTurnstileToken()`.

### 7. File Upload & Storage Security
- **Status: PASSED**
- **Verification:**
  - Uploaded files are validated using magic byte sniffing (`detectImageMimeFromBytes` for WebP, PNG, JPEG; `isMp3` for ID3/MPEG sync).
  - Storage keys are generated server-side using `crypto.randomUUID()`.
  - Path traversal is strictly blocked via regex validation (`MEDIA_KEY_RE`, `DESIGNER_MEDIA_KEY_RE`, `MUSIC_MEDIA_KEY_RE`).
  - Responses from `/media/[...key]` include `X-Content-Type-Options: nosniff`.

### 8. XSS & Dangerous Content Injection
- **Status: PASSED**
- **Verification:**
  - Zero instances of `eval()` in application code.
  - User-supplied URLs (`mapDirectionsUrl`, `mapEmbedUrl`) are strictly validated with `optionalHttpsUrlSchema`, requiring the `https://` protocol and blocking `javascript:` or `data:` vectors.
  - `dangerouslySetInnerHTML` is used only for static brand theme CSS/scripts and structured JSON-LD.

### 9. Auth0 & Open Redirect Protection
- **Status: PASSED**
- **Verification:**
  - All redirects in App Router pages (`redirect(...)`) and `proxy.ts` use hardcoded relative paths.
  - Auth0 SDK v4 natively validates the `returnTo` query parameter against relative paths and `AUTH0_BASE_URL`.

### 10. Security Headers & Cloudflare Configuration
- **Status: PARTIALLY PASSED (See SEC-08)**
- **Verification:**
  - `next.config.ts` sets `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`.
  - *Exception:* `Permissions-Policy: camera=()` conflicts with the QR check-in camera scanner (documented in SEC-08).

---

## Remediation Roadmap & Recommended Priority

```
Phase 1: Immediate Critical Fixes (Pre-Launch) [COMPLETED]
├── [SEC-01] Sanitize content in public wedding API to eliminate sharePin leak.
├── [SEC-02] Define SHARE_TOKEN_SECRET in .env.example and remove hardcoded fallback.
├── [SEC-03] Define LED_TOKEN_SECRET in .env.example and remove hardcoded fallback.
├── [SEC-04] Implement rate limiting and lockout on POST /api/share/verify-pin.
└── [SEC-05] Enforce VIP plan check on all /api/share/* endpoints.

Phase 2: Database & Usability Fixes (Sprint 1) [COMPLETED]
├── [SEC-06] Commit SQL migration for orders and bank_transactions with strict RLS.
├── [SEC-08] Update Permissions-Policy in next.config.ts to camera=(self).
└── [SEC-07] Add wedding_id ownership check to photo moderation endpoint.

Phase 3: Defense-in-Depth Hardening [COMPLETED]
├── [SEC-09] Switch app/page.tsx JSON-LD to use <JsonLd /> component.
└── [SEC-10] Use safeEqual() for constant-time cryptographic token verification.
```

---

## Remediation Log (November 19, 2026)

All findings from **SEC-01 through SEC-10** were remediated in a single coordinated pass:
- **SEC-01 (Critical):** `lib/server/public-wedding.ts` strips `sharePin`, `sharePinEnabled`, and `photoModeration` before returning public wedding data.
- **SEC-02 & SEC-03 (High):** Documented `SHARE_TOKEN_SECRET` and `LED_TOKEN_SECRET` in `.env.example`; removed static fallback strings in production via fail-closed checks in `lib/share-pin.ts` and `lib/led-token.ts`.
- **SEC-04 (High):** Added 5-attempt / 15-minute rate limit and constant-time PIN comparison (`safeEqual`) in `app/api/share/verify-pin/route.ts`.
- **SEC-05 (High):** Added server-side VIP plan check (`wedding.plan === 'vip'`) across all `/api/share/*` endpoints (`verify-pin`, `guests`, `check-in`, `moderate-photo`).
- **SEC-06 (High):** Created `supabase/migrations/20261119_orders_and_banking.sql` with explicit schema definitions, indexes, RLS enabled, and permissions revoked from `anon, authenticated`.
- **SEC-07 (Medium):** Added photo ownership check (`id = photoId AND wedding_id = wedding.id`) in `app/api/share/moderate-photo/route.ts`.
- **SEC-08 (Medium):** Updated `Permissions-Policy` to `camera=(self)` in `next.config.ts`, restoring QR check-in camera scanner functionality.
- **SEC-09 (Medium):** Refactored `app/page.tsx` JSON-LD to use `<JsonLd />` component with `<` escaping.
- **SEC-10 (Low):** Created standalone `lib/safe-equal.ts` and applied `safeEqual()` to token verification in `lib/led-token.ts`, `lib/share-pin.ts`, and `app/api/share/verify-pin/route.ts`.

### Verification Results
1. **Unit Tests:** `126/126` tests passed (`tests/*.test.ts`).
2. **TypeScript:** `npm run typecheck` passed with 0 errors.
3. **Production Build:** `npm run build` compiled 50/50 static and dynamic routes cleanly.
4. **Public Exposure:** Verified `sharePin` is 100% absent from public payloads.
