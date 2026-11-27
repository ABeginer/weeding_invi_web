import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDesignerInviteValues } from "../lib/designer-invite.ts";

describe("designer multi-event and interactive blocks mapping", () => {
  it("định dạng chính xác nhiều sự kiện (lên tới 3 lễ) kèm map URL và ngày tháng", () => {
    const values = buildDesignerInviteValues({
      groomName: "Anh Dũng",
      brideName: "Thanh Mai",
      dateIso: "2027-03-20T11:00:00+07:00",
      events: [
        {
          title: "LỄ VU QUY",
          startsAt: "2027-03-20T08:30:00+07:00",
          venueName: "Tư gia Nhà Gái",
          venueAddress: "123 Đường Hoa Hồng, Quận 1, TP.HCM",
          lunarDate: "13 tháng 2 năm Đinh Mùi",
        },
        {
          title: "TIỆC CƯỚI",
          startsAt: "2027-03-20T18:00:00+07:00",
          venueName: "Trung tâm White Palace",
          venueAddress: "194 Hoàng Văn Thụ, Phú Nhuận, TP.HCM",
          mapDirectionsUrl: "https://maps.google.com/?q=white+palace",
        },
      ],
      hasGifts: true,
      hasPhotos: true,
      photoCount: 12,
      hasMusic: true,
      musicTitle: "A Thousand Years",
      musicUrl: "/media/wedding.mp3",
    });

    assert.equal(values.eventsCount, "2");

    // Lễ 1
    assert.equal(values.event_0_title, "LỄ VU QUY");
    assert.equal(values.event_0_venueName, "Tư gia Nhà Gái");
    assert.equal(values.event_0_lunar, "13 tháng 2 năm Đinh Mùi");
    assert.equal(values.event_0_time, "08:30");
    assert.equal(values.event_0_day, "20");
    assert.equal(values.event_0_month, "03");
    assert.equal(values.event_0_year, "2027");
    assert.ok(values.event_0_mapUrl.includes("google.com/maps"));

    // Lễ 2
    assert.equal(values.event_1_title, "TIỆC CƯỚI");
    assert.equal(values.event_1_venueName, "Trung tâm White Palace");
    assert.equal(values.event_1_time, "18:00");
    assert.equal(values.event_1_mapUrl, "https://maps.google.com/?q=white+palace");

    // Interactive blocks flags
    assert.equal(values.hasGifts, "true");
    assert.equal(values.hasPhotos, "true");
    assert.equal(values.photoCount, "12");
    assert.equal(values.hasMusic, "true");
    assert.equal(values.musicTitle, "A Thousand Years");
    assert.equal(values.musicUrl, "/media/wedding.mp3");

    // Backward compatibility
    assert.equal(values.eventTitle, "LỄ VU QUY");
    assert.equal(values.eventVenueName, "Tư gia Nhà Gái");
    assert.ok(values.venue.includes("Tư gia Nhà Gái"));
    assert.ok(values.venue2.includes("White Palace"));
  });

  it("xử lý an toàn khi không có sự kiện nào hoặc chỉ có 1 sự kiện", () => {
    const valuesNoEvents = buildDesignerInviteValues({
      groomName: "Văn A",
      brideName: "Thị B",
      events: [],
      hasGifts: false,
      hasPhotos: false,
    });
    assert.equal(valuesNoEvents.eventsCount, "0");
    assert.equal(valuesNoEvents.eventTitle, "LỄ THÀNH HÔN");
    assert.equal(valuesNoEvents.hasGifts, "false");
    assert.equal(valuesNoEvents.hasPhotos, "false");
    assert.equal(valuesNoEvents.photoCount, "0");

    const valuesOneEvent = buildDesignerInviteValues({
      groomName: "Văn A",
      brideName: "Thị B",
      events: [
        {
          title: "LỄ THÀNH HÔN",
          venueName: "Khách sạn Mường Thanh",
          venueAddress: "Đà Nẵng",
        },
      ],
    });
    assert.equal(valuesOneEvent.eventsCount, "1");
    assert.equal(valuesOneEvent.event_0_title, "LỄ THÀNH HÔN");
    assert.equal(valuesOneEvent.event_0_venueName, "Khách sạn Mường Thanh");
    assert.equal(valuesOneEvent.venue2, "");
  });
});
