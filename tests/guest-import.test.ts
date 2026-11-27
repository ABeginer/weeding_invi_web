import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectRoleGroup,
  parseBulkGuestInput,
} from "../lib/guest-import.ts";

describe("lib/guest-import.ts — Smart Bulk Paste", () => {
  it("nhận diện chính xác các từ khóa vai vế (RelationshipGroup)", () => {
    assert.equal(detectRoleGroup("Bạn thân"), "close_friend");
    assert.equal(detectRoleGroup("bạn"), "close_friend");
    assert.equal(detectRoleGroup("Đồng nghiệp"), "peer_formal");
    assert.equal(detectRoleGroup("cty"), "peer_formal");
    assert.equal(detectRoleGroup("Sếp"), "peer_formal");
    assert.equal(detectRoleGroup("Họ hàng"), "elder");
    assert.equal(detectRoleGroup("Bác"), "elder");
    assert.equal(detectRoleGroup("Cô Chú"), "elder");
    assert.equal(detectRoleGroup("Gia đình"), "family");
    assert.equal(detectRoleGroup("Nhà gái"), "family");
    assert.equal(detectRoleGroup(""), null);
    assert.equal(detectRoleGroup(undefined), null);
  });

  it("tách đúng tên, vai vế và số bàn từ dữ liệu dán TSV (Google Sheets / Excel)", () => {
    const raw = `Nguyễn Văn A\tBạn thân\tBàn 1
Trần Thị B\tĐồng nghiệp\tBàn 2
Lê Văn C\tHọ hàng
Phạm Thị D\tBàn 5
Hoàng Văn E`;

    const result = parseBulkGuestInput(raw);
    assert.equal(result.items.length, 5);
    assert.equal(result.validItems.length, 5);

    assert.equal(result.items[0].name, "Nguyễn Văn A");
    assert.equal(result.items[0].relationshipGroup, "close_friend");
    assert.equal(result.items[0].tableNumber, "Bàn 1");

    assert.equal(result.items[1].name, "Trần Thị B");
    assert.equal(result.items[1].relationshipGroup, "peer_formal");
    assert.equal(result.items[1].tableNumber, "Bàn 2");

    assert.equal(result.items[2].name, "Lê Văn C");
    assert.equal(result.items[2].relationshipGroup, "elder");
    assert.equal(result.items[2].tableNumber, null);

    assert.equal(result.items[3].name, "Phạm Thị D");
    assert.equal(result.items[3].relationshipGroup, null);
    assert.equal(result.items[3].tableNumber, "Bàn 5");

    assert.equal(result.items[4].name, "Hoàng Văn E");
    assert.equal(result.items[4].relationshipGroup, null);
    assert.equal(result.items[4].tableNumber, null);
  });

  it("phát hiện dòng trống, trùng khi dán và trùng đã có trong thiệp", () => {
    const raw = `Nguyễn Văn A
Nguyễn Văn A
Trần Thị B

Lê Văn C`;

    const existing = ["Lê Văn C", "Khách Cũ"];
    const result = parseBulkGuestInput(raw, existing);

    assert.equal(result.items.length, 4);
    assert.equal(result.blankSkipped, 1);
    assert.equal(result.duplicateInPasteSkipped, 1);
    assert.equal(result.duplicateExistingSkipped, 1);

    // Chỉ còn 2 tên hợp lệ mới: Nguyễn Văn A (lần đầu) và Trần Thị B
    assert.equal(result.validItems.length, 2);
    assert.deepEqual(result.validNames, ["Nguyễn Văn A", "Trần Thị B"]);
  });

  it("xử lý mượt mà danh sách lớn 200+ khách mà không bị nghẽn", () => {
    const lines: string[] = [];
    for (let i = 1; i <= 250; i++) {
      lines.push(`Khách Mời ${i}\tBạn thân\tBàn ${Math.ceil(i / 10)}`);
    }
    const raw = lines.join("\n");
    const result = parseBulkGuestInput(raw);

    assert.equal(result.items.length, 250);
    assert.equal(result.validItems.length, 250);
    assert.equal(result.items[249].name, "Khách Mời 250");
    assert.equal(result.items[249].relationshipGroup, "close_friend");
    assert.equal(result.items[249].tableNumber, "Bàn 25");
  });
});
