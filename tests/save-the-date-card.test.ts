import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSaveTheDateCaption,
  computeWeddingCountdown,
  formatWeddingDateLine,
  parseIsoDateParts,
} from "../lib/save-the-date-card.ts";

describe("save-the-date-card helpers", () => {
  it("parses strict valid calendar dates and rejects invalid days", () => {
    assert.deepEqual(parseIsoDateParts("2026-12-20"), {
      year: 2026,
      month: 12,
      day: 20,
    });
    assert.equal(parseIsoDateParts("2026-02-30"), null);
    assert.equal(parseIsoDateParts("20-12-2026"), null);
  });

  it("computes upcoming, today, and past countdown badges accurately", () => {
    const upcoming = computeWeddingCountdown("2026-12-20", "2026-11-27");
    assert.equal(upcoming.kind, "upcoming");
    assert.equal(upcoming.daysDiff, 23);
    assert.equal(upcoming.badgeText, "CÒN 23 NGÀY NỮA");

    const today = computeWeddingCountdown("2026-11-27", "2026-11-27");
    assert.equal(today.kind, "today");
    assert.equal(today.daysDiff, 0);

    const past = computeWeddingCountdown("2026-11-20", "2026-11-27");
    assert.equal(past.kind, "past");
    assert.equal(past.daysDiff, 7);
  });

  it("formats Vietnamese wedding weekday and builds matching social caption", () => {
    assert.equal(formatWeddingDateLine("2026-12-20"), "Chủ Nhật · 20.12.2026");

    const caption = buildSaveTheDateCaption(
      {
        groomName: "Minh Hoàng",
        brideName: "Thu Hà",
        weddingDate: "2026-12-20",
        venueCity: "TP. Hồ Chí Minh",
        eyebrowText: "Save the Date",
        aspect: "story-9-16",
        theme: "cream-gold",
      },
      computeWeddingCountdown("2026-12-20", "2026-11-27"),
    );

    assert.match(caption, /Còn 23 ngày nữa/);
    assert.match(caption, /Minh Hoàng & Thu Hà/);
    assert.match(caption, /TP\. Hồ Chí Minh/);
  });
});
