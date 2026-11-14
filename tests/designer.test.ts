import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDesignerInviteValues,
  buildDesignerVenueLabel,
  getDesignerUpdateVersion,
} from "../lib/designer-invite.ts";
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

  it("để trống thay vì dùng giá trị mẫu trên thiệp thật", () => {
    assert.equal(resolveDesignerText("Bạn Thanh Mai", "guestName", {}, false), "");
    assert.equal(
      resolveDesignerText("White Palace", "venue", { venue: "  " }, false),
      "",
    );
    assert.equal(
      resolveDesignerText("Bạn Thanh Mai", "guestName", { guestName: "Chú Bảy" }, false),
      "Chú Bảy",
    );
  });
});

describe("designer invite values", () => {
  it("ghép tên, ngày, địa điểm và xưng hô từ dữ liệu thật", () => {
    assert.deepEqual(
      buildDesignerInviteValues({
        groomName: " Minh ",
        brideName: "Thảo Nguyên",
        dateLabel: "20.03.2027",
        events: [
          {
            venueName: "White Palace",
            venueAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
          },
        ],
        guestName: "Chị Hoa",
        salutation: "Trân trọng kính mời",
      }),
      {
        groom: "Minh",
        bride: "Thảo Nguyên",
        date: "20.03.2027",
        venue: "White Palace, TP.HCM",
        guestName: "Chị Hoa",
        salutation: "Trân trọng kính mời",
      },
    );
  });

  it("không bịa địa điểm/ngày khi thiệp chưa có dữ liệu", () => {
    const values = buildDesignerInviteValues({
      groomName: "Minh",
      brideName: "Lan",
      dateLabel: "",
      events: [],
    });
    assert.equal(values.venue, "");
    assert.equal(values.date, "");
    assert.equal(values.salutation, "");
  });

  it("venue lấy địa danh cuối và tránh lặp tên địa điểm", () => {
    assert.equal(
      buildDesignerVenueLabel({
        venueName: "TP.HCM",
        venueAddress: "Quận 1, TP.HCM",
      }),
      "TP.HCM",
    );
    assert.equal(
      buildDesignerVenueLabel({
        venueName: "Tư gia nhà gái",
        venueAddress: "12 Lê Lợi",
      }),
      "Tư gia nhà gái",
    );
    assert.equal(
      buildDesignerVenueLabel({ venueAddress: "12 Lê Lợi, Đà Nẵng" }),
      "12 Lê Lợi, Đà Nẵng",
    );
    assert.equal(buildDesignerVenueLabel(null), "");
  });
});

describe("designer version pinning", () => {
  it("chỉ đề xuất cập nhật khi mẫu có bản mới hơn", () => {
    assert.equal(getDesignerUpdateVersion(2, 5), 5);
    assert.equal(getDesignerUpdateVersion(5, 5), null);
    assert.equal(getDesignerUpdateVersion(5, 4), null);
    assert.equal(getDesignerUpdateVersion(null, 5), null);
    assert.equal(getDesignerUpdateVersion(2, null), null);
  });
});
