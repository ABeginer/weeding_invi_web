import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveDesignerText } from "../lib/designer-text.ts";

describe("designer placeholder resolution", () => {
  it("keeps fixed text unchanged", () => {
    assert.equal(resolveDesignerText("Lời mời", null, {}), "Lời mời");
  });

  it("uses the owner-provided guest name", () => {
    assert.equal(
      resolveDesignerText("Bạn Thanh Mai", "guestName", { guestName: "Chú Bảy" }),
      "Chú Bảy",
    );
  });

  it("falls back to the sample value when data is missing", () => {
    assert.equal(
      resolveDesignerText("Bạn Thanh Mai", "guestName", {}),
      "Bạn Thanh Mai",
    );
    assert.equal(
      resolveDesignerText("20.03.2027", "date", { date: "   " }),
      "20.03.2027",
    );
  });

  it("keeps the text for an unknown placeholder id", () => {
    assert.equal(
      resolveDesignerText("Giữ nguyên", "khong-ton-tai", { "khong-ton-tai": "x" }),
      "Giữ nguyên",
    );
  });
});
