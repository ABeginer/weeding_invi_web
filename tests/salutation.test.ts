import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSalutation } from "../lib/salutation-engine.ts";
import { formatLunarDateClean } from "../lib/utils.ts";

test("formatLunarDateClean strips duplicate leading words", () => {
  assert.equal(formatLunarDateClean("Ngày 13 tháng 02 năm Đinh Mùi"), "13 tháng 02 năm Đinh Mùi");
  assert.equal(formatLunarDateClean("ngày 13 tháng 02 năm Đinh Mùi"), "13 tháng 02 năm Đinh Mùi");
  assert.equal(formatLunarDateClean("Tức ngày 13 tháng 02 năm Đinh Mùi"), "13 tháng 02 năm Đinh Mùi");
  assert.equal(formatLunarDateClean("Nhằm ngày 13 tháng 02 năm Đinh Mùi"), "13 tháng 02 năm Đinh Mùi");
  assert.equal(formatLunarDateClean("13 tháng 02 năm Đinh Mùi"), "13 tháng 02 năm Đinh Mùi");
  assert.equal(formatLunarDateClean(""), "");
  assert.equal(formatLunarDateClean(null), "");
});

test("salutation engine pronoun inference", async (t) => {
  await t.test("nhóm elder tự suy luận chú/cô/bác/dì từ tên khách", () => {
    const chu = buildSalutation({
      guestName: "Chú Bảy",
      relationshipGroup: "elder",
    });
    assert.equal(chu.guestPronoun, "Chú cùng Gia đình");
    assert.equal(chu.guestLabel, "Chú Bảy cùng Gia đình");
    assert.match(chu.zaloMessage, /^Kính gửi Chú cùng Gia đình/);
    assert.match(chu.zaloMessage, /mong chú cùng gia đình nhận lời/);

    const co = buildSalutation({
      guestName: "Cô Năm",
      relationshipGroup: "elder",
    });
    assert.equal(co.guestPronoun, "Cô cùng Gia đình");

    const bac = buildSalutation({
      guestName: "Bác Ba",
      relationshipGroup: "elder",
    });
    assert.equal(bac.guestPronoun, "Bác cùng Gia đình");

    const generic = buildSalutation({
      guestName: "Nguyễn Văn An",
      relationshipGroup: "elder",
    });
    assert.equal(generic.guestPronoun, "Bác cùng Gia đình");
  });

  await t.test("nhóm peer_formal tự suy luận anh/chị từ tên khách", () => {
    const anh = buildSalutation({
      guestName: "Anh Hoàng",
      relationshipGroup: "peer_formal",
    });
    assert.equal(anh.guestPronoun, "Anh");

    const chi = buildSalutation({
      guestName: "Chị Thảo",
      relationshipGroup: "peer_formal",
    });
    assert.equal(chi.guestPronoun, "Chị");

    const generic = buildSalutation({
      guestName: "Hoàng Nam",
      relationshipGroup: "peer_formal",
    });
    assert.equal(generic.guestPronoun, "Anh/Chị");
  });

  await t.test("ưu tiên customPronounGuest nếu được truyền", () => {
    const custom = buildSalutation({
      guestName: "Chú Bảy",
      relationshipGroup: "elder",
      customPronounGuest: "Cậu Bảy",
    });
    assert.equal(custom.guestPronoun, "Cậu Bảy");
  });
});
