# Static Asset Performance Audit Report — Inviwedd Platform
**Date:** November 19, 2026  
**Target:** Static Image Assets (`public/templates/**`, `public/photos/**`, `public/images/**`)  
**Scope:** File size, pixel dimensions, format optimization, duplicate file audit, and component image loading patterns (`<img>`).  
**Auditor:** Automated Asset Performance Engine (Antigravity)  
**Status:** **READ-ONLY AUDIT** (No source files or assets modified during this step)

---

## 1. Executive Summary & Asset Performance Posture

A comprehensive scan of all static image assets in the `public/` directory was performed. While modern vector templates (`.svg`) and basic templates (`basic-2`, `basic-3`) maintain lean footprints (< 30 KB), several legacy and rich decorative templates contain **unoptimized PNGs**, **uncompressed JPEG covers**, and **oversized pixel dimensions** that degrade initial mobile invitation load times (LCP) and waste cellular data.

### Key Highlights
- **Total Static Images Scanned:** 82 files
- **Total Directory Footprint:** **3.86 MB** (4,044,299 bytes)
- **Templates Directory Footprint:** **3.28 MB** (3,443,412 bytes) across 22 template directories (**85.1%** of all static weight).
- **Format Distribution:**
  - `40` WebP files (2.48 MB, 64.4%)
  - `18` JPEG files (861.8 KB, 21.8%)
  - `3` PNG files (497.2 KB, 12.6%)
  - `21` SVG files (47.0 KB, 1.2%)
- **Critical Asset Identified:** `public/templates/hoa-anh-dao-v2/cover.png` is **472.2 KB** at **1920×880px** (uncompressed PNG with desktop-scale dimensions).
- **Duplicate Orphan Files:** `public/photos/` contains **9 redundant `.jpg` files** (337.2 KB total) that mirror existing `.webp` files but are never referenced in production code.
- **Estimated Total Savings:** **~1.55 MB** (**> 40% reduction**) achievable via WebP conversion, dimension downsizing, and orphan cleanup.

---

## 2. Summary Table & Format Breakdown

| Format | File Count | Total Size (KB) | Total Size (MB) | % of Total Weight | Optimization Potential |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`.webp`** | 40 | 2,543.5 KB | 2.48 MB | 64.4% | Moderate: Re-compress 6 heavy decorative WebPs (> 100 KB) |
| **`.jpg` / `.jpeg`** | 18 | 861.8 KB | 0.84 MB | 21.8% | **High**: Convert 9 template covers to WebP; purge 9 orphan photos |
| **`.png`** | 3 | 497.2 KB | 0.49 MB | 12.6% | **Critical**: Convert `hoa-anh-dao-v2/cover.png` (-85% reduction) |
| **`.svg`** | 21 | 47.0 KB | 0.05 MB | 1.2% | Excellent: Ultra-lightweight vector covers (< 3.3 KB each) |
| **Total** | **82** | **3,949.5 KB** | **3.86 MB** | **100.0%** | **Estimated Savings: ~1.55 MB (-40.1%)** |

---

## 3. Top 20 Heaviest Assets (Ranked by File Size)

