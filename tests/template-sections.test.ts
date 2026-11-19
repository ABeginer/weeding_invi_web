import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_TEMPLATE_SECTIONS,
  getTemplateSections,
} from "../config/template-sections.ts";

describe("config/template-sections.ts", () => {
  it("QR album khách chỉ xuất hiện từ gói Pro trở lên", () => {
    assert.equal(
      getTemplateSections("do-truyen-thong", "free").sections.includes("albumQr"),
      false,
    );
    assert.equal(
      getTemplateSections("do-truyen-thong", "pro").sections.includes("albumQr"),
      true,
    );
    assert.equal(
      getTemplateSections("do-truyen-thong", "vip").sections.includes("albumQr"),
      true,
    );
  });

  it("các phần khác không bị ảnh hưởng bởi gói", () => {
    const free = getTemplateSections("basic-1", "free").sections;
    const pro = getTemplateSections("basic-1", "pro").sections;
    for (const key of ["family", "calendar", "map", "dresscode", "album", "gift", "rsvp", "music"]) {
      assert.equal(free.includes(key), true, `free thiếu ${key}`);
      assert.equal(pro.includes(key), true, `pro thiếu ${key}`);
    }
  });

  it("template mặc định có đủ phần và bật ảnh cặp đôi", () => {
    const sections = getTemplateSections("unknown-template", "pro");
    assert.deepEqual(sections.sections, DEFAULT_TEMPLATE_SECTIONS.sections);
    assert.equal(sections.couplePhotos, true);
    assert.equal(sections.hostFirst, true);
  });

  it("do-truyen-thong tắt ảnh cặp đôi nhưng vẫn giữ hostFirst", () => {
    const sections = getTemplateSections("do-truyen-thong", "pro");
    assert.equal(sections.couplePhotos, false);
    assert.equal(sections.hostFirst, true);
  });
});
