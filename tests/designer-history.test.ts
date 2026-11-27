import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createHistory,
  pushHistory,
  canUndo,
  canRedo,
  undo,
  redo,
} from "../lib/designer-history.ts";

describe("designer history stack (undo/redo)", () => {
  it("khởi tạo state ban đầu không thể undo hoặc redo", () => {
    const history = createHistory({ text: "v1" });
    assert.deepEqual(history.present, { text: "v1" });
    assert.equal(canUndo(history), false);
    assert.equal(canRedo(history), false);
  });

  it("cho phép push state mới và undo quay lại state trước", () => {
    let history = createHistory({ text: "v1" });
    history = pushHistory(history, { text: "v2" });
    history = pushHistory(history, { text: "v3" });

    assert.equal(canUndo(history), true);
    assert.equal(canRedo(history), false);
    assert.equal(history.present.text, "v3");

    // Undo lần 1 -> v2
    history = undo(history);
    assert.equal(history.present.text, "v2");
    assert.equal(canUndo(history), true);
    assert.equal(canRedo(history), true);

    // Undo lần 2 -> v1
    history = undo(history);
    assert.equal(history.present.text, "v1");
    assert.equal(canUndo(history), false);
    assert.equal(canRedo(history), true);
  });

  it("cho phép redo quay lại sau khi undo", () => {
    let history = createHistory({ count: 1 });
    history = pushHistory(history, { count: 2 });
    history = undo(history);
    assert.equal(history.present.count, 1);

    history = redo(history);
    assert.equal(history.present.count, 2);
    assert.equal(canRedo(history), false);
  });

  it("xóa tương lai khi push state mới sau khi đã undo", () => {
    let history = createHistory({ step: 1 });
    history = pushHistory(history, { step: 2 });
    history = undo(history);
    assert.equal(canRedo(history), true);

    // Push state mới rẽ nhánh
    history = pushHistory(history, { step: 3 });
    assert.equal(history.present.step, 3);
    assert.equal(canRedo(history), false);
  });

  it("không push khi dữ liệu trùng khớp", () => {
    let history = createHistory({ a: 1 });
    history = pushHistory(history, { a: 1 });
    assert.equal(history.past.length, 0);
  });

  it("giới hạn kích thước history không vượt quá limit", () => {
    let history = createHistory({ val: 0 });
    for (let i = 1; i <= 35; i++) {
      history = pushHistory(history, { val: i }, 10);
    }
    assert.equal(history.past.length, 10);
    assert.equal(history.present.val, 35);
  });
});
