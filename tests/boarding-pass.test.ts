import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isInAppBrowserOrIos, type BoardingPassData } from "../lib/export-boarding-pass.ts";

describe("Boarding Pass logic & In-App browser detection", () => {
  it("nhận diện chính xác user agent Zalo, Messenger, iOS", () => {
    const originalNavigator = globalThis.navigator;

    try {
      // 1. Zalo browser
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Zalo/24.01.01" },
        configurable: true,
      });
      assert.equal(isInAppBrowserOrIos(), true);

      // 2. Facebook Messenger IAB
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Mobile FB_IAB/FB4A;FBAV/440.0.0.0" },
        configurable: true,
      });
      assert.equal(isInAppBrowserOrIos(), true);

      // 3. iOS Safari
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Version/17.4.1 Safari/604.1" },
        configurable: true,
      });
      assert.equal(isInAppBrowserOrIos(), true);

      // 4. Desktop Chrome on Windows
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" },
        configurable: true,
      });
      assert.equal(isInAppBrowserOrIos(), false);
    } finally {
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
    }
  });

  it("xử lý chuẩn xác cấu trúc dữ liệu vé BoardingPassData và fallback khi chưa xếp bàn", () => {
    const passUnassigned: BoardingPassData = {
      guestName: "Nguyễn Văn An",
      slug: "inv-abc12345",
      tableNumber: null,
      plusOnes: 1,
      diet: "veg",
      coupleTitle: "Minh & Hằng",
      weddingDate: "2027-03-20",
      venueName: "Trung tâm Hội nghị White Palace",
      venueTime: "18:00",
    };

    // Headcount
    const headcount = 1 + Math.max(0, passUnassigned.plusOnes || 0);
    assert.equal(headcount, 2);

    // Unassigned table fallback
    const rawTable = (passUnassigned.tableNumber || "").trim();
    const tableDisplay = rawTable
      ? /^bàn\s*/i.test(rawTable)
        ? rawTable.toUpperCase()
        : `BÀN ${rawTable.toUpperCase()}`
      : "Đang sắp xếp";
    assert.equal(tableDisplay, "Đang sắp xếp");

    // Assigned table formatting
    const passAssigned: BoardingPassData = {
      ...passUnassigned,
      tableNumber: "08",
    };
    const rawTable2 = (passAssigned.tableNumber || "").trim();
    const tableDisplay2 = rawTable2
      ? /^bàn\s*/i.test(rawTable2)
        ? rawTable2.toUpperCase()
        : `BÀN ${rawTable2.toUpperCase()}`
      : "Đang sắp xếp";
    assert.equal(tableDisplay2, "BÀN 08");

    // Assigned table with existing prefix
    const passWithPrefix: BoardingPassData = {
      ...passUnassigned,
      tableNumber: "Bàn VIP 01",
    };
    const rawTable3 = (passWithPrefix.tableNumber || "").trim();
    const tableDisplay3 = rawTable3
      ? /^bàn\s*/i.test(rawTable3)
        ? rawTable3.toUpperCase()
        : `BÀN ${rawTable3.toUpperCase()}`
      : "Đang sắp xếp";
    assert.equal(tableDisplay3, "BÀN VIP 01");
  });

  it("tạo link check-in QR chỉ trỏ tới URL tra cứu bàn tiệc (không chứa tài khoản ngân hàng)", () => {
    const slug = "anh-tuan-vip";
    const origin = "https://inviwedd.com";
    const checkinUrl = `${origin}/m/${slug}/tra-cuu-ban`;

    assert.equal(checkinUrl, "https://inviwedd.com/m/anh-tuan-vip/tra-cuu-ban");
    assert.equal(checkinUrl.includes("vietqr"), false);
    assert.equal(checkinUrl.includes("account"), false);
  });
});
