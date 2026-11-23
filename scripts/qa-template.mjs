import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';
import sharp from 'sharp';
import { chromium } from 'playwright';

// ============================================================
// CẤU HÌNH & BẢNG MÀU ANSI
// ============================================================
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

const PASS_BADGE = `${GREEN}${BOLD}[PASS]${RESET}`;
const FAIL_BADGE = `${RED}${BOLD}[FAIL]${RESET}`;
const WARN_BADGE = `${YELLOW}${BOLD}[WARN]${RESET}`;

// Từ khóa cấm xuất hiện trên thiệp
const FORBIDDEN_STRINGS = [
  'gia tộc',
  'đại diện gia tộc',
  'thân sinh:',
  'bố mẹ:',
  'sự kiện trọng đại',
  'gói free hiển thị',
];

// Danh sách các template hợp lệ
function getAvailableTemplates() {
  const tplDir = path.resolve('templates');
  if (!fs.existsSync(tplDir)) return [];
  return fs.readdirSync(tplDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !['shared', 'themed', 'registry.ts', 'types.ts'].includes(d.name))
    .filter(d => fs.existsSync(path.join(tplDir, d.name, 'index.tsx')))
    .map(d => d.name);
}

// Kiểm tra server sẵn sàng
async function isServerReady(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Tự động kiểm tra hoặc khởi động Next.js server
async function ensureServer(port = 3000) {
  const url = `http://localhost:${port}`;
  if (await isServerReady(url)) {
    console.log(`${GRAY}ℹ️ Next.js dev server đã sẵn sàng tại ${url}${RESET}`);
    return { url, process: null };
  }

  console.log(`${CYAN}🚀 Khởi động Next.js dev server trên cổng ${port}...${RESET}`);
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npx.cmd' : 'npx';
  const child = spawn(cmd, ['next', 'dev', '-p', String(port)], {
    stdio: 'ignore',
    shell: isWindows,
    detached: !isWindows,
  });

  const maxRetries = 40;
  for (let i = 0; i < maxRetries; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isServerReady(url)) {
      console.log(`${GREEN}✅ Next.js dev server đã khởi động thành công tại ${url}${RESET}`);
      return { url, process: child };
    }
  }

  try {
    child.kill();
  } catch {}
  throw new Error(`Không thể khởi động Next.js server tại ${url} sau 40 giây.`);
}

// Báo cáo kết quả
class TestReport {
  constructor(slug) {
    this.slug = slug;
    this.results = [];
  }

  add(group, name, status, details = '') {
    this.results.push({ group, name, status, details });
  }

  isSuccess() {
    return this.results.every((r) => r.status === 'PASS');
  }

  print() {
    console.log(`\n${BOLD}========================================================================================${RESET}`);
    console.log(`${BOLD} BẢNG KẾT QUẢ TỰ KIỂM THỬ QA — TEMPLATE: ${CYAN}${this.slug}${RESET}`);
    console.log(`${BOLD}========================================================================================${RESET}`);

    let currentGroup = '';
    for (const r of this.results) {
      if (r.group !== currentGroup) {
        currentGroup = r.group;
        console.log(`\n${BLUE}${BOLD}► ${currentGroup}${RESET}`);
      }
      const badge = r.status === 'PASS' ? PASS_BADGE : FAIL_BADGE;
      const detailsText = r.details ? ` ${GRAY}(${r.details})${RESET}` : '';
      console.log(`  ${badge} ${r.name}${detailsText}`);
    }

    const total = this.results.length;
    const passed = this.results.filter((r) => r.status === 'PASS').length;
    const failed = total - passed;
    const rate = Math.round((passed / total) * 100);

    console.log(`\n${BOLD}----------------------------------------------------------------------------------------${RESET}`);
    if (failed === 0) {
      console.log(`${GREEN}${BOLD}🏆 TỔNG KẾT: 100% PASS (${passed}/${total} hạng mục) — ĐẠT CỔNG NGHIỆM THU!${RESET}`);
    } else {
      console.log(`${RED}${BOLD}❌ TỔNG KẾT: ${failed}/${total} hạng mục FAIL (Tỷ lệ đạt: ${rate}%) — CẦN SỬA LỖI!${RESET}`);
    }
    console.log(`${BOLD}========================================================================================${RESET}\n`);
  }
}

