import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractGuestSlugFromQr,
  calculateTableOccupancy,
  formatCheckInTime,
  type GuestCheckInItem,
} from "../lib/checkin-utils.ts";

describe("Mobile QR Check-in & Table Occupancy utils", () => {
  it("trích xuất chính xác slug khách mời từ các định dạng mã QR khác nhau", () => {
    // 1. URL Boarding Pass tra cứu bàn
    assert.equal(
      extractGuestSlugFromQr("https://inviwedd.com/m/anh-tuan-vip/tra-cuu-ban"),
      "anh-tuan-vip",
    );

    // 2. URL có query params
    assert.equal(
      extractGuestSlugFromQr("https://inviwedd.com/m/chi-mai-01/tra-cuu-ban?ref=qr"),
      "chi-mai-01",
    );

    // 3. URL thiệp mời ngắn
    assert.equal(
      extractGuestSlugFromQr("https://inviwedd.com/m/chu-ba-ho-hang"),
      "chu-ba-ho-hang",
    );

    // 4. URL /invite/:slug
    assert.equal(
      extractGuestSlugFromQr("https://inviwedd.com/invite/ban-than-09"),
      "ban-than-09",
    );

    // 5. Đường dẫn tương đối
    assert.equal(
      extractGuestSlugFromQr("/m/khach-moi-123/tra-cuu-ban"),
      "khach-moi-123",
    );

    // 6. Mã code thô hoặc kèm dấu #
    assert.equal(extractGuestSlugFromQr("#INV-ABC999"), "INV-ABC999");
    assert.equal(extractGuestSlugFromQr("guest-slug-99"), "guest-slug-99");

    // 7. Chuỗi rỗng hoặc không hợp lệ
    assert.equal(extractGuestSlugFromQr(""), null);
    assert.equal(extractGuestSlugFromQr("   "), null);
    assert.equal(extractGuestSlugFromQr("???"), null);
  });

  it("định dạng giờ check-in sang định dạng HH:mm giờ Việt Nam", () => {
    const iso = "2027-03-20T11:30:00.000Z"; // 11:30 UTC = 18:30 VN (UTC+7)
    const formatted = formatCheckInTime(iso);
    assert.equal(formatted, "18:30");

    assert.equal(formatCheckInTime(null), "");
    assert.equal(formatCheckInTime(undefined), "");
    assert.equal(formatCheckInTime("invalid-date"), "");
  });

  it("tính toán chính xác tiến độ khách đến và tỷ lệ lấp đầy từng bàn", () => {
    const mockGuests: GuestCheckInItem[] = [
      // Bàn 01: 2 khách (tổng 3 người), cả 2 đã đến (3 người) -> 100% -> Sẵn sàng lên cỗ
      {
        id: "g1",
        name: "Nguyễn Văn A",
        slug: "nguyen-van-a",
        status: "accepted",
        tableNumber: "Bàn 01",
        plusOnes: 1, // 2 người
        checkedInAt: "2027-03-20T11:00:00.000Z",
        checkedInCount: 2,
      },
      {
        id: "g2",
        name: "Trần Thị B",
        slug: "tran-thi-b",
        status: "accepted",
        tableNumber: "Bàn 01",
        plusOnes: 0, // 1 người
        checkedInAt: "2027-03-20T11:15:00.000Z",
        checkedInCount: 1,
      },

      // Bàn 02: 2 khách (tổng 10 người), 1 khách đã đến (8 người) -> 80% -> Sẵn sàng lên cỗ
      {
        id: "g3",
        name: "Lê Văn C (Đại gia đình)",
        slug: "le-van-c",
        status: "accepted",
        tableNumber: "02",
        plusOnes: 7, // 8 người
        checkedInAt: "2027-03-20T11:20:00.000Z",
        checkedInCount: 8,
      },
      {
        id: "g4",
        name: "Phạm Văn D",
        slug: "pham-van-d",
        status: "accepted",
        tableNumber: "Bàn 02",
        plusOnes: 1, // 2 người
        checkedInAt: null,
      },

      // Bàn 03: 1 khách (2 người), chưa đến -> 0% -> Chưa lên cỗ
      {
        id: "g5",
        name: "Hoàng Văn E",
        slug: "hoang-van-e",
        status: "pending",
        tableNumber: "Bàn 03",
        plusOnes: 1,
        checkedInAt: null,
      },

      // Khách chưa xếp bàn: 1 khách (1 người), đã đến
      {
        id: "g6",
        name: "Khách Vãng Lai",
        slug: "khach-vang-lai",
        status: "accepted",
        tableNumber: null,
        plusOnes: 0,
        checkedInAt: "2027-03-20T11:25:00.000Z",
        checkedInCount: 1,
      },

      // Khách từ chối: Bỏ qua không tính vào tổng số bàn
      {
        id: "g7",
        name: "Khách Bận",
        slug: "khach-ban",
        status: "declined",
        tableNumber: "Bàn 01",
        plusOnes: 0,
        checkedInAt: null,
      },
    ];

    const result = calculateTableOccupancy(mockGuests);

    // Tổng số khách hợp lệ (không tính declined) = 6
    assert.equal(result.totalGuests, 6);
    // Tổng số khách đã đến = 4 (g1, g2, g3, g6)
    assert.equal(result.totalArrivedGuests, 4);

    // Tổng headcount dự kiến:
    // Bàn 01: 2 + 1 = 3
    // Bàn 02: 8 + 2 = 10
    // Bàn 03: 2
    // Chưa xếp: 1
    // Tổng = 16
    assert.equal(result.totalAssignedHeadcount, 16);

    // Tổng headcount đã đến: 2 + 1 + 8 + 1 = 12
    assert.equal(result.totalArrivedHeadcount, 12);

    // Tỷ lệ tổng = 12 / 16 = 75%
    assert.equal(result.overallPercent, 75);

    // Kiểm tra từng bàn:
    // Bàn 01: 3/3 -> 100% -> isReadyForFood = true
    const b1 = result.tables.find((t) => t.tableName === "Bàn 01");
    assert.ok(b1);
    assert.equal(b1.assignedHeadcount, 3);
    assert.equal(b1.arrivedHeadcount, 3);
    assert.equal(b1.occupancyPercent, 100);
    assert.equal(b1.isReadyForFood, true);

    // Bàn 02: 8/10 -> 80% -> isReadyForFood = true
    const b2 = result.tables.find((t) => t.tableName === "Bàn 02");
    assert.ok(b2);
    assert.equal(b2.assignedHeadcount, 10);
    assert.equal(b2.arrivedHeadcount, 8);
    assert.equal(b2.occupancyPercent, 80);
    assert.equal(b2.isReadyForFood, true);

    // Bàn 03: 0/2 -> 0% -> isReadyForFood = false
    const b3 = result.tables.find((t) => t.tableName === "Bàn 03");
    assert.ok(b3);
    assert.equal(b3.assignedHeadcount, 2);
    assert.equal(b3.arrivedHeadcount, 0);
    assert.equal(b3.occupancyPercent, 0);
    assert.equal(b3.isReadyForFood, false);

    // Chưa xếp bàn: không bao giờ bật isReadyForFood
    const bUnassigned = result.tables.find((t) => t.tableName === "Chưa xếp bàn");
    assert.ok(bUnassigned);
    assert.equal(bUnassigned.isReadyForFood, false);
  });
});
