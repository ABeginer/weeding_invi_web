import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getOpsHomePath,
  isOpsPathAllowed,
  isOpsRole,
  isValidOpsEmail,
  normalizeOpsEmail,
} from "../lib/ops-roles.ts";

describe("lib/ops-roles.ts", () => {
  it("chuẩn hoá email để so khớp role", () => {
    assert.equal(normalizeOpsEmail("  Admin@Example.COM "), "admin@example.com");
    assert.equal(normalizeOpsEmail(null), "");
    assert.equal(normalizeOpsEmail(undefined), "");
  });

  it("chỉ nhận email hợp lệ", () => {
    assert.equal(isValidOpsEmail("a@b.co"), true);
    assert.equal(isValidOpsEmail("  A@B.CO "), true);
    assert.equal(isValidOpsEmail("khong-phai-email"), false);
    assert.equal(isValidOpsEmail("@b.co"), false);
    assert.equal(isValidOpsEmail("a@b"), false);
    assert.equal(isValidOpsEmail(""), false);
  });

  it("chỉ nhận role admin/designer", () => {
    assert.equal(isOpsRole("admin"), true);
    assert.equal(isOpsRole("designer"), true);
    assert.equal(isOpsRole("owner"), false);
    assert.equal(isOpsRole(null), false);
  });

  it("designer chỉ vào Template và Thiết kế mẫu", () => {
    for (const path of [
      "/ops/templates",
      "/ops/templates/abc",
      "/ops/designer",
      "/ops/designer/22add87b-79d6-490c-a8b8-37f3313e077d",
      "/ops/designer/x/preview",
    ]) {
      assert.equal(isOpsPathAllowed("designer", path), true, path);
    }

    for (const path of ["/ops", "/ops/users", "/ops/roles", "/ops/orders", "/ops/audit"]) {
      assert.equal(isOpsPathAllowed("designer", path), false, path);
    }
  });

  it("admin vào được mọi path ops", () => {
    assert.equal(isOpsPathAllowed("admin", "/ops"), true);
    assert.equal(isOpsPathAllowed("admin", "/ops/users"), true);
    assert.equal(isOpsPathAllowed("admin", "/ops/roles"), true);
    assert.equal(isOpsPathAllowed("admin", "/ops/templates"), true);
  });

  it("trang mặc định theo role", () => {
    assert.equal(getOpsHomePath("admin"), "/ops");
    assert.equal(getOpsHomePath("designer"), "/ops/templates");
  });
});