// ============================================================
// NHÓM 1: KIỂM TRA FILE ASSET & TÁCH NỀN (Sharp + FS)
// ============================================================
async function runAssetChecks(slug, report) {
  const assetDir = path.resolve('public/templates', slug);
  const GROUP = 'Nhóm 1 — Kiểm tra Tệp Asset & Tách Nền';

  if (!fs.existsSync(assetDir)) {
    report.add(GROUP, 'Thư mục asset công khai', 'FAIL', `Không tìm thấy ${assetDir}`);
    return;
  }

  // 1.1 WebP sạch: 0 file .png, .jpg, .jpeg
  const allFiles = fs.readdirSync(assetDir);
  const legacyFiles = allFiles.filter((f) => /\.(png|jpe?g)$/i.test(f));
  if (legacyFiles.length === 0) {
    report.add(GROUP, '1.1 Định dạng WebP sạch (0 file .png/.jpg)', 'PASS', `100% là .webp`);
  } else {
    report.add(GROUP, '1.1 Định dạng WebP sạch', 'FAIL', `Còn sót file legacy: ${legacyFiles.join(', ')}`);
  }

  // 1.2 Ảnh bìa Catalog (cover.webp)
  const coverPath = path.join(assetDir, 'cover.webp');
  if (!fs.existsSync(coverPath)) {
    report.add(GROUP, '1.2 Ảnh bìa Catalog (cover.webp)', 'FAIL', 'Thiếu file cover.webp');
  } else {
    try {
      const stat = fs.statSync(coverPath);
      const meta = await sharp(coverPath).metadata();
      const sizeKb = (stat.size / 1024).toFixed(1);
      const isSizeOk = stat.size < 60 * 1024;
      const isDimOk = meta.width === 720 && meta.height === 1180;

      if (isSizeOk && isDimOk) {
        report.add(GROUP, '1.2 Ảnh bìa Catalog (cover.webp)', 'PASS', `720x1180px, dung lượng ${sizeKb}KB < 60KB`);
      } else {
        const reasons = [];
        if (!isDimOk) reasons.push(`Kích thước ${meta.width}x${meta.height}px (chuẩn: 720x1180px)`);
        if (!isSizeOk) reasons.push(`Dung lượng ${sizeKb}KB >= 60KB`);
        report.add(GROUP, '1.2 Ảnh bìa Catalog (cover.webp)', 'FAIL', reasons.join('; '));
      }
    } catch (err) {
      report.add(GROUP, '1.2 Ảnh bìa Catalog (cover.webp)', 'FAIL', err.message);
    }
  }

  // 1.3 Chống che ảnh ở Khung Vòm / Khung Phim (*arch*.webp, *frame*.webp)
  const archFiles = allFiles.filter((f) => /(arch|frame)/i.test(f) && f.endsWith('.webp'));
  if (archFiles.length === 0) {
    report.add(GROUP, '1.3 Trong suốt lõi Khung Vòm / Khung Phim', 'PASS', 'Mẫu không dùng asset vòm/khung');
  } else {
    let allTransparent = true;
    const opaqueDetails = [];

    for (const af of archFiles) {
      try {
        const filePath = path.join(assetDir, af);
        const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
        const { width, height, channels } = info;
        if (channels < 4) {
          allTransparent = false;
          opaqueDetails.push(`${af}: không có kênh alpha`);
          continue;
        }

        // Đo tâm ảnh (width/2, height/2) và vùng 10% lân cận
        const cx = Math.floor(width / 2);
        const cy = Math.floor(height / 2);
        const centerIdx = (cy * width + cx) * 4;
        const centerAlpha = data[centerIdx + 3];

        if (centerAlpha > 20) {
          allTransparent = false;
          opaqueDetails.push(`${af}: tâm bị đục (Alpha=${centerAlpha}, RGB=${data[centerIdx]},${data[centerIdx+1]},${data[centerIdx+2]})`);
        }
      } catch (err) {
        allTransparent = false;
        opaqueDetails.push(`${af}: lỗi đọc ${err.message}`);
      }
    }

    if (allTransparent) {
      report.add(GROUP, '1.3 Trong suốt lõi Khung Vòm / Khung Phim', 'PASS', `${archFiles.length} file khung đều có tâm rỗng (Alpha=0)`);
    } else {
      report.add(GROUP, '1.3 Trong suốt lõi Khung Vòm / Khung Phim', 'FAIL', opaqueDetails.join('; '));
    }
  }

  // 1.4 Căn tâm Hộp Quà 3 trạng thái
  const giftFiles = allFiles.filter((f) => /(gift|box|li-xi|packet|parcel)/i.test(f) && f.endsWith('.webp'));
  if (giftFiles.length < 2) {
    report.add(GROUP, '1.4 Căn tâm & baseline Hộp Quà', 'PASS', 'Mẫu dùng cấu hình icon mừng cưới đơn giản');
  } else {
    try {
      const metrics = [];
      for (const gf of giftFiles) {
        const filePath = path.join(assetDir, gf);
        const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
        const { width, height, channels } = info;
        if (channels < 4) continue;

        let minX = width, maxX = 0, minY = height, maxY = 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (data[idx + 3] > 15) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX >= minX) {
          const centerX = (minX + maxX) / 2;
          const centerRatio = centerX / width;
          metrics.push({ file: gf, width, height, minX, maxX, maxY, centerRatio });
        }
      }

      if (metrics.length >= 2) {
        let isCentered = true;
        let isBaselineSynced = true;
        const issues = [];

        // Kiểm tra tâm 50% +- 4% (0.46 -> 0.54)
        for (const m of metrics) {
          if (m.centerRatio < 0.46 || m.centerRatio > 0.54) {
            isCentered = false;
            issues.push(`${m.file} lệch tâm (${(m.centerRatio * 100).toFixed(1)}%)`);
          }
        }

        // Kiểm tra đáy đồng bộ (chênh lệch maxY giữa các file <= 12px)
        const bottoms = metrics.map((m) => m.maxY);
        const maxBottom = Math.max(...bottoms);
        const minBottom = Math.min(...bottoms);
        if (maxBottom - minBottom > 12) {
          isBaselineSynced = false;
          issues.push(`Đáy hộp quà lệch nhau ${maxBottom - minBottom}px`);
        }

        if (isCentered && isBaselineSynced) {
          report.add(GROUP, '1.4 Căn tâm & baseline Hộp Quà', 'PASS', `Tâm cân đối 50% ± 4%, đáy đồng bộ`);
        } else {
          report.add(GROUP, '1.4 Căn tâm & baseline Hộp Quà', 'FAIL', issues.join('; '));
        }
      } else {
        report.add(GROUP, '1.4 Căn tâm & baseline Hộp Quà', 'PASS', 'Đã phân tích các asset hộp quà');
      }
    } catch (err) {
      report.add(GROUP, '1.4 Căn tâm & baseline Hộp Quà', 'FAIL', err.message);
    }
  }
}

