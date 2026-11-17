import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  collectDesignerFields,
  collectDesignerImageFields,
  collectDesignerTextFields,
} from "../lib/designer-fields.ts";
import { buildDesignerInviteValues } from "../lib/designer-invite.ts";

describe("designer dynamic fields collection", () => {
  it("trả về mảng rỗng khi canvas null hoặc không có guestField", () => {
    assert.deepEqual(collectDesignerFields(null), []);
    assert.deepEqual(collectDesignerFields(undefined), []);
    assert.deepEqual(
      collectDesignerFields({
        elements: [
          { id: "txt_1", type: "text", text: "Xin chào" },
          { id: "img_1", type: "image", url: "https://example.com/a.png" },
        ],
      }),
      [],
    );
  });

  it("thu thập đầy đủ ảnh và text có guestField, đúng kind và label", () => {
    const canvas = {
      elements: [
        {
          id: "photo_main",
          type: "photo",
          guestField: { label: "Ảnh cưới chính" },
        },
        {
          id: "txt_quote",
          type: "text",
          guestField: {
            label: "Trích dẫn tình yêu",
            kind: "textarea",
            maxLength: 300,
          },
        },
        {
          id: "txt_note",
          type: "text",
          guestField: { label: "Lời nhắn khách mời" },
        },
      ],
    };

    const fields = collectDesignerFields(canvas);
    assert.equal(fields.length, 3);

    assert.deepEqual(fields[0], {
      key: "photo_main",
      label: "Ảnh cưới chính",
      kind: "image",
      maxLength: undefined,
    });

    assert.deepEqual(fields[1], {
      key: "txt_quote",
      label: "Trích dẫn tình yêu",
      kind: "textarea",
      maxLength: 300,
    });

    assert.deepEqual(fields[2], {
      key: "txt_note",
      label: "Lời nhắn khách mời",
      kind: "text",
      maxLength: undefined,
    });
  });

  it("thu thập qua nhiều trang và loại bỏ phần tử trùng id", () => {
    const canvas = {
      pages: [
        {
          elements: [
            { id: "p1_img", type: "image", guestField: { label: "Bìa 1" } },
            { id: "shared_txt", type: "text", guestField: { label: "Trang 1" } },
          ],
        },
        {
          elements: [
            { id: "shared_txt", type: "text", guestField: { label: "Trang 2" } },
            { id: "p2_img", type: "image", guestField: {} },
          ],
        },
      ],
    };

    const fields = collectDesignerFields(canvas);
    assert.equal(fields.length, 3);
    assert.equal(fields[0].key, "p1_img");
    assert.equal(fields[1].key, "shared_txt");
    assert.equal(fields[2].key, "p2_img");
    assert.equal(fields[2].label, "Ảnh của bạn");
  });

  it("collectDesignerImageFields và collectDesignerTextFields phân loại chính xác", () => {
    const canvas = {
      elements: [
        { id: "img_1", type: "image", guestField: { label: "Ảnh 1" } },
        { id: "txt_1", type: "text", guestField: { label: "Chữ 1", kind: "text" } },
        { id: "txt_2", type: "text", guestField: { label: "Chữ 2", kind: "textarea" } },
      ],
    };

    const images = collectDesignerImageFields(canvas);
    assert.equal(images.length, 1);
    assert.equal(images[0].key, "img_1");

    const texts = collectDesignerTextFields(canvas);
    assert.equal(texts.length, 2);
    assert.equal(texts[0].key, "txt_1");
    assert.equal(texts[1].key, "txt_2");
  });
});

describe("designer dynamic values mapping", () => {
  it("chuyển đổi content.designerFields thành values map dạng field:<id>", () => {
    const values = buildDesignerInviteValues({
      groomName: "Anh Dũng",
      brideName: "Thanh Mai",
      designerFields: {
        txt_quote: "Tình yêu là khi hai trái tim cùng chung một nhịp đập.",
        img_avatar: "https://example.com/avatar.jpg",
      },
    });

    assert.equal(
      values["field:txt_quote"],
      "Tình yêu là khi hai trái tim cùng chung một nhịp đập.",
    );
    assert.equal(values["field:img_avatar"], "https://example.com/avatar.jpg");
    assert.equal(values.groom, "Anh Dũng");
  });
});
