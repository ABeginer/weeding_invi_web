import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyGiftInfo,
  weddingContentInputSchema,
} from "../lib/wedding-types.ts";

const BASE_CONTENT = {
  couple: {
    groomName: "Minh",
    brideName: "Lan",
    groomFullName: "",
    brideFullName: "",
    groomParents: "",
    brideParents: "",
  },
  date: "2027-03-20T10:00:00+07:00",
  quote: "",
  shareGuestName: false,
  heroPhotoId: null,
  groomPhotoId: null,
  bridePhotoId: null,
  gift: emptyGiftInfo(),
};

test("weddingContentInputSchema accepts per-wedding photo overrides", () => {
  const result = weddingContentInputSchema.safeParse({
    ...BASE_CONTENT,
    designerOverrides: {
      photo: {
        xPct: 10,
        yPct: 20,
        imageScale: 1.2,
        imageX: 5,
        imageY: -5,
        imageUrl: "data:image/webp;base64,AAAA",
      },
      text: { text: "Tên đã chỉnh" },
    },
  });
  assert.equal(result.success, true);
});

test("weddingContentInputSchema rejects out-of-range frame coordinates", () => {
  const result = weddingContentInputSchema.safeParse({
    ...BASE_CONTENT,
    designerOverrides: { photo: { xPct: 101 } },
  });
  assert.equal(result.success, false);
});