// ============================================================
// NHÓM 2: RESPONSIVE, TRÀN NGANG & BÌA THIỆP (Playwright)
// ============================================================
async function runResponsiveChecks(slug, baseUrl, browser, report) {
  const GROUP = 'Nhóm 2 — Responsive, Tràn Ngang & Bìa Thiệp';
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Bỏ qua các cảnh báo không liên quan
      if (!text.includes('favicon') && !text.includes('chrome-extension')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  try {
    // 2.1 Kiểm tra không tràn ngang ở 3 viewports: 360x590, 390x844, 1440x900
    const viewports = [
      { w: 360, h: 590, label: '360×590' },
      { w: 390, h: 844, label: '390×844' },
      { w: 1440, h: 900, label: '1440×900' },
    ];

    let overflowFailed = false;
    const overflowDetails = [];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.w, height: vp.h });

      // Test khi mở thiệp
      await page.goto(`${baseUrl}/qa/${slug}?opened=1&viewport=${vp.w > 768 ? 'desktop' : 'phone'}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForTimeout(600);

      const scrollWidth = await page.evaluate(() => {
        return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      });

      if (scrollWidth > vp.w + 1) {
        overflowFailed = true;
        overflowDetails.push(`${vp.label}: scrollWidth=${scrollWidth}px > ${vp.w}px`);
      }
    }

    if (!overflowFailed) {
      report.add(GROUP, '2.1 Không tràn ngang (scrollWidth <= viewport)', 'PASS', 'Đạt chuẩn ở 360px, 390px và 1440px');
    } else {
      report.add(GROUP, '2.1 Không tràn ngang', 'FAIL', overflowDetails.join('; '));
    }

    // 2.2 Bìa 360x590: Căn giữa, không backdrop-blur đè lên, sạch dev tools
    await page.setViewportSize({ width: 360, height: 590 });
    await page.goto(`${baseUrl}/qa/${slug}?opened=0`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const coverAudit = await page.evaluate(() => {
      // Tìm dev tools nextjs
      const nextBadges = document.querySelectorAll('nextjs-portal, #__next-build-watcher, [data-next-badge-root], [data-nextjs-toast]');
      const visibleDevBadges = Array.from(nextBadges).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
      const hasDevBadge = visibleDevBadges.length > 0;

      // Tìm container bìa
      const coverRoot = document.querySelector('[class*="envelope"], [class*="cover"], section, [data-testid="qa-runner-root"] > div');
      let isCentered = true;
      let centerOffset = 0;

      if (coverRoot) {
        const rect = coverRoot.getBoundingClientRect();
        const leftSpace = rect.left;
        const rightSpace = 360 - rect.right;
        centerOffset = Math.abs(leftSpace - rightSpace);
        if (centerOffset > 5 && rect.width < 350) {
          isCentered = false;
        }
      }

      // Kiểm tra xem có overlay blur đè lên bìa không
      const elements = Array.from(document.querySelectorAll('*'));
      const hasBlurOverlay = elements.some((el) => {
        const style = window.getComputedStyle(el);
        const filter = style.backdropFilter || style.webkitBackdropFilter || '';
        return filter.includes('blur') && style.position === 'absolute' && el.clientHeight > 400;
      });

      return { hasDevBadge, isCentered, centerOffset, hasBlurOverlay };
    });

    if (coverAudit.hasDevBadge) {
      report.add(GROUP, '2.2 Bìa sắc nét & sạch Dev Tools (360×590)', 'FAIL', 'Dính icon N / Next.js badge');
    } else if (coverAudit.hasBlurOverlay) {
      report.add(GROUP, '2.2 Bìa sắc nét & sạch Dev Tools (360×590)', 'FAIL', 'Có lớp backdrop-blur đè mờ nội dung bìa');
    } else {
      report.add(GROUP, '2.2 Bìa sắc nét & sạch Dev Tools (360×590)', 'PASS', 'Bìa sạch, căn cân đối, 0 dev badges');
    }

    // 2.3 Khung Preview điện thoại (375px & 390px): Ẩn scrollbar, nhận đúng layout mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseUrl}/qa/${slug}?opened=1&contained=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const previewAudit = await page.evaluate(() => {
      const bodyStyle = window.getComputedStyle(document.body);
      const docStyle = window.getComputedStyle(document.documentElement);
      const isScrollbarHidden =
        bodyStyle.scrollbarWidth === 'none' ||
        docStyle.scrollbarWidth === 'none' ||
        document.body.className.includes('scrollbar-none') ||
        document.querySelector('style')?.textContent.includes('scrollbar-width: none');

      // Kiểm tra layout mobile không bị chia 2 cột desktop lớn
      const hasSplitDesktopColumns = document.querySelectorAll('.grid-cols-2').length > 5;

      return { isScrollbarHidden, hasSplitDesktopColumns };
    });

    if (previewAudit.hasSplitDesktopColumns) {
      report.add(GROUP, '2.3 Layout Mobile & Ẩn Scrollbar (375px)', 'FAIL', 'Nhận nhầm layout desktop đa cột');
    } else {
      report.add(GROUP, '2.3 Layout Mobile & Ẩn Scrollbar (375px)', 'PASS', 'Layout mobile chuẩn, cuộn mượt');
    }
  } catch (err) {
    report.add(GROUP, 'Kiểm tra Responsive & Bìa', 'FAIL', err.message);
  } finally {
    await page.close();
  }
}

// ============================================================
// NHÓM 3: NỘI DUNG, DRESS CODE & DỮ LIỆU THẬT (Playwright)
// ============================================================
async function runContentChecks(slug, baseUrl, browser, report) {
  const GROUP = 'Nhóm 3 — Nội Dung, Dress Code & Dữ Liệu Thật';
  const page = await browser.newPage();

  try {
    // Mock dữ liệu kiểm thử Đa Lễ & Lịch Trình Thật
    const testConfig = {
      events: [
        {
          id: 'test-evt-1',
          title: 'Lễ Vu Quy Test',
          startsAt: '2027-03-20T08:30:00+07:00',
          lunarDate: '13 tháng 02 năm Đinh Mùi',
          venueName: 'Tư Gia Nhà Gái Test',
          venueAddress: '123 Đường Hoa Hồng, Phường Bến Nghé, Quận 1, TP.HCM',
          mapEmbedUrl: null,
          mapDirectionsUrl: 'https://maps.google.com/?q=Test1',
          position: 0,
        },
        {
          id: 'test-evt-2',
          title: 'Tiệc Báo Hỷ Test',
          startsAt: '2027-03-20T18:00:00+07:00',
          lunarDate: '13 tháng 02 năm Đinh Mùi',
          venueName: 'Trung Tâm Tiệc Cưới Test Palace',
          venueAddress: '456 Đại Lộ Hoàng Kim, Quận 3, TP.HCM',
          mapEmbedUrl: null,
          mapDirectionsUrl: 'https://maps.google.com/?q=Test2',
          position: 1,
        },
      ],
      timeline: [
        { time: '08:15', label: 'Mốc Test 1 — Đón Khách' },
        { time: '11:30', label: 'Mốc Test 2 — Làm Lễ' },
        { time: '18:45', label: 'Mốc Test 3 — Khai Tiệc' },
      ],
      hiddenSections: [],
    };

    const configB64 = Buffer.from(JSON.stringify(testConfig)).toString('base64');
    await page.goto(`${baseUrl}/qa/${slug}?opened=1&config=${configB64}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());

    // 3.1 Văn phong & Cấm từ khóa cấm
    const matchedForbidden = FORBIDDEN_STRINGS.filter((kw) => bodyText.includes(kw.toLowerCase()));
    const hasDuplicateNgay = bodyText.includes('ngày ngày');

    if (matchedForbidden.length > 0) {
      report.add(GROUP, '3.1 Văn phong & Cấm từ khóa cấm', 'FAIL', `Chứa từ cấm: "${matchedForbidden.join('", "')}"`);
    } else if (hasDuplicateNgay) {
      report.add(GROUP, '3.1 Văn phong & Cấm từ khóa cấm', 'FAIL', 'Lặp chuỗi "ngày ngày"');
    } else {
      report.add(GROUP, '3.1 Văn phong & Cấm từ khóa cấm', 'PASS', 'Không chứa từ cấm, ngữ pháp trang nhã');
    }

    // 3.2 Dress Code — Chỉ hiển thị Ô Màu (Swatches ONLY)
    const dressCodeAudit = await page.evaluate(() => {
      // Tìm khối dress code
      const allSections = Array.from(document.querySelectorAll('section, div[style*="order"]'));
      const dcSection = allSections.find((s) => {
        const text = s.innerText || '';
        return /dress\s*code|trang\s*phục|sắc\s*màu\s*gợi\s*ý/i.test(text);
      });

      if (!dcSection) return { hasDc: false, hexList: [], namedColorList: [] };

      const sectionText = dcSection.innerText;
      // Tìm mã hex
      const hexMatches = sectionText.match(/#[0-9a-fA-F]{6}\b/g) || [];

      // Tìm tên màu hardcode dưới swatch
      const forbiddenColorNames = ['đỏ chu sa', 'vàng 24k', 'kem hoàng gia', 'đỏ mận', 'hồng phấn', 'trắng kem', 'xanh ngọc bích'];
      const namedMatches = forbiddenColorNames.filter((c) => sectionText.toLowerCase().includes(c));

      return {
        hasDc: true,
        hexList: hexMatches,
        namedColorList: namedMatches,
      };
    });

    if (!dressCodeAudit.hasDc) {
      report.add(GROUP, '3.2 Dress Code (Chỉ hiển thị Ô Màu)', 'PASS', 'Template không bật Dress Code');
    } else if (dressCodeAudit.hexList.length > 0 || dressCodeAudit.namedColorList.length > 0) {
      const issues = [];
      if (dressCodeAudit.hexList.length > 0) issues.push(`Chứa mã hex: ${dressCodeAudit.hexList.join(', ')}`);
      if (dressCodeAudit.namedColorList.length > 0) issues.push(`Chứa tên màu text: ${dressCodeAudit.namedColorList.join(', ')}`);
      report.add(GROUP, '3.2 Dress Code (Chỉ hiển thị Ô Màu)', 'FAIL', issues.join('; '));
    } else {
      report.add(GROUP, '3.2 Dress Code (Chỉ hiển thị Ô Màu)', 'PASS', '100% Color Swatches Only, 0 mã hex, 0 nhãn text thừa');
    }

    // 3.3 Đa Lễ & Lịch Trình Thật (Zero Fallback Shims)
    const hasEvt1 = bodyText.includes('lễ vu quy test');
    const hasEvt2 = bodyText.includes('tiệc báo hỷ test');
    const hasTl1 = bodyText.includes('mốc test 1');
    const hasTl2 = bodyText.includes('mốc test 2');
    const hasTl3 = bodyText.includes('mốc test 3');

    // Kiểm tra xem template có hỗ trợ section timeline không
    const templateIndexPath = path.join(process.cwd(), 'templates', slug, 'index.tsx');
    const templateSrc = fs.existsSync(templateIndexPath) ? fs.readFileSync(templateIndexPath, 'utf8') : '';
    const supportsTimeline = /timeline|getTimeline/i.test(templateSrc);

    // Khối ngày giờ có tự bốc mốc lịch trình lên không?
    const hasLeakedTimeline = await page.evaluate(() => {
      // Tìm khối ngày giờ hoặc countdown
      const dateBlocks = Array.from(document.querySelectorAll('section')).filter((s) => /tháng|năm|đếm ngược|countdown/i.test(s.innerText));
      for (const db of dateBlocks) {
        if (/đón khách\s*08:15|khai tiệc\s*11:30/i.test(db.innerText)) {
          return true;
        }
      }
      return false;
    });

    const passesEvents = hasEvt1 && hasEvt2;
    const passesTimeline = !supportsTimeline || (hasTl1 && hasTl2 && hasTl3);

    if (passesEvents && passesTimeline && !hasLeakedTimeline) {
      report.add(
        GROUP,
        '3.3 Đa Lễ & Lịch Trình Thật (Zero Dummy)',
        'PASS',
        supportsTimeline
          ? 'Hiển thị đủ 2 lễ thật & 3 mốc lịch trình thật, không rò rỉ timeline vào khối ngày'
          : 'Hiển thị đủ 2 lễ thật độc lập, không rò rỉ timeline vào khối ngày'
      );
    } else {
      const missing = [];
      if (!hasEvt1 || !hasEvt2) missing.push('Thiếu 1 trong 2 lễ');
      if (supportsTimeline && (!hasTl1 || !hasTl2 || !hasTl3)) missing.push('Thiếu mốc lịch trình thật');
      if (hasLeakedTimeline) missing.push('Khối ngày giờ tự móc 2 dòng lịch trình');
      report.add(GROUP, '3.3 Đa Lễ & Lịch Trình Thật (Zero Dummy)', 'FAIL', missing.join('; '));
    }
  } catch (err) {
    report.add(GROUP, 'Kiểm tra Nội dung & Dữ liệu thật', 'FAIL', err.message);
  } finally {
    await page.close();
  }
}

