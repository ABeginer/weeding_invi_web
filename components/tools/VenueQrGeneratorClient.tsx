"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, ExternalLink, MapPin, Palette } from "lucide-react";
import { SmartToolCta } from "@/components/tools/SmartToolCta";
import {
  renderVenueQrCardToCanvas,
  resolveVenueMapsUrl,
  VENUE_QR_THEMES,
  type VenueQrThemeId,
} from "@/lib/venue-qr";
import { cn } from "@/lib/utils";

const THEME_LIST = Object.values(VENUE_QR_THEMES);

export function VenueQrGeneratorClient() {
  const [locationInput, setLocationInput] = React.useState(
    "Trung tâm Hội nghị White Palace, 194 Hoàng Văn Thụ, Phú Nhuận, TP.HCM",
  );
  const [coupleTitle, setCoupleTitle] = React.useState("Minh Khôi & Thảo Nguyên");
  const [venueLabel, setVenueLabel] = React.useState(
    "Sảnh Grand Ballroom · White Palace",
  );
  const [eventTime, setEventTime] = React.useState(
    "18:00 · Chủ Nhật, 24/05/2026",
  );
  const [themeId, setThemeId] = React.useState<VenueQrThemeId>("cream");
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const [downloading, setDownloading] = React.useState<"card" | "qr" | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const mapsResolution = React.useMemo(
    () => resolveVenueMapsUrl(locationInput),
    [locationInput],
  );
  const activeTheme = VENUE_QR_THEMES[themeId];

  React.useEffect(() => {
    let cancelled = false;
    if (!mapsResolution.ok || !mapsResolution.url) {
      return;
    }

    QRCode.toDataURL(mapsResolution.url, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: activeTheme.qrDark,
        light: activeTheme.qrLight,
      },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });

    return () => {
      cancelled = true;
    };
  }, [activeTheme.qrDark, activeTheme.qrLight, mapsResolution]);

  const displayedQrDataUrl = mapsResolution.ok ? qrDataUrl : "";

  const handleCopyUrl = async () => {
    if (!mapsResolution.ok || !mapsResolution.url) return;
    try {
      await navigator.clipboard.writeText(mapsResolution.url);
      setCopiedUrl(true);
      setActionNotice("Đã sao chép đường link Google Maps chỉ đường.");
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setActionNotice("Không thể sao chép tự động; hãy bôi đen link để copy.");
    }
  };

  const handleDownloadCard = async () => {
    if (!mapsResolution.ok || !mapsResolution.url) return;
    setDownloading("card");
    setActionNotice(null);
    try {
      const canvas = await renderVenueQrCardToCanvas({
        mapsUrl: mapsResolution.url,
        coupleTitle,
        venueName: venueLabel,
        eventTime,
        themeId,
      });
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "qr-dia-diem-dam-cuoi-inviwedd.png";
      link.href = pngUrl;
      link.click();
      setActionNotice("Đã tải ảnh khung thiệp kèm mã QR PNG sắc nét.");
    } catch {
      setActionNotice("Không thể tạo ảnh tải xuống, vui lòng thử lại.");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadRawQr = async () => {
    if (!mapsResolution.ok || !mapsResolution.url) return;
    setDownloading("qr");
    setActionNotice(null);
    try {
      const rawUrl = await QRCode.toDataURL(mapsResolution.url, {
        width: 1000,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: activeTheme.qrDark,
          light: "#FFFFFF",
        },
      });
      const link = document.createElement("a");
      link.download = "ma-qr-google-maps-inviwedd.png";
      link.href = rawUrl;
      link.click();
      setActionNotice("Đã tải mã QR nền trắng (1000×1000px) để chèn vào file thiết kế.");
    } catch {
      setActionNotice("Không thể xuất mã QR, vui lòng thử lại.");
    } finally {
      setDownloading(null);
    }
  };

  const inputClass =
    "mt-1.5 h-11 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 text-sm text-[#1F1D1A] placeholder:text-[#6B655E]/60 outline-none transition-all focus-visible:border-[#7A1C24] focus-visible:ring-1 focus-visible:ring-[#7A1C24]/20";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      {/* Cột trái: Nhập địa điểm & tùy chọn khung */}
      <section className="min-w-0 rounded-2xl border border-[#E8E2D9] bg-white p-5 sm:p-6 shadow-xs lg:col-span-6">
        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span>THÔNG TIN ĐỊA ĐIỂM &amp; KHUNG THIỆP</span>
        </div>
        <h2 className="mt-1 font-serif text-xl sm:text-2xl font-medium text-[#1F1D1A]">
          Nhập link Google Maps hoặc địa chỉ sảnh tiệc
        </h2>

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
            Link Google Maps, tọa độ hoặc địa chỉ nhà hàng
            <input
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Dán link maps.app.goo.gl/... hoặc tên nhà hàng, quận/tỉnh"
              className={inputClass}
            />
          </label>
          {!mapsResolution.ok && mapsResolution.error && (
            <p className="text-xs font-medium text-[#7A1C24]" role="alert">
              {mapsResolution.error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
              Tên Cô dâu &amp; Chú rể
              <input
                value={coupleTitle}
                onChange={(e) => setCoupleTitle(e.target.value)}
                placeholder="Minh Khôi & Thảo Nguyên"
                className={inputClass}
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
              Ngày giờ đón khách
              <input
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="18:00 · Chủ Nhật, 24/05/2026"
                className={inputClass}
              />
            </label>
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
            Tên sảnh / ghi chú dưới mã QR
            <input
              value={venueLabel}
              onChange={(e) => setVenueLabel(e.target.value)}
              placeholder="Sảnh Ruby · Tầng 2"
              className={inputClass}
            />
          </label>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
              <Palette className="h-3.5 w-3.5 text-[#B89B72]" aria-hidden="true" />
              <span>Chọn khung trang trí thiệp cưới</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {THEME_LIST.map((theme) => {
                const selected = theme.id === themeId;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeId(theme.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                      selected
                        ? "border-[#7A1C24] bg-[#FAF8F5] ring-1 ring-[#7A1C24]/25"
                        : "border-[#E8E2D9] bg-white hover:border-[#B89B72]",
                    )}
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#1F1D1A]">
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
                        style={{ backgroundColor: theme.cardBg }}
                        aria-hidden="true"
                      />
                      {theme.label}
                    </span>
                    <span className="mt-1 text-[11px] leading-snug text-[#6B655E]">
                      {theme.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-3 text-xs leading-relaxed text-[#6B655E]">
          Mọi thao tác tạo mã QR chạy 100% trên trình duyệt của bạn. Mã QR là mã tĩnh trỏ thẳng tới Google Maps nên không bao giờ hết hạn hay dính quảng cáo trung gian.
        </p>
      </section>

      {/* Cột phải: Xem trước khung thiệp QR & Nút tải / copy */}
      <section className="min-w-0 space-y-5 lg:col-span-6">
        <div className="rounded-2xl border border-[#E8E2D9] bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E8E2D9]">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
                XEM TRƯỚC TRỰC TIẾP
              </p>
              <h2 className="font-serif text-xl font-medium text-[#1F1D1A]">
                Khung thiệp mã QR sẵn sàng in &amp; gửi Zalo
              </h2>
            </div>

            {mapsResolution.ok && mapsResolution.url && (
              <a
                href={mapsResolution.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A1C24] hover:underline"
              >
                <span>Mở thử bản đồ</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>

          {/* Preview Card */}
          <div className="mt-5 flex justify-center">
            <div
              className="w-full max-w-[340px] rounded-2xl p-4 shadow-sm transition-colors duration-200"
              style={{
                backgroundColor: activeTheme.cardBg,
                border: `1.5px solid ${activeTheme.innerBorder}`,
              }}
            >
              <div
                className="rounded-xl px-4 py-5 text-center"
                style={{ border: `1px solid ${activeTheme.innerBorder}` }}
              >
                <p
                  className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: activeTheme.accentColor }}
                >
                  BẢN ĐỒ CHỈ ĐƯỜNG ĐỊA ĐIỂM
                </p>
                <p
                  className="mt-1.5 font-serif text-xl font-medium leading-snug"
                  style={{ color: activeTheme.titleColor }}
                >
                  {coupleTitle.trim() || "Lễ Cưới Của Chúng Tôi"}
                </p>

                <div className="mx-auto mt-4 flex h-[210px] w-[210px] items-center justify-center rounded-2xl bg-white p-3 shadow-xs">
                  {displayedQrDataUrl ? (
                    <img
                      src={displayedQrDataUrl}
                      alt="Mã QR chỉ đường địa điểm đám cưới trên Google Maps"
                      width={186}
                      height={186}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-[#6B655E]">
                      Nhập địa điểm hợp lệ để hiện mã QR
                    </span>
                  )}
                </div>

                <p
                  className="mt-4 text-xs font-semibold"
                  style={{ color: activeTheme.titleColor }}
                >
                  {venueLabel.trim() || "Nhà hàng Tiệc cưới"}
                </p>
                {eventTime.trim() && (
                  <p
                    className="mt-0.5 text-[11px]"
                    style={{ color: activeTheme.mutedColor }}
                  >
                    {eventTime.trim()}
                  </p>
                )}

                <p
                  className="mt-3 text-[10px] font-semibold tracking-wide"
                  style={{ color: activeTheme.accentColor }}
                >
                  Quét mã bằng Camera hoặc Zalo để mở Google Maps
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              disabled={!mapsResolution.ok || downloading !== null}
              onClick={handleDownloadCard}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#5E141B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{downloading === "card" ? "Đang xuất PNG..." : "Tải khung thiệp PNG"}</span>
            </button>

            <button
              type="button"
              disabled={!mapsResolution.ok || downloading !== null}
              onClick={handleDownloadRawQr}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-5 text-xs font-semibold text-[#1F1D1A] transition-colors hover:border-[#7A1C24]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{downloading === "qr" ? "Đang xuất QR..." : "Tải riêng mã QR PNG"}</span>
            </button>
          </div>

          <button
            type="button"
            disabled={!mapsResolution.ok}
            onClick={handleCopyUrl}
            className="mt-2.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#E8E2D9] bg-white px-4 text-xs font-medium text-[#1F1D1A] transition-colors hover:bg-[#FAF8F5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copiedUrl ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                <span>Đã sao chép link chỉ đường</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sao chép link Google Maps rút gọn</span>
              </>
            )}
          </button>

          {actionNotice && (
            <p className="mt-3 text-center text-xs font-medium text-[#7A1C24]">
              {actionNotice}
            </p>
          )}
        </div>

        <SmartToolCta
          eyebrow="THIỆP CƯỚI TÍCH HỢP BẢN ĐỒ SẴN"
          title="Muốn khách chạm 1 nút mở Google Maps mà không cần quét QR?"
          description="Thiệp cưới online Inviwedd gắn sẵn nút chỉ đường bản đồ, lời chào mang tên riêng từng khách và thu xác nhận tham dự RSVP tự động — miễn phí cho 20 khách đầu tiên."
          buttonText="Tạo thiệp cưới miễn phí"
          buttonHref="/tao-thiep"
        />
      </section>
    </div>
  );
}
