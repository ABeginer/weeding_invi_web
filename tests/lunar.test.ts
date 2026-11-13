import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  convertLunarToSolar,
  convertSolarToLunar,
  isValidSolarDate,
} from "../lib/lunar.ts";

interface LunarTestCaseRow {
  solar: string; // YYYY-MM-DD
  lunar: string; // DD/MM/YYYY
  isLeap: boolean;
  yearCanChi?: string;
}

function parseLunarTestCasesMarkdown(markdown: string): LunarTestCaseRow[] {
  const rows: LunarTestCaseRow[] = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 3) continue;
    const solarCell = cells[0];
    const lunarCell = cells[1];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(solarCell)) continue;
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(lunarCell)) continue;

    const leapText = (cells[2] ?? "").toLowerCase();
    const isLeap =
      leapText.includes("nhuận") ||
      leapText === "có" ||
      leapText === "true" ||
      leapText === "1";

    rows.push({
      solar: solarCell,
      lunar: lunarCell,
      isLeap,
      yearCanChi: cells[3] || undefined,
    });
  }
  return rows;
}

describe("lib/lunar.ts — Chuyển đổi Âm Dương lịch Việt Nam (UTC+7)", () => {
  it("Kiểm tra biên năm hợp lệ và từ chối ngày/tháng nhuận không tồn tại", () => {
    assert.equal(isValidSolarDate(15, 6, 2026), true);
    assert.equal(isValidSolarDate(29, 2, 2025), false);
    assert.equal(isValidSolarDate(1, 1, 1899), false);
    assert.equal(isValidSolarDate(1, 1, 2101), false);

    const outOfRange = convertLunarToSolar(1, 1, 1899, false);
    assert.equal(outOfRange.ok, false);

    // Năm 2026 (Bính Ngọ) không phải năm nhuận
    const invalidLeap2026 = convertLunarToSolar(15, 6, 2026, true);
    assert.equal(invalidLeap2026.ok, false);
  });

  it("Khớp hai chiều (Dương -> Âm -> Dương) trên các ngày trải đều 1950-2050", () => {
    const sampleDates: Array<[number, number, number]> = [
      [1, 1, 2000],
      [25, 7, 2025],
      [22, 3, 2023],
      [17, 2, 2026],
      [23, 5, 2020],
      [23, 6, 2028],
    ];

    for (const [dd, mm, yy] of sampleDates) {
      const lunar = convertSolarToLunar(dd, mm, yy);
      const back = convertLunarToSolar(
        lunar.lunarDay,
        lunar.lunarMonth,
        lunar.lunarYear,
        lunar.isLeapMonth,
      );
      assert.equal(back.ok, true);
      assert.deepEqual(back.result?.solar, { day: dd, month: mm, year: yy });
    }
  });

  it("Đối chiếu bảng chính thức docs/lunar-test-cases.md (khi chủ dự án đã cung cấp)", (t) => {
    const casesPath = path.resolve(process.cwd(), "docs/lunar-test-cases.md");
    if (!fs.existsSync(casesPath)) {
      t.skip(
        "Đang chờ chủ dự án cung cấp docs/lunar-test-cases.md từ hai nguồn lịch chính thống.",
      );
      return;
    }

    const content = fs.readFileSync(casesPath, "utf8");
    const cases = parseLunarTestCasesMarkdown(content);
    assert.ok(
      cases.length >= 20,
      `Bảng docs/lunar-test-cases.md cần tối thiểu 20 ngày đối chiếu (hiện có ${cases.length}).`,
    );
    assert.ok(
      cases.some((c) => c.isLeap),
      "Bảng docs/lunar-test-cases.md cần có ít nhất 1 ngày thuộc tháng nhuận.",
    );

    for (const row of cases) {
      const [yy, mm, dd] = row.solar.split("-").map(Number);
      const [lDay, lMonth, lYear] = row.lunar.split("/").map(Number);

      const toLunar = convertSolarToLunar(dd, mm, yy);
      assert.equal(toLunar.lunarDay, lDay, `Sai ngày âm cho ${row.solar}`);
      assert.equal(toLunar.lunarMonth, lMonth, `Sai tháng âm cho ${row.solar}`);
      assert.equal(toLunar.lunarYear, lYear, `Sai năm âm cho ${row.solar}`);
      assert.equal(
        toLunar.isLeapMonth,
        row.isLeap,
        `Sai trạng thái tháng nhuận cho ${row.solar}`,
      );
      if (row.yearCanChi) {
        assert.equal(toLunar.yearCanChi, row.yearCanChi);
      }

      const toSolar = convertLunarToSolar(lDay, lMonth, lYear, row.isLeap);
      assert.equal(toSolar.ok, true, `Không đổi ngược được ${row.lunar}`);
      assert.deepEqual(toSolar.result?.solar, { day: dd, month: mm, year: yy });
    }
  });
});