| # | File Path | Format | Dimensions (W × H) | Size (KB) | Severity & Impact |
| :-: | :--- | :---: | :---: | :---: | :--- |
| **1** | `public/templates/hoa-anh-dao-v2/cover.png` | `.png` | 1920 × 880 | **472.2 KB** | 🔴 **CRITICAL**: Uncompressed PNG, desktop dimensions |
| **2** | `public/templates/nau-toi-gian/dry-branch.webp` | `.webp` | 733 × 900 | **225.7 KB** | 🟡 **WARNING**: Heavy decorative foliage asset |
| **3** | `public/templates/basic-1/line-flowers.webp` | `.webp` | 1000 × 503 | **213.6 KB** | 🟡 **WARNING**: Heavy line floral divider |
| **4** | `public/templates/nau-toi-gian/gift-box.webp` | `.webp` | 700 × 700 | **128.9 KB** | 🟡 **WARNING**: Decorative gift box icon (modal popup) |
| **5** | `public/templates/flowery-white/wreath.webp` | `.webp` | 586 × 420 | **126.2 KB** | 🟡 **WARNING**: Decorative wreath header |
| **6** | `public/templates/do-ruou-vang/garland.webp` | `.webp` | 1549 × 300 | **115.0 KB** | 🟡 **WARNING**: Oversized width (1549px for mobile banner) |
| **7** | `public/templates/do-may-man/floral.webp` | `.webp` | 554 × 1000 | **114.0 KB** | 🟡 **WARNING**: Side floral border |
| **8** | `public/templates/flowery-white/corner-b.webp` | `.webp` | 749 × 900 | **113.9 KB** | 🟡 **WARNING**: Corner floral element (> 600px width) |
| **9** | `public/templates/xanh-tu-do/floral.webp` | `.webp` | 554 × 1000 | **112.3 KB** | 🟡 **WARNING**: Side floral border |
| **10** | `public/templates/long-phung/cover.jpg` | `.jpg` | 720 × 1033 | **95.1 KB** | 🟡 **NON-WEBP**: Legacy JPEG template cover |
| **11** | `public/templates/flowery-white/cover.jpg` | `.jpg` | 720 × 1261 | **95.0 KB** | 🟡 **NON-WEBP**: Legacy JPEG template cover |
| **12** | `public/templates/minimal-red/cover.jpg` | `.jpg` | 720 × 1309 | **93.2 KB** | 🟡 **NON-WEBP**: Legacy JPEG template cover |
| **13** | `public/templates/do-may-man/envelope.webp` | `.webp` | 609 × 620 | **89.5 KB** | ⚪ NORMAL: Envelope decorative asset |
| **14** | `public/templates/xanh-tu-do/envelope.webp` | `.webp` | 609 × 620 | **88.2 KB** | ⚪ NORMAL: Envelope decorative asset |
| **15** | `public/templates/long-phung/phoenix.webp` | `.webp` | 195 × 820 | **88.2 KB** | ⚪ NORMAL: Phoenix vertical side border |
| **16** | `public/templates/long-phung/dragon.webp` | `.webp` | 195 × 820 | **84.8 KB** | ⚪ NORMAL: Dragon vertical side border |
| **17** | `public/templates/do-truyen-thong/gift-box.webp` | `.webp` | 760 × 760 | **79.0 KB** | 🟡 **OVERSIZED**: 760px wide for ~120px popup icon |
| **18** | `public/templates/long-phung/gift-box.webp` | `.webp` | 760 × 760 | **79.0 KB** | 🟡 **OVERSIZED**: 760px wide for ~120px popup icon |
| **19** | `public/templates/minimal-brown/leafs.webp` | `.webp` | 604 × 420 | **72.3 KB** | ⚪ NORMAL: Decorative leaves |
| **20** | `public/templates/minimal-red/ornament.webp` | `.webp` | 865 × 260 | **70.0 KB** | 🟡 **OVERSIZED**: 865px wide for ~240px divider |

---

## 4. Per-Template Breakdown (Ranked by Heaviest Folder First)

Total templates: **22 folders** containing **51 image files** totaling **3.28 MB**.

