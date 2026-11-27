import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { chunkIds, fetchAllRows } from "../lib/server/pagination.ts";

interface Row {
  id: number;
}

function makeSource(total: number) {
  const rows: Row[] = Array.from({ length: total }, (_, index) => ({ id: index }));
  const calls: Array<[number, number]> = [];

  const query = async (from: number, to: number) => {
    calls.push([from, to]);
    return { data: rows.slice(from, to + 1), error: null };
  };

  return { rows, calls, query };
}

describe("lib/server/pagination.ts", () => {
  it("đọc hết dữ liệu qua nhiều trang 1.000 dòng", async () => {
    const source = makeSource(2_500);
    const result = await fetchAllRows<Row>(source.query);

    assert.equal(result.length, 2_500);
    assert.equal(result[0].id, 0);
    assert.equal(result[2_499].id, 2_499);
    assert.equal(source.calls.length, 3);
    assert.deepEqual(source.calls[0], [0, 999]);
    assert.deepEqual(source.calls[2], [2000, 2999]);
  });

  it("dừng khi trang trả về ít hơn pageSize", async () => {
    const source = makeSource(120);
    const result = await fetchAllRows<Row>(source.query);

    assert.equal(result.length, 120);
    assert.equal(source.calls.length, 1);
  });

  it("ném lỗi khi truy vấn lỗi", async () => {
    await assert.rejects(
      fetchAllRows<Row>(async () => ({ data: null, error: new Error("boom") })),
      /boom/,
    );
  });

  it("tôn trọng giới hạn maxRows", async () => {
    const source = makeSource(5_000);
    const result = await fetchAllRows<Row>(source.query, {
      pageSize: 1_000,
      maxRows: 2_000,
    });

    assert.equal(result.length, 2_000);
    assert.equal(source.calls.length, 2);
  });

  it("chia id thành lô để tránh URL quá dài", () => {
    const ids = Array.from({ length: 450 }, (_, index) => String(index));
    const chunks = chunkIds(ids, 200);

    assert.equal(chunks.length, 3);
    assert.equal(chunks[0].length, 200);
    assert.equal(chunks[2].length, 50);
    assert.deepEqual(chunks.flat(), ids);
  });
});
