# DispatchSEO Site Conventions — Inviwedd (`https://inviwedd.date/`)

## 1. Product
- **What it is:** Inviwedd (`https://inviwedd.date/`) is a Vietnamese online wedding invitation and wedding-planning platform (`config/landing.ts`, `config/site.ts`). Couples choose an interactive mobile-first invitation template, import guest lists (up to 500 guests per batch), generate personalized invitation links carrying each guest's name and ceremony access, collect real-time RSVPs, manage wedding photos/music/gift QR, and use free browser-based wedding calculators.
- **Who it serves & problem solved:** Vietnamese couples and families planning weddings who want to replace costly paper invitations, manual envelope addressing, and scattered Zalo/Excel guest headcount tracking with instant personalized invitation links and automated RSVP management (free for up to 20 guests, no card required; Pro/VIP plans unlock unlimited guests, albums, and premium templates per `config/plans.ts`).

### Product-surface files
- **Positioning:**
  - `config/landing.ts` (hero, template showcase, 3-step how-it-works, pricing, demo copy)
  - `app/page.tsx` & `components/landing/landing-page-client.tsx`
  - `components/landing/hero.tsx` & `components/landing/how-it-works.tsx`
  - `config/site.ts` & `config/pricing.ts`
- **Capability:**
  - `config/plans.ts` (Free / Pro / VIP limits for weddings, guests, ceremonies, photos, albums, gift QR)
  - `config/tools-copy.ts` (free browser tools: wedding budget/table calculator and solar/lunar calendar converter)
  - `templates/registry.ts` (template catalog and plan tiers)
  - `content/demo.ts` (sample couple/ceremony/invitation data model)

### Facets
1. Thiệp cưới online cá nhân hóa tên từng vị khách (personalized online wedding invitations)
2. Quản lý danh sách khách mời & theo dõi xác nhận tham dự RSVP tự động
3. Công cụ tính chi phí đám cưới, số bàn tiệc dự phòng & đổi lịch âm dương cưới hỏi miễn phí
4. Thiệp cưới điện tử đa phương tiện với nhạc nền, album ảnh cưới, bản đồ Google Maps & QR mừng cưới

---

