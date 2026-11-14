"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { buildSalutation, getRelationshipLabel, type RelationshipGroup } from "@/lib/salutation-engine";

const RELATIONSHIPS: { value: RelationshipGroup; label: string }[] = [
  { value: "elder", label: "Ông bà / Cô chú / Bề trên" },
  { value: "family", label: "Gia đình họ hàng" },
  { value: "peer_formal", label: "Sếp / Đồng nghiệp" },
  { value: "close_friend", label: "Bạn thân / Bạn đại học" },
];

function formatDate(value: string): string {
  if (!value) return "";
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return value;
  return `${timePart ? `${timePart} · ` : ""}${d}/${m}/${y}`;
}

export function ZaloInviteGenerator() {
  const [couple, setCouple] = React.useState("");
  const [dateTime, setDateTime] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [guestName, setGuestName] = React.useState("");
  const [relationship, setRelationship] = React.useState<RelationshipGroup>("peer_formal");
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const salutation = buildSalutation({ guestName: guestName || "Quý khách", relationshipGroup: relationship });
  const coupleLabel = couple.trim() || "Cô dâu & Chú rể";
  const dateLabel = formatDate(dateTime);
  const place = venue.trim() || "địa điểm tổ chức";

  const options = React.useMemo(() => {
    const formal = `${salutation.zaloMessage}${dateLabel ? `\nThời gian: ${dateLabel}.` : ""}${place ? `\nĐịa điểm: ${place}.` : ""}\n${coupleLabel}`;
    const warm = `Kính mời ${salutation.guestPronoun.toLowerCase()} ${guestName || "quý khách"} đến chung vui ngày vui của ${coupleLabel}.${dateLabel ? ` ${dateLabel},` : ""} tại ${place}. Rất mong được đón tiếp ${salutation.guestPronoun.toLowerCase()}! 💌`;
    const short = `Thân mời ${guestName || "bạn"} tới dự tiệc cưới của ${coupleLabel}${dateLabel ? ` vào ${dateLabel}` : ""}${place ? ` tại ${place}` : ""}. Nhớ xác nhận giúp mình nhé!`;
    return [
      { title: "Trang trọng", body: formal },
      { title: "Ấm áp", body: warm },
      { title: "Ngắn gọn", body: short },
    ];
  }, [coupleLabel, dateLabel, guestName, place, salutation]);

  const copy = async (index: number) => {
    try {
      await navigator.clipboard.writeText(options[index].body);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      setCopiedIndex(null);
    }
  };

  const inputClass =
    "mt-1 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-text outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-text">
            Tên cô dâu &amp; chú rể
            <input value={couple} onChange={(e) => setCouple(e.target.value)} placeholder="Minh Khôi & Thảo Nguyên" className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-text">
            Ngày giờ cưới
            <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-text">
            Địa điểm
            <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Nhà hàng White Palace, TP.HCM" className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-text">
            Tên khách mời
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Chú Bảy" className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-text sm:col-span-2">
            Vai vế
            <select value={relationship} onChange={(e) => setRelationship(e.target.value as RelationshipGroup)} className={inputClass}>
              {RELATIONSHIPS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Cách xưng hô đang dùng: <strong>{getRelationshipLabel(relationship)}</strong> · {salutation.hostPronoun}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {options.map((option, index) => (
          <article key={option.title} className="flex flex-col rounded-2xl border border-border bg-surface p-4">
            <h2 className="font-display text-base font-semibold text-text">{option.title}</h2>
            <p className="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-text-muted">{option.body}</p>
            <button
              type="button"
              onClick={() => copy(index)}
              className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-surface text-xs font-semibold text-text transition-colors hover:bg-surface-alt"
            >
              {copiedIndex === index ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copiedIndex === index ? "Đã sao chép" : "Sao chép lời mời"}
            </button>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-accent/40 bg-accent-soft p-5 text-center">
        <p className="text-sm text-text">
          Bạn có muốn gửi kèm một tấm thiệp cưới online có in sẵn tên{" "}
          <strong>{guestName || "khách mời"}</strong> trên ảnh bìa Zalo không? Tạo miễn phí cho 20 khách ngay!
        </p>
        <Link
          href="/tao-thiep"
          className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
        >
          Tạo thiệp miễn phí
        </Link>
      </div>
    </div>
  );
}