| Rank | Template Folder | Files | Total Size | Non-WebP Files | Heaviest Assets in Folder |
| :-: | :--- | :-: | :-: | :-: | :--- |
| **1** | `hoa-anh-dao-v2` | 2 | **525.7 KB** | 1 (`.png`) | `cover.png` (472.2 KB), `gift-box.webp` (53.5 KB) |
| **2** | `nau-toi-gian` | 4 | **414.3 KB** | 1 (`.jpg`) | `dry-branch.webp` (225.7 KB), `gift-box.webp` (128.9 KB), `cover.jpg` (50.8 KB) |
| **3** | `flowery-white` | 6 | **410.7 KB** | 1 (`.jpg`) | `wreath.webp` (126.2 KB), `corner-b.webp` (113.9 KB), `cover.jpg` (95.0 KB) |
| **4** | `long-phung` | 5 | **406.8 KB** | 1 (`.jpg`) | `cover.jpg` (95.1 KB), `phoenix.webp` (88.2 KB), `dragon.webp` (84.8 KB) |
| **5** | `minimal-red` | 5 | **358.4 KB** | 1 (`.jpg`) | `cover.jpg` (93.2 KB), `ornament.webp` (70.0 KB), `gift-box.webp` (66.3 KB) |
| **6** | `do-may-man` | 3 | **258.2 KB** | 1 (`.jpg`) | `floral.webp` (114.0 KB), `envelope.webp` (89.5 KB), `cover.jpg` (54.7 KB) |
| **7** | `xanh-tu-do` | 3 | **256.0 KB** | 1 (`.jpg`) | `floral.webp` (112.3 KB), `envelope.webp` (88.2 KB), `cover.jpg` (55.4 KB) |
| **8** | `do-ruou-vang` | 3 | **249.5 KB** | 1 (`.jpg`) | `garland.webp` (115.0 KB), `cover.jpg` (69.9 KB), `rose.webp` (64.6 KB) |
| **9** | `basic-1` | 3 | **267.1 KB** | 0 | `line-flowers.webp` (213.6 KB), `cover.webp` (51.5 KB), `olive-branch.svg` (2.0 KB) |
| **10** | `minimal-brown` | 4 | **181.7 KB** | 1 (`.jpg`) | `leafs.webp` (72.3 KB), `cover.jpg` (61.6 KB), `gift.webp` (32.3 KB) |
| **11** | `do-truyen-thong` | 2 | **135.5 KB** | 1 (`.jpg`) | `gift-box.webp` (79.0 KB), `cover.jpg` (56.5 KB) |
| **12** | `basic-2` | 1 | **28.5 KB** | 0 | `cover.webp` (28.5 KB) |
| **13** | `basic-3` | 1 | **28.1 KB** | 0 | `cover.webp` (28.1 KB) |
| **14** | `blossom-v1` | 2 | **9.9 KB** | 0 | `branch-soft.svg` (4.9 KB), `branch.svg` (4.9 KB) |
| **15** | `to-duyen-do-dam` | 1 | **3.2 KB** | 0 | `cover.svg` (3.2 KB) — Vector cover |
| **16** | `vuonkinh-xanh` | 1 | **3.2 KB** | 0 | `cover.svg` (3.2 KB) — Vector cover |
| **17** | `long-phung-v2-do` | 1 | **3.2 KB** | 0 | `cover.svg` (3.2 KB) — Vector cover |
| **18** | `vuonkinh-xanh-nhat` | 1 | **3.2 KB** | 0 | `cover.svg` (3.2 KB) — Vector cover |
| **19** | `vuon-xuan-xanh` | 1 | **3.2 KB** | 0 | `cover.svg` (3.2 KB) — Vector cover |
| **20** | `song-hy-v2-do` | 1 | **3.2 KB** | 0 | `cover.svg` (3.2 KB) — Vector cover |
| **21** | `song-phung-xanh` | 1 | **3.2 KB** | 0 | `cover.svg` (3.2 KB) — Vector cover |
| **22** | `mai-lan-xanh` | 1 | **3.2 KB** | 0 | `cover.svg` (3.2 KB) — Vector cover |

---

## 5. Flagged Assets & Anomaly Analysis

### 5.1 CRITICAL (> 300 KB)
```
🔴 public/templates/hoa-anh-dao-v2/cover.png (472.2 KB | 1920 × 880px)
```
- **Issue:** Single image takes nearly 0.5 MB. It is stored as an uncompressed 24-bit PNG with desktop resolution (1920px width), while mobile invitation cards display it at max 360–480px width.
- **Action Required:** Downscale width to `720px` (2x mobile retina) and convert to `.webp` with quality 85. Target size: **~55–65 KB** (saving **~410 KB, -87%**).

### 5.2 WARNING: Non-WebP Template Covers (9 JPEG files)
All 9 template cover images below are stored as `.jpg`, forcing extra network payload compared to modern WebP:
1. `public/templates/long-phung/cover.jpg` (95.1 KB | 720 × 1033)
2. `public/templates/flowery-white/cover.jpg` (95.0 KB | 720 × 1261)
3. `public/templates/minimal-red/cover.jpg` (93.2 KB | 720 × 1309)
4. `public/templates/do-ruou-vang/cover.jpg` (69.9 KB | 720 × 1163)
5. `public/templates/minimal-brown/cover.jpg` (61.6 KB | 720 × 1261)
6. `public/templates/do-truyen-thong/cover.jpg` (56.5 KB | 720 × 1177)
7. `public/templates/xanh-tu-do/cover.jpg` (55.4 KB | 720 × 1261)
8. `public/templates/do-may-man/cover.jpg` (54.7 KB | 720 × 1261)
9. `public/templates/nau-toi-gian/cover.jpg` (50.8 KB | 720 × 1261)
- **Combined Size:** **632.2 KB**
- **Action Required:** Convert all 9 covers to `.webp` at quality 84–86. Target size: **~310 KB** (saving **~322 KB, -51%**).

