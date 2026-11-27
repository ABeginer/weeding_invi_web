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

  it("các phần khác không bị ảnh hưởng bởi gói trên mẫu chuẩn", () => {
    const free = getTemplateSections("do-truyen-thong", "free").sections;
    const pro = getTemplateSections("do-truyen-thong", "pro").sections;
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

  it("do-truyen-thong tắt ảnh cặp đôi & story nhưng vẫn giữ hostFirst", () => {
    const sections = getTemplateSections("do-truyen-thong", "pro");
    assert.equal(sections.couplePhotos, false);
    assert.equal(sections.hostFirst, true);
    assert.equal(sections.storySupported, false);
    assert.equal(sections.sections.includes("story"), false);
  });

  it("toàn bộ 5 mẫu Hồng Kông Standard và mot-thoi-de-nho bật storySupported; couplePhotos khớp thực tế", () => {
    assert.equal(getTemplateSections("mot-thoi-de-nho", "pro").storySupported, true);
    assert.equal(getTemplateSections("mot-thoi-de-nho", "pro").sections.includes("story"), true);
    for (const hkId of [
      "ban-sac-huong-cang",
      "cuu-long-hy-yen",
      "da-anh-huong-cang",
      "hao-quang-huong-cang",
      "huong-cang-dem-neon",
    ]) {
      const cfg = getTemplateSections(hkId, "pro");
      assert.equal(cfg.storySupported, true, `${hkId} thiếu storySupported`);
      assert.equal(cfg.timelineEditor, true, `${hkId} thiếu timelineEditor`);
      assert.equal(cfg.couplePhotos, true, `${hkId} thiếu couplePhotos`);
      assert.equal(cfg.hostFirst, true, `${hkId} thiếu hostFirst`);
      assert.equal(cfg.sections.includes("story"), true, `${hkId} thiếu section story`);
    }
    const nkmyCfg = getTemplateSections("nhat-ky-mua-yeu", "pro");
    assert.equal(nkmyCfg.storySupported, true);
    assert.equal(nkmyCfg.couplePhotos, true);
    assert.equal(nkmyCfg.hostFirst, true);
    assert.equal(nkmyCfg.timelineEditor, false);
    assert.equal(nkmyCfg.sections.includes("story"), true);
    assert.equal(getTemplateSections("bach-lan-lua-nga", "pro").couplePhotos, true);
    assert.equal(getTemplateSections("song-hy-v2-do", "pro").couplePhotos, true);
    assert.equal(getTemplateSections("vuon-o-liu", "pro").reorderable, false);
  });
});
