import assert from "node:assert/strict";
import test from "node:test";
import {
  addDaysToIsoDate,
  buildMilestonesWithDates,
  buildWeddingChecklistCsv,
  computeDaysRemaining,
  getTasksForScale,
} from "../lib/wedding-checklist.ts";

test("lib/wedding-checklist.ts — Checklist đếm ngược chuẩn bị đám cưới", async (t) => {
  await t.test("cộng trừ ngày ISO chính xác qua ranh giới tháng và năm", () => {
    assert.equal(addDaysToIsoDate("2027-01-10", -30), "2026-12-11");
    assert.equal(addDaysToIsoDate("2027-05-24", -7), "2027-05-17");
    assert.equal(addDaysToIsoDate("2027-05-24", 0), "2027-05-24");
  });

  await t.test("tính đủ 5 mốc đếm ngược từ ngày cưới dự kiến", () => {
    const milestones = buildMilestonesWithDates("2027-06-20");
    assert.equal(milestones.length, 5);
    assert.equal(milestones[0]?.id, "6m");
    assert.equal(milestones[4]?.dueDateDisplay, "20/06/2027");
  });

  await t.test("tính số ngày đếm ngược chính xác", () => {
    assert.equal(computeDaysRemaining("2027-05-24", "2027-05-10"), 14);
    assert.equal(computeDaysRemaining("2027-05-24", "2027-05-24"), 0);
  });

  await t.test("lọc đúng danh sách đầu việc theo quy mô tiệc", () => {
    const intimate = getTasksForScale("intimate");
    const bothSides = getTasksForScale("both_sides");
    assert.ok(bothSides.length > intimate.length);
    assert.ok(bothSides.some((task) => task.id === "m6-venue-split"));
    assert.equal(
      intimate.some((task) => task.id === "m6-venue-split"),
      false,
    );
  });

  await t.test("xuất CSV có UTF-8 BOM và chống CSV injection", () => {
    const csv = buildWeddingChecklistCsv([
      {
        milestoneLabel: "Trước 1 tháng",
        dueDateDisplay: "24/04/2027",
        title: "=CMD() Gửi thiệp",
        owner: "both",
        done: true,
        detail: "Gửi link Zalo",
      },
    ]);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes("\"'=CMD() Gửi thiệp\""));
    assert.ok(csv.includes("\"Đã xong\""));
  });
});