## 2. Stack & Build
- **Framework:** Next.js 16 (`next@^16.4.6`, App Router), React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/postcss`), Cloudflare Workers adapter (`@opennextjs/cloudflare`, `wrangler`) (`package.json`).
- **Package manager:** `npm` (`package-lock.json`).
- **Build & verify commands:**
  - Production build: `npm run build` (`next build`)
  - Typecheck: `npm run typecheck` (`tsc --noEmit`)
  - Lint: `npm run lint`
  - Unit tests: `npm test`
  - Serve production build locally: `npm run start` (port `3000`)
- **CI gates:**
  - `.github/workflows/seo-tool-validate.yml` runs `npm ci`, `npm run build`, starts `npm run start` on `:3000`, and validates new `/cong-cu/<slug>` PRs with Playwright.
  - `.github/workflows/seo-auto-merge.yml` enforces `.dispatchseo/publish-paths` (`content/blog/`, `components/blog/`, `public/blog/covers/`) for guide PRs and `tool-validated` + denylist checks for tool PRs.
- **Auth & public routing:** `proxy.ts` handles domain canonical redirect, `/auth/*`, and `/dashboard/*` auth protection; `/blog`, `/blog/:path*`, `/cong-cu`, `/cong-cu/:path*`, `/sitemap.xml`, and `/robots.txt` are public.

---

## 3. Guides (`/blog`)
- **Content directory:** `content/blog/` (`.mdx` or `.md` files, parsed by `lib/blog.ts` and rendered by `components/blog/MarkdownContent.tsx`).
- **Routes:**
  - List page: `app/blog/page.tsx` (`/blog`, static `force-static`)
  - Detail page: `app/blog/[slug]/page.tsx` (`/blog/<slug>`, `force-static`, `dynamicParams = false`, `generateStaticParams()`)
- **Slug convention:** ASCII kebab-case matching the filename (`content/blog/<slug>.mdx` -> `/blog/<slug>`).
- **Frontmatter contract (`lib/blog.ts`):**
  - Required: `title` (string), `description` (string), `date` (`YYYY-MM-DD`)
  - Optional: `updated` (`YYYY-MM-DD`), `author` (defaults to `"Inviwedd"`), `category` (string), `tags` (`string[]`), `cover` (string URL path), `faqs` (`Array<{ question: string; answer: string }>`)
- **Cover image facts:**
  - Frontmatter field: `cover`
  - Output directory: `public/blog/covers/`
  - Served URL prefix: `/blog/covers/` (e.g. `/blog/covers/<slug>.webp` or `.svg` from `node .dispatchseo/generate-cover.mjs --slug <slug> --svg ... --out public/blog/covers`)
  - Fallback behavior: `app/blog/page.tsx` renders a clean category/brand fallback plate when `cover` is omitted, and `app/blog/[slug]/page.tsx` falls back to `/templates/basic-1/cover.webp` for OG/JSON-LD, but every new guide is expected to generate and set its own `cover`.
- **Auto-rendered by template:**
  - `app/blog/[slug]/page.tsx` renders breadcrumbs, reading time, sticky desktop ToC ("Trên trang này" from H2 headings) + `Inviwedd` CTA promo card, mobile bottom CTA, optional `ToolFaqSection` from `faqs`, and `Article` + `BreadcrumbList` + `FAQPage` JSON-LD via `components/tools/JsonLd.tsx`.
  - `app/sitemap.ts` automatically includes `/blog` and every post from `getAllBlogPosts()`.
  - `app/robots.ts` explicitly allows `/blog`.
- **Internal-link style:** Standard Markdown links (`[Bảng tính chi phí đám cưới](/cong-cu/bang-tinh-dam-cuoi)`, `[Đổi ngày dương sang âm lịch](/cong-cu/doi-am-lich)`, `[Tạo thiệp cưới miễn phí](/tao-thiep)`).
- **Exemplar posts:** None yet (fresh install; follow the frontmatter contract above).

---

## 4. Tools (`/cong-cu`)
- **Public base path:** `/cong-cu/<slug>` (index hub at `/cong-cu`, `app/cong-cu/page.tsx`; existing tools: `/cong-cu/bang-tinh-dam-cuoi`, `/cong-cu/doi-am-lich`, `/cong-cu/tao-loi-moi-zalo`).
- **Registry & wiring files:**
  1. `config/site.ts` — add route key to `SITE_LINKS`
  2. `config/tools-copy.ts` — add card metadata to `TOOLS_HUB_COPY.cards` and export `<TOOL>_COPY` (SEO, breadcrumbs, intro, FAQ items, CTA)
  3. `components/tools/<ToolName>Client.tsx` — client-side interactive widget (`"use client"`)
  4. `app/cong-cu/<slug>/page.tsx` — static route (`export const dynamic = "force-static"`) using `ToolsPageShell`, `JsonLd` (`WebApplication`, `FAQPage`, `BreadcrumbList`), `ToolFaqSection` / `CrossToolNav`, and `<ToolName>Client`
  5. `app/sitemap.ts` and `app/robots.ts` — register the new tool route (`app/robots.ts` already allows `/cong-cu/*`; add entry to `app/sitemap.ts`)
- **Reference implementation:** `app/cong-cu/bang-tinh-dam-cuoi/page.tsx`, `components/tools/WeddingCalcClient.tsx`, and `WEDDING_CALC_COPY` in `config/tools-copy.ts` (also see `app/cong-cu/tao-loi-moi-zalo/page.tsx` and `app/cong-cu/doi-am-lich/page.tsx`).
- **Template auto-renders:** `ToolsPageShell` (navbar, breadcrumbs, footer), `JsonLd`, `ToolFaqSection`, bottom conversion CTA linking to `/tao-thiep`, and quick cross-links.

---

## 5. Design System
- **Token source:** `lib/brand-theme.ts` (`brandLightTheme` / `brandDarkTheme`) injected via `app/layout.tsx` and mapped to Tailwind CSS v4 `@theme inline` in `app/globals.css`.
- **Semantic color tokens (Light / Dark):**
  - `--brand-bg`: `#FAF7F2` / `#0B0B0B` (`bg-bg`)
  - `--brand-surface`: `#FFFFFF` / `#151515` (`bg-surface`)
  - `--brand-surface-alt`: `#F3EEE6` / `#1B1B1B` (`bg-surface-alt`)
  - `--brand-border`: `#E4DCCD` / `#2A2A2A` (`border-border`)
  - `--brand-text`: `#2C2A29` / `#E8DFC8` (`text-text`)
  - `--brand-text-muted`: `#5C5752` / `#A89F86` (`text-text-muted`)
  - `--brand-accent`: `#C5A059` / `#D4AF37` (`bg-accent`)
  - `--brand-accent-hover`: `#B58F46` / `#E3C35A` (`hover:bg-accent-hover`)
  - `--brand-accent-text`: `#8A6D2F` / `#D4AF37` (`text-accent-text`)
  - `--brand-accent-fg`: `#2C2A29` / `#0B0B0B` (`text-accent-fg`)
  - `--brand-accent-soft`: `#F1E7D0` / `#2A2412` (`bg-accent-soft`)
  - `--brand-rose`: `#C88A7D` / `#C88A7D`
  - `--brand-sage`: `#6B7B6E` / `#7F9184`
- **Fonts (`app/layout.tsx`):** `--font-sans` (`Be_Vietnam_Pro`), `--font-display` (`Lora`, `Cormorant_Garamond`).
- **Icons & brand mark:** `lucide-react` icons; wordmark renders `SITE_NAME` (`Inviwedd`) in `font-display text-accent-text` (`components/landing/navbar.tsx`).
- **Cards & buttons idiom:** `rounded-2xl border border-border bg-surface p-6` cards; pill CTAs `rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg hover:bg-accent-hover`.
- **Exemplar visual components:** `components/tools/ToolsPageShell.tsx`, `components/tools/WeddingCalcClient.tsx`, `components/landing/hero.tsx`.

---

## 6. Voice & Writing Rules
- **Language:** Vietnamese (`lang="vi"`, `locale: "vi_VN"`), practical, respectful, and clear for Vietnamese couples and families planning weddings.
- **Author attribution:** `Inviwedd` editorial voice (avoid invented personal names or first-person "tôi" claims).
- **Formatting & punctuation:** Write concise paragraphs and structured headings/lists/tables; avoid hype words, AI filler, and overusing em-dashes (`—`). Use concrete Vietnamese wedding context (mâm tiệc 10 người, tiền mừng, gia tiên, lễ ăn hỏi, lễ thành hôn).

---

## 7. Analytics
- Optional Cloudflare Web Analytics beacon in `app/layout.tsx` gated by `NEXT_PUBLIC_CF_ANALYTICS_TOKEN`. No custom client event tracker helper exists in the repo.