### 5.3 WARNING: Heavy Decorative WebPs (> 100 KB)
Six decorative elements exceed 100 KB despite being non-essential background graphics:
1. `public/templates/nau-toi-gian/dry-branch.webp` (**225.7 KB** | 733 × 900)
2. `public/templates/basic-1/line-flowers.webp` (**213.6 KB** | 1000 × 503)
3. `public/templates/nau-toi-gian/gift-box.webp` (**128.9 KB** | 700 × 700)
4. `public/templates/flowery-white/wreath.webp` (**126.2 KB** | 586 × 420)
5. `public/templates/do-ruou-vang/garland.webp` (**115.0 KB** | 1549 × 300)
6. `public/templates/flowery-white/corner-b.webp` (**113.9 KB** | 749 × 900)
7. `public/templates/do-may-man/floral.webp` (**114.0 KB** | 554 × 1000)
8. `public/templates/xanh-tu-do/floral.webp` (**112.3 KB** | 554 × 1000)
- **Action Required:** Re-encode with WebP lossy alpha (`cwebp -q 80 -alpha_q 80`) or scale down by 20–30% where display size is smaller than source dimensions. Estimated savings: **~450 KB**.

### 5.4 OVERSIZED DIMENSIONS
Assets where pixel dimensions significantly exceed mobile viewport requirements:
| Asset Path | Current Size | Current Dimensions | Display Use Case | Recommended Resize |
| :--- | :---: | :---: | :--- | :--- |
| `templates/hoa-anh-dao-v2/cover.png` | 472.2 KB | **1920 × 880** | Card Cover | **720 × 330** (2x retina) |
| `templates/do-ruou-vang/garland.webp` | 115.0 KB | **1549 × 300** | Top Banner | **800 × 155** |
| `templates/do-truyen-thong/gift-box.webp` | 79.0 KB | **760 × 760** | Modal Icon (~120px) | **360 × 360** |
| `templates/long-phung/gift-box.webp` | 79.0 KB | **760 × 760** | Modal Icon (~120px) | **360 × 360** |
| `templates/flowery-white/corner-b.webp` | 113.9 KB | **749 × 900** | Decorative Corner (~160px) | **400 × 480** |
| `templates/minimal-red/ornament.webp` | 70.0 KB | **865 × 260** | Section Divider (~240px) | **480 × 144** |

### 5.5 ORPHAN DUPLICATE FILES (`public/photos/`)
The `public/photos/` directory contains **9 duplicate JPEG files** that have identical `.webp` counterparts in the exact same directory:
- `1.jpg` (59.4 KB) vs `1.webp` (50.6 KB)
- `2.jpg` (38.6 KB) vs `2.webp` (27.8 KB)
- `3.jpg` (38.0 KB) vs `3.webp` (27.0 KB)
- `4.jpg` (22.5 KB) vs `4.webp` (19.4 KB)
- `5.jpg` (27.1 KB) vs `5.webp` (26.9 KB)
- `6.jpg` (17.4 KB) vs `6.webp` (14.4 KB)
- `hero2.jpg` (52.8 KB) vs `hero2.webp` (47.0 KB)
- `portrait_cd.jpg` (61.9 KB) vs `portrait_cd.webp` (50.5 KB)
- `portrait_cr.jpg` (54.5 KB) vs `portrait_cr.webp` (45.3 KB)
- **Finding:** A full codebase grep confirms **ZERO references** to any of these `.jpg` files (only `.webp` is referenced in `content/demo.ts` and components).
- **Wasted Space:** **337.2 KB** can be completely eliminated safely.

---

## 6. Image Loading Strategy Analysis (`templates/**`)

Inspection of template rendering code revealed inconsistent usage of modern browser image attributes:

```
Loading Strategy Compliance Matrix
┌───────────────────────────┬──────────────┬──────────────────┬─────────────────┬────────────────┐
│ Template File             │ Above-Fold   │ fetchPriority    │ decoding="async"│ Below-Fold     │
│                           │ Eager Load   │ ="high" on Cover │ on All Images   │ loading="lazy" │
├───────────────────────────┼──────────────┼──────────────────┼─────────────────┼────────────────┤
│ templates/basic-2         │  PASSED     │  PASSED         │  PASSED        │  PASSED       │
│ templates/basic-3         │  PASSED     │  PASSED         │  PASSED        │  PASSED       │
│ templates/do-may-man      │ ❌ MISSING   │ ❌ MISSING       │ ❌ MISSING      │ ❌ MISSING     │
│ templates/do-ruou-vang    │ ❌ MISSING   │ ❌ MISSING       │ ❌ MISSING      │ ❌ MISSING     │
│ templates/do-truyen-thong │ ❌ MISSING   │ ❌ MISSING       │ ❌ MISSING      │ ❌ MISSING     │
│ templates/flowery-white   │ ❌ MISSING   │ ❌ MISSING       │ ❌ MISSING      │ ❌ MISSING     │
│ templates/long-phung      │ ❌ MISSING   │ ❌ MISSING       │ ❌ MISSING      │ ❌ MISSING     │
│ templates/minimal-brown   │ ❌ MISSING   │ ❌ MISSING       │ ❌ MISSING      │ ❌ MISSING     │
│ templates/minimal-red     │ ❌ MISSING   │ ❌ MISSING       │ ❌ MISSING      │ ❌ MISSING     │
│ templates/nau-toi-gian    │ ❌ MISSING   │ ❌ MISSING       │ ❌ MISSING      │ ❌ MISSING     │
│ templates/xanh-tu-do      │ ❌ MISSING   │ ❌ MISSING       │ ❌ MISSING      │ ❌ MISSING     │
│ templates/themed/ThemedHero│  PASSED     │ ❌ MISSING       │ ❌ MISSING      │ N/A (Hero only)│
└───────────────────────────┴──────────────┴──────────────────┴─────────────────┴────────────────┘
```

