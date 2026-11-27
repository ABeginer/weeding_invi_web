import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBulkGuestInput } from "../lib/guest-import.ts";
import {
  autoAssignTablesByGroup,
  buildGuestListCsv,
  buildInviweddBulkTsv,
  buildSampleGuests,
  clampPlusOnes,
  clampSeatsPerTable,
  parseQuickLinesToRows,
  summarizeGuestPlan,
  type GuestPlanRow,
} from "../lib/guest-list-planner.ts";

describe("lib/guest-list-planner.ts", () => {
  it("clamps seats per table and plus-ones safely for invalid or extreme inputs", () => {
    assert.equal(clampSeatsPerTable(""), 10);
    assert.equal(clampSeatsPerTable(2), 4);
    assert.equal(clampSeatsPerTable(99), 20);
    assert.equal(clampSeatsPerTable(8.6), 9);

    assert.equal(clampPlusOnes(-3), 0);
    assert.equal(clampPlusOnes("abc"), 0);
    assert.equal(clampPlusOnes(25), 10);
  });

  it("summarizes empty guest list with zeros and no NaN", () => {
    const summary = summarizeGuestPlan([], ["vu_quy", "tiec_cuoi"], 10);
    assert.equal(summary.totalInvites, 0);
    assert.equal(summary.totalHeadcount, 0);
    assert.equal(summary.maxTablesAcrossCeremonies, 0);
    assert.equal(summary.ceremonies.length, 2);
    assert.equal(summary.ceremonies[0].baseTables, 0);
    assert.equal(summary.ceremonies[0].reserveTables, 0);
  });

  it("calculates headcount, base tables, and reserve tables per ceremony", () => {
    const guests: GuestPlanRow[] = [
      {
        id: "1",
        name: "Bác Hai",
        side: "nha_trai",
        role: "elder",
        ceremonies: ["thanh_hon", "tiec_cuoi"],
        plusOnes: 3, // 4 người
        tableLabel: "Bàn 1",
        note: "",
      },
      {
        id: "2",
        name: "Nhóm Bạn ĐH",
        side: "ban_be",
        role: "close_friend",
        ceremonies: ["tiec_cuoi"],
        plusOnes: 8, // 9 người -> Tiệc cưới 13 người => 2 bàn (10 người/bàn)
        tableLabel: "Bàn 2",
        note: "",
      },
    ];

    const summary = summarizeGuestPlan(guests, ["thanh_hon", "tiec_cuoi"], 10);
    const thanhHon = summary.ceremonies.find((c) => c.ceremony === "thanh_hon")!;
    const tiecCuoi = summary.ceremonies.find((c) => c.ceremony === "tiec_cuoi")!;

    assert.equal(thanhHon.inviteCount, 1);
    assert.equal(thanhHon.headcount, 4);
    assert.equal(thanhHon.baseTables, 1);
    assert.equal(thanhHon.reserveTables, 1);

    assert.equal(tiecCuoi.inviteCount, 2);
    assert.equal(tiecCuoi.headcount, 13);
    assert.equal(tiecCuoi.baseTables, 2);
    assert.equal(tiecCuoi.totalTablesWithReserve, 3);
  });

  it("auto-assigns tables cleanly grouped by side and seats capacity", () => {
    const guests: GuestPlanRow[] = [
      {
        id: "1",
        name: "A",
        side: "nha_trai",
        role: "elder",
        ceremonies: ["tiec_cuoi"],
        plusOnes: 4, // 5 seats -> Bàn 1
        tableLabel: "",
        note: "",
      },
      {
        id: "2",
        name: "B",
        side: "nha_trai",
        role: "elder",
        ceremonies: ["tiec_cuoi"],
        plusOnes: 5, // 6 seats (5+6 > 8) -> Bàn 2
        tableLabel: "",
        note: "",
      },
      {
        id: "3",
        name: "C",
        side: "ban_be",
        role: "close_friend",
        ceremonies: ["tiec_cuoi"],
        plusOnes: 1, // new side starts new table -> Bàn 3
        tableLabel: "",
        note: "",
      },
    ];

    const assigned = autoAssignTablesByGroup(guests, 8);
    assert.equal(assigned.find((g) => g.id === "1")?.tableLabel, "Bàn 1");
    assert.equal(assigned.find((g) => g.id === "2")?.tableLabel, "Bàn 2");
    assert.equal(assigned.find((g) => g.id === "3")?.tableLabel, "Bàn 3");
  });

  it("exports TSV compatible 100% with Inviwedd bulk guest import parser", () => {
    const sample = buildSampleGuests(["vu_quy", "thanh_hon", "tiec_cuoi"]);
    const tsv = buildInviweddBulkTsv(sample, "tiec_cuoi");
    const parsed = parseBulkGuestInput(tsv);

    assert.equal(parsed.validItems.length, sample.length);
    assert.equal(parsed.validItems[0].relationshipGroup, "family");
    assert.equal(parsed.validItems[0].tableNumber, "Bàn 1");
    assert.equal(parsed.validItems[6].relationshipGroup, "close_friend");
    assert.equal(parsed.validItems[9].relationshipGroup, "peer_formal");
  });

  it("escapes CSV cells with UTF-8 BOM and prevents formula injection", () => {
    const guests: GuestPlanRow[] = [
      {
        id: "1",
        name: '=cmd|"/C calc"!A0',
        side: "ban_be",
        role: "close_friend",
        ceremonies: ["tiec_cuoi"],
        plusOnes: 1,
        tableLabel: "Bàn 1, Tầng 2",
        note: 'Bạn "thân"',
      },
    ];
    const csv = buildGuestListCsv(guests);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes("'=cmd|"));
    assert.ok(csv.includes('"Bàn 1, Tầng 2"'));
    assert.ok(csv.includes('"Bạn ""thân"""'));
  });

  it("parses quick multiline guest text with optional roles and tables", () => {
    const rows = parseQuickLinesToRows(
      "Minh Thư\tBạn thân\tBàn 3\nAnh Khoa\n",
      ["tiec_cuoi"],
      "dong_nghiep",
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0].role, "close_friend");
    assert.equal(rows[0].side, "ban_be");
    assert.equal(rows[0].tableLabel, "Bàn 3");
    assert.equal(rows[1].side, "dong_nghiep");
    assert.equal(rows[1].role, "peer_formal");
  });
});
