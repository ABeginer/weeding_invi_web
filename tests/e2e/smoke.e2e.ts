import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { chromium, type Browser } from "playwright";

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

describe("Production E2E Smoke Suite", () => {
  let browser: Browser;

  before(async () => {
    browser = await chromium.launch();
  });

  after(async () => {
    await browser?.close();
  });

  it("Landing page tải sạch, hiển thị Coverflow và không có lỗi pageerror", async () => {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const res = await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    assert.equal(res?.status(), 200);
    await page.locator("#mau-thiep").waitFor({ state: "visible", timeout: 10_000 });
    assert.deepEqual(errors, []);
    await page.close();
  });

  it("Trang xem thử /mau/ban-sac-huong-cang chỉ có tối đa 1 nguồn audio đang phát", async () => {
    const page = await browser.newPage();
    const res = await page.goto(`${BASE_URL}/mau/ban-sac-huong-cang`, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(res?.status(), 200);

    const playingCount = await page.evaluate(() => {
      const audios = Array.from(document.querySelectorAll("audio"));
      return audios.filter((a) => !a.paused).length;
    });
    assert.ok(playingCount <= 1, `Expected <= 1 playing audio, got ${playingCount}`);
    await page.close();
  });

  it("/robots.txt trả 200 và chặn đủ các route nội bộ/riêng tư", async () => {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.ok(body.includes("Disallow: /dashboard/"));
    assert.ok(body.includes("Disallow: /ops/"));
    assert.ok(body.includes("Disallow: /share/"));
    assert.ok(body.includes("Disallow: /qa/"));
  });
});