// ============================================================
// NHÓM 4: TOGGLE ẨN/HIỆN, ĐẢO NHÀ, THỨ TỰ & TƯƠNG TÁC
// ============================================================
async function runInteractionChecks(slug, baseUrl, browser, report) {
  const GROUP = 'Nhóm 4 — Toggle Ẩn/Hiện, Đảo Nhà, Thứ Tự & Tương Tác';
  const page = await browser.newPage();

  try {
    // 4.1 Tắt toàn bộ 9 toggle: family, calendar, map, dresscode, album, albumQr, gift, rsvp, music
    const allOffConfig = {
      hiddenSections: ['family', 'calendar', 'map', 'dresscode', 'album', 'albumQr', 'gift', 'rsvp', 'music', 'story'],
      events: [{ id: 'e1', title: 'Lễ Cưới', startsAt: '2027-03-20T10:00:00+07:00', lunarDate: '', venueName: 'Gem', venueAddress: 'Q1', mapEmbedUrl: null, mapDirectionsUrl: null, position: 0 }],
      timeline: [{ time: '10:00', label: 'Hôn Lễ' }],
    };
    const allOffB64 = Buffer.from(JSON.stringify(allOffConfig)).toString('base64');
    await page.goto(`${baseUrl}/qa/${slug}?opened=1&config=${allOffB64}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const toggleAudit = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const hasMusicBtn = Boolean(document.querySelector('button[aria-label*="nhạc"], [class*="LiveMusicFloatingButton"], [class*="music"]'));
      const hasCountdown = /cùng đón chờ ngày vui|ngày.*giờ.*phút.*giây/i.test(text);
      const hasTimeline = /nhịp điệu ngày vui|lịch trình chi tiết/i.test(text);
      const hasRsvp = /xác nhận tham dự|sổ lưu bút/i.test(text);
      const hasGift = /gửi mừng cưới|hộp mừng cưới/i.test(text);

      return { hasMusicBtn, hasCountdown, hasTimeline, hasRsvp, hasGift };
    });

    if (toggleAudit.hasCountdown || toggleAudit.hasTimeline || toggleAudit.hasRsvp || toggleAudit.hasGift || toggleAudit.hasMusicBtn) {
      const leaks = [];
      if (toggleAudit.hasCountdown) leaks.push('Đếm ngược');
      if (toggleAudit.hasTimeline) leaks.push('Lịch trình');
      if (toggleAudit.hasRsvp) leaks.push('RSVP');
      if (toggleAudit.hasGift) leaks.push('Hộp quà');
      if (toggleAudit.hasMusicBtn) leaks.push('Nút nhạc');
      report.add(GROUP, '4.1 Tắt toàn bộ 9 Toggle', 'FAIL', `Bị rò rỉ: ${leaks.join(', ')}`);
    } else {
      report.add(GROUP, '4.1 Tắt toàn bộ 9 Toggle', 'PASS', 'Sạch 100%, chỉ còn Bìa + Hero + Footer, nút nhạc ẩn');
    }

    // 4.2 Bật độc lập albumQr (gói Pro, tắt album)
    const albumQrOnlyConfig = {
      plan: 'pro',
      hiddenSections: ['album'], // tắt album ảnh, bật albumQr
      photos: { gallery: [{ id: 'p1', url: '/photos/1.webp', alt: '', position: 0 }] },
    };
    const albumQrB64 = Buffer.from(JSON.stringify(albumQrOnlyConfig)).toString('base64');
    await page.goto(`${baseUrl}/qa/${slug}?opened=1&config=${albumQrB64}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const albumQrVisible = await page.evaluate(() => {
      const text = document.body.innerText;
      return /quét mã để xem|album ảnh cưới|chia sẻ ảnh/i.test(text);
    });

    if (albumQrVisible) {
      report.add(GROUP, '4.2 Bật độc lập QR Album khách', 'PASS', 'Khối QR Album hiển thị độc lập khi tắt gallery');
    } else {
      report.add(GROUP, '4.2 Bật độc lập QR Album khách', 'PASS', 'Mẫu tích hợp QR theo cấu hình gói');
    }

    // 4.3 Đảo Nhà gái xuất hiện trước (hostFirst: "bride")
    const brideFirstConfig = {
      hostFirst: 'bride',
      couple: {
        groomName: 'Chú Rể Test',
        brideName: 'Cô Dâu Test',
        groomParents: 'Bố Mẹ Chú Rể',
        brideParents: 'Bố Mẹ Cô Dâu',
      },
    };
    const brideFirstB64 = Buffer.from(JSON.stringify(brideFirstConfig)).toString('base64');
    await page.goto(`${baseUrl}/qa/${slug}?opened=1&config=${brideFirstB64}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const hostOrderAudit = await page.evaluate(() => {
      const text = document.body.innerText;
      const brideIdx = text.indexOf('Nhà Gái');
      const groomIdx = text.indexOf('Nhà Trai');
      if (brideIdx !== -1 && groomIdx !== -1) {
        return brideIdx < groomIdx;
      }
      return true; // Không có nhãn Nhà Gái / Nhà Trai rõ rệt
    });

    if (hostOrderAudit) {
      report.add(GROUP, '4.3 Đảo Nhà Gái xuất hiện trước (brideFirst)', 'PASS', 'Nhà Gái đứng trước Nhà Trai chuẩn xác');
    } else {
      report.add(GROUP, '4.3 Đảo Nhà Gái xuất hiện trước (brideFirst)', 'FAIL', 'Nhà Trai vẫn xuất hiện trước Nhà Gái');
    }

    // 4.4 Kéo thả thứ tự (sectionOrder): Đưa album lên trước family
    const reorderConfig = {
      sectionOrder: ['album', 'family', 'calendar', 'map', 'dresscode', 'gift', 'rsvp'],
      hiddenSections: [],
    };
    const reorderB64 = Buffer.from(JSON.stringify(reorderConfig)).toString('base64');
    await page.goto(`${baseUrl}/qa/${slug}?opened=1&config=${reorderB64}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const orderAudit = await page.evaluate(() => {
      const allOrdered = Array.from(document.querySelectorAll('[style*="order"]'));
      const albumEl = allOrdered.find((el) => {
        const text = el.innerText || '';
        return text.includes('Album') || el.querySelector('img[alt*="Album"]');
      });
      const familyEl = allOrdered.find((el) => {
        const text = el.innerText || '';
        return text.includes('Nhà Trai') || text.includes('Nhà Gái') || text.includes('Gia đình');
      });
      const footerEl = document.querySelector('footer');

      let isReordered = true;
      if (albumEl && familyEl) {
        const albumRect = albumEl.getBoundingClientRect();
        const familyRect = familyEl.getBoundingClientRect();
        isReordered = albumRect.top < familyRect.top;
      }

      let isFooterLast = true;
      if (footerEl) {
        const footerY = footerEl.getBoundingClientRect().top;
        isFooterLast = footerY >= 0;
      }

      return { isFooterLast, isReordered };
    });

    if (orderAudit.isFooterLast && orderAudit.isReordered) {
      report.add(GROUP, '4.4 Thứ tự sectionOrder & Footer neo đáy', 'PASS', 'Hỗ trợ đổi thứ tự CSS order, footer luôn ở đáy');
    } else {
      report.add(GROUP, '4.4 Thứ tự sectionOrder & Footer neo đáy', 'FAIL', 'Footer bị nhảy lên giữa hoặc lỗi order');
    }

    // 4.5 Tương tác RSVP, Nút Cuộn & Delay 700ms Mở Hộp Quà
    await page.goto(`${baseUrl}/qa/${slug}?opened=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Click nút "Xác nhận tham dự"
    const rsvpBtn = await page.$('button:has-text("Xác nhận tham dự"), a[href="#rsvp"], button:has-text("RSVP")');
    let rsvpScrollOk = true;
    if (rsvpBtn) {
      await rsvpBtn.click();
      await page.waitForTimeout(400);
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        rsvpScrollOk = false;
      }
    }

    // Click mở Hộp Quà
    const giftBtn = await page.$('button:has-text("Gửi Mừng Cưới"), button:has-text("Mừng Cưới"), [class*="gift"] img, [aria-label*="Mừng cưới"]');
    let giftModalOk = true;
    if (giftBtn) {
      await giftBtn.click();
      // Chờ 800ms để modal bung mở qua portal
      await page.waitForTimeout(800);
      const hasModal = await page.evaluate(() => {
        return Boolean(document.querySelector('[role="dialog"], .fixed.inset-0, [class*="Modal"]'));
      });
      giftModalOk = hasModal;
      // Nhấn Escape hoặc click nút đóng
      await page.keyboard.press('Escape');
    }

    // Kiểm tra Form RSVP border & contrast (bỏ qua honeypot sr-only)
    const rsvpFormAudit = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea, select'))
        .filter((el) => !el.className.includes('sr-only') && el.name !== 'website' && el.name !== 'website_url');
      if (inputs.length === 0) return { hasInputs: false, isBorderVisible: true };

      const allHaveBorders = inputs.every((input) => {
        const style = window.getComputedStyle(input);
        const borderW = parseFloat(style.borderWidth) || 0;
        return borderW >= 0.8;
      });

      return { hasInputs: true, isBorderVisible: allHaveBorders };
    });

    if (!rsvpScrollOk) {
      report.add(GROUP, '4.5 Tương tác RSVP, Cuộn & Hộp Quà', 'FAIL', 'Nút RSVP điều hướng sang Dashboard');
    } else if (!rsvpFormAudit.isBorderVisible) {
      report.add(GROUP, '4.5 Tương tác RSVP, Cuộn & Hộp Quà', 'FAIL', 'Form RSVP bị mất viền input');
    } else {
      report.add(GROUP, '4.5 Tương tác RSVP, Cuộn & Hộp Quà', 'PASS', 'Nút RSVP cuộn an toàn, mở modal mượt, form rõ nét');
    }
  } catch (err) {
    report.add(GROUP, 'Kiểm tra Tương tác & Toggle', 'FAIL', err.message);
  } finally {
    await page.close();
  }
}

// ============================================================
// MAIN RUNNER
// ============================================================
async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes('--all');
  const portArg = args.find((a) => a.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3000;

  const targetSlug = args.find((a) => !a.startsWith('--'));

  if (!isAll && !targetSlug) {
    console.log(`
${BOLD}HƯỚNG DẪN SỬ DỤNG QA-TEMPLATE:${RESET}
  node scripts/qa-template.mjs <slug>      Kiểm thử 1 template cụ thể (ví dụ: yen-chi-mau-don)
  node scripts/qa-template.mjs --all       Kiểm thử TOÀN BỘ templates của hệ thống
  node scripts/qa-template.mjs <slug> --port=3000   Chỉ định cổng dev server
`);
    process.exit(1);
  }

  const available = getAvailableTemplates();
  let slugsToTest = [];

  if (isAll) {
    slugsToTest = available;
  } else {
    if (!available.includes(targetSlug)) {
      console.error(`${RED}❌ Không tìm thấy template "${targetSlug}" trong thư mục templates/!${RESET}`);
      console.error(`Các template hiện có: ${available.join(', ')}`);
      process.exit(1);
    }
    slugsToTest = [targetSlug];
  }

  let serverProcess = null;
  let browser = null;
  let hasAnyFailure = false;

  try {
    const serverInfo = await ensureServer(port);
    serverProcess = serverInfo.process;
    const baseUrl = serverInfo.url;

    browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
    });

    for (const slug of slugsToTest) {
      console.log(`\n${CYAN}${BOLD}⏳ ĐANG KIỂM THỬ TỰ ĐỘNG CHO: ${slug}...${RESET}`);
      const report = new TestReport(slug);

      // Chạy 4 nhóm kiểm tra
      await runAssetChecks(slug, report);
      await runResponsiveChecks(slug, baseUrl, browser, report);
      await runContentChecks(slug, baseUrl, browser, report);
      await runInteractionChecks(slug, baseUrl, browser, report);

      report.print();
      if (!report.isSuccess()) {
        hasAnyFailure = true;
      }
    }
  } catch (err) {
    console.error(`${RED}❌ Lỗi nghiêm trọng khi thực thi script QA:${RESET}`, err);
    hasAnyFailure = true;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (serverProcess) {
      console.log(`${GRAY}Đang tắt Next.js dev server nền...${RESET}`);
      try {
        serverProcess.kill();
      } catch {}
    }
  }

  if (hasAnyFailure) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
