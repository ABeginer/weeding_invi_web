"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { SmartToolCta } from "@/components/tools/SmartToolCta";
import {
  buildSalutation,
  getRelationshipLabel,
  type RelationshipGroup,
} from "@/lib/salutation-engine";
import { cn } from "@/lib/utils";

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
  const [relationship, setRelationship] =
    React.useState<RelationshipGroup>("peer_formal");
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [highlightPulse, setHighlightPulse] = React.useState(false);

  const salutation = buildSalutation({
    guestName: guestName || "Quý khách",
    relationshipGroup: relationship,
  });
  const coupleLabel = couple.trim() || "Cô dâu & Chú rể";
  const dateLabel = formatDate(dateTime);
  const place = venue.trim() || "địa điểm tổ chức";

  const options = React.useMemo(() => {
    const formal = `${salutation.zaloMessage}${dateLabel ? `\nThời gian: ${dateLabel}.` : ""}${place ? `\nĐịa điểm: ${place}.` : ""}\n${coupleLabel}`;
    const warm = `Kính mời ${salutation.guestPronoun.toLowerCase()} ${guestName || "quý khách"} đến chung vui ngày vui của ${coupleLabel}.${dateLabel ? ` ${dateLabel},` : ""} tại ${place}. Rất mong được đón tiếp ${salutation.guestPronoun.toLowerCase()}! 💌`;
    const short = `Thân mời ${guestName || "bạn"} tới dự tiệc cưới của ${coupleLabel}${dateLabel ? ` vào ${dateLabel}` : ""}${place ? ` tại ${place}` : ""}. Nhớ xác nhận giúp mình nhé!`;
    return [
      {
        title: "Trang trọng",
        desc: "Phù hợp gửi bề trên, họ hàng lớn tuổi hoặc sếp",
        body: formal,
      },
      {
        title: "Ấm áp",
        desc: "Thân mật, tình cảm, phù hợp đồng nghiệp thân quen",
        body: warm,
      },
      {
        title: "Ngắn gọn",
        desc: "Hiện đại, trực diện, phù hợp bạn bè cùng trang lứa",
        body: short,
      },
    ];
  }, [coupleLabel, dateLabel, guestName, place, salutation]);

  const copy = async (index: number) => {
    try {
      await navigator.clipboard.writeText(options[index].body);
      setCopiedIndex(index);
      setHighlightPulse(true);
      window.setTimeout(() => setCopiedIndex(null), 2000);
      window.setTimeout(() => setHighlightPulse(false), 2500);
    } catch {
      setCopiedIndex(null);
    }
  };

  const inputClass =
    "mt-1.5 h-11 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 text-sm text-[#1F1D1A] placeholder:text-[#6B655E]/60 outline-none transition-all focus-visible:border-[#7A1C24] focus-visible:ring-1 focus-visible:ring-[#7A1C24]/20";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      {/* Cột trái: Nhập liệu */}
      <section className="min-w-0 rounded-2xl border border-[#E8E2D9] bg-white p-5 sm:p-6 shadow-xs lg:col-span-5">
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
            THÔNG TIN LỜI MỜI
          </p>
          <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#1F1D1A]">
            Chi tiết đám cưới
          </h2>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
            Tên cô dâu &amp; chú rể
            <input
              value={couple}
              onChange={(e) => setCouple(e.target.value)}
              placeholder="Minh Khôi & Thảo Nguyên"
              className={inputClass}
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
            Ngày giờ cưới
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
            Địa điểm
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Nhà hàng White Palace, TP.HCM"
              className={inputClass}
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
            Tên khách mời
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Chú Bảy"
              className={inputClass}
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
            Vai vế &amp; Mối quan hệ
            <select
              value={relationship}
              onChange={(e) =>
                setRelationship(e.target.value as RelationshipGroup)
              }
              className={inputClass}
            >
              {RELATIONSHIPS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-[#B89B72]/30 bg-[#FAF8F5] p-3.5 text-xs text-[#6B655E]">
          Cách xưng hô tự động:{" "}
          <strong className="text-[#1F1D1A]">
            {getRelationshipLabel(relationship)}
          </strong>{" "}
          · Đại từ gia đình:{" "}
          <span className="font-semibold text-[#7A1C24]">
            {salutation.hostPronoun}
          </span>
        </div>
      </section>

      {/* Cột phải: 3 phương án gợi ý */}
      <section className="min-w-0 space-y-5 lg:col-span-7">
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
            GỢI Ý LỜI MỜI
          </p>
          <h2 className="font-serif text-2xl font-medium text-[#1F1D1A]">
            3 Phương án soạn sẵn
          </h2>
        </div>

        <div className="space-y-4">
          {options.map((option, index) => {
            const isCopied = copiedIndex === index;
            return (
              <article
                key={option.title}
                className="flex flex-col justify-between rounded-2xl border border-[#E8E2D9] bg-[#F4EFEA] p-5 shadow-xs transition-all hover:border-[#7A1C24]/30"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-serif text-lg font-medium text-[#1F1D1A]">
                      {option.title}
                    </h3>
                    <span className="text-[11px] text-[#6B655E]">
                      {option.desc}
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl border border-[#E8E2D9] bg-white p-4 text-xs sm:text-sm leading-relaxed text-[#1F1D1A] whitespace-pre-line shadow-2xs">
                    {option.body}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => copy(index)}
                    className={cn(
                      "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]",
                      isCopied
                        ? "bg-[#2F6F4E] text-white shadow-xs"
                        : "border border-[#E8E2D9] bg-white text-[#1F1D1A] shadow-2xs hover:border-[#7A1C24]/40 hover:bg-[#FAF8F5] hover:text-[#7A1C24]",
                    )}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span>Đã sao chép vào bộ nhớ tạm</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        <span>Sao chép lời mời</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Smart Contextual CTA: Tự động hóa lời mời */}
        <SmartToolCta
          eyebrow="TỰ ĐỘNG HÓA LỜI MỜI"
          title={`Muốn gửi kèm thiệp cưới tự động đổi xưng hô cho ${getRelationshipLabel(relationship)}?`}
          description="Không cần copy sửa tay từng tin nhắn. Nhập danh sách khách một lần, Inviwedd tự tạo link thiệp riêng và tin nhắn Zalo chuẩn lễ nghĩa cho từng người."
          buttonText="Tạo thiệp cá nhân hóa miễn phí →"
          buttonHref="/tao-thiep"
          highlightPulse={highlightPulse}
          className="mt-6"
        />
      </section>
    </div>
  );
}
