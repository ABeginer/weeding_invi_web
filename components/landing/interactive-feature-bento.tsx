"use client";

import * as React from "react";
import { Camera, QrCode, Sparkles, Users } from "lucide-react";
import { buildSalutation, getRelationshipLabel, type RelationshipGroup } from "@/lib/salutation-engine";

const GROUP_OPTIONS: { value: RelationshipGroup; label: string }[] = [
  { value: "elder", label: "Bề trên / Họ hàng" },
  { value: "peer_formal", label: "Bạn bè / Đồng nghiệp" },
  { value: "close_friend", label: "Bạn thân" },
  { value: "family", label: "Gia đình" },
];

const RSVP = { accepted: 42, declined: 3, pending: 15 };
const TOTAL = RSVP.accepted + RSVP.declined + RSVP.pending;

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span>{label}</span>
        <span className="font-semibold text-text">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function InteractiveFeatureBento() {
  const [name, setName] = React.useState("Chú Bảy");
  const [relationship, setRelationship] = React.useState<RelationshipGroup>("elder");

  const salutation = buildSalutation({
    guestName: name || "Khách mời",
    relationshipGroup: relationship,
  });

  return (
    <section className="border-b border-border bg-bg py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-accent-text uppercase">
            Bảng điều khiển của bạn
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text sm:text-3xl">
            Quản lý khách mời thông minh, không cần Excel
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Thử ngay cách Inviwedd tự đổi lời mời theo vai vế và theo dõi phản hồi
            của từng khách.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4 md:col-span-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent-text">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Thử nghiệm xưng hô &amp; link Zalo
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-text">
                  Tên khách
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={40}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm text-text outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
                  />
                </label>
                <label className="block text-[11px] font-medium text-text">
                  Vai vế
                  <select
                    value={relationship}
                    onChange={(event) => setRelationship(event.target.value as RelationshipGroup)}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm text-text outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    {GROUP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-xl border border-accent/30 bg-accent-soft p-3">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-accent-text uppercase">
                  Thiệp sẽ hiển thị
                </p>
                <p className="mt-1 font-display text-base font-semibold text-text">
                  {salutation.invitePrefix}: {salutation.guestLabel}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                  {salutation.hostPronoun} · {getRelationshipLabel(relationship)}
                </p>
                <p className="mt-2 rounded-lg border border-border bg-surface p-2 text-[11px] leading-relaxed text-text">
                  {salutation.zaloMessage}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-text">
              <Users className="h-4 w-4 text-accent-text" aria-hidden="true" />
              RSVP {TOTAL} khách
            </div>
            <div className="mt-3 space-y-2">
              <Bar label="Đã xác nhận" value={RSVP.accepted} total={TOTAL} tone="bg-success-fg" />
              <Bar label="Chờ phản hồi" value={RSVP.pending} total={TOTAL} tone="bg-warning-fg" />
              <Bar label="Từ chối" value={RSVP.declined} total={TOTAL} tone="bg-danger-fg" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-surface-alt p-2">
                <p className="text-text-muted">Thực đơn mặn</p>
                <p className="font-semibold text-text">38</p>
              </div>
              <div className="rounded-lg bg-surface-alt p-2">
                <p className="text-text-muted">Thực đơn chay</p>
                <p className="font-semibold text-text">7</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-text">
              <QrCode className="h-4 w-4 text-accent-text" aria-hidden="true" />
              Boarding pass &amp; VietQR
            </div>
            <div className="mt-3 rounded-xl border border-dashed border-accent/40 p-3 text-[11px]">
              <p className="font-semibold text-text">{salutation.guestLabel}</p>
              <p className="mt-0.5 text-text-muted">2 người · Mặn</p>
              <p className="mt-1 font-display text-lg font-semibold text-accent-text">BÀN 08</p>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
              Khách quét QR tại sảnh để xem bàn và chuyển khoản mừng cưới.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-text">
              <Camera className="h-4 w-4 text-accent-text" aria-hidden="true" />
              Live QR Photo Wall
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <img
                  key={index}
                  src={`/photos/${index}.webp`}
                  alt=""
                  width={160}
                  height={160}
                  loading="lazy"
                  className="aspect-square w-full rounded-md object-cover"
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
              Khách quét mã QR tại bàn để mở album, tải ảnh chụp bằng điện thoại;
              ảnh đã duyệt sẽ xuất hiện trên màn hình chung của tiệc.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