### Specific Findings:
1. **Above-the-Fold Hero / Cover Images:**
   - In `templates/do-may-man`, `templates/do-ruou-vang`, `templates/flowery-white`, `templates/nau-toi-gian`, etc., the main hero couple/cover photo is rendered as bare `<img src={heroUrl} />` without:
     - `loading="eager"`
     - `fetchPriority="high"`
     - `decoding="async"`
   - *Impact:* The browser deprioritizes the LCP image request behind JavaScript bundles and stylesheets, increasing Largest Contentful Paint (LCP) by 200–500ms on 4G connections.
2. **Below-the-Fold Decorative & Gallery Images:**
   - In `templates/flowery-white/index.tsx`, 15 corner and wreath decorative graphics load immediately without `loading="lazy"`.
   - In `templates/nau-toi-gian/index.tsx`, the 225 KB `dry-branch.webp` and 128 KB `gift-box.webp` load simultaneously with the page even before the user opens the envelope or scrolls down.
   - *Impact:* Significant main-thread contention and unnecessary bandwidth consumption for users who only glance at the invitation cover.

---

## 7. Recommended Optimization Plan

### Phase 1: High-Impact Image Conversions (Target Savings: ~1.1 MB)
1. **Convert `hoa-anh-dao-v2/cover.png`:**
   - Resize to max width `720px` (preserving aspect ratio).
   - Convert to `cover.webp` at quality 85.
   - Update `templates/registry.ts` and `templates/hoa-anh-dao-v2/index.tsx` to reference `.webp`.
2. **Convert 9 Template `cover.jpg` to `cover.webp`:**
   - Source files: `long-phung`, `flowery-white`, `minimal-red`, `do-ruou-vang`, `minimal-brown`, `do-truyen-thong`, `xanh-tu-do`, `do-may-man`, `nau-toi-gian`.
   - Keep width at `720px` (standard 2x retina mobile width), convert to WebP at quality 85 (`cwebp -q 85 cover.jpg -o cover.webp`).
   - Update references in `templates/registry.ts` and template components.
3. **Delete Orphan Duplicate JPEGs in `public/photos/`:**
   - Delete `1.jpg`, `2.jpg`, `3.jpg`, `4.jpg`, `5.jpg`, `6.jpg`, `hero2.jpg`, `portrait_cd.jpg`, `portrait_cr.jpg` (reclaiming **337.2 KB** instantly with 0 code impact).

### Phase 2: Heavy Decorative Asset Downscaling (Target Savings: ~450 KB)
1. Downscale `do-ruou-vang/garland.webp` from 1549px to `800px` width.
2. Downscale `flowery-white/corner-b.webp` from 749px to `400px` width.
3. Downscale `do-truyen-thong/gift-box.webp` and `long-phung/gift-box.webp` from 760px to `360px` width.
4. Re-compress `nau-toi-gian/dry-branch.webp` and `basic-1/line-flowers.webp` with `cwebp -q 80 -alpha_q 80`.

### Phase 3: Component Image Loading Standard (Zero Asset Changes)
Standardize all invitation templates to match the reference implementation in `templates/basic-2/index.tsx`:
- **Above-the-Fold Cover/Hero Image:**
  ```jsx
  <img
    src={heroUrl}
    alt={heroAlt}
    width={720}
    height={1080}
    loading="eager"
    fetchPriority="high"
    decoding="async"
    className="..."
  />
  ```
- **Below-the-Fold Decorative & Gallery Assets:**
  ```jsx
  <img
    src="/templates/nau-toi-gian/dry-branch.webp"
    alt=""
    aria-hidden="true"
    loading="lazy"
    decoding="async"
    className="..."
  />
  ```
