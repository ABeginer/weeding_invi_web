/**
 * Bảng điều phối nhạc nền đám cưới không lời chia theo 4 khung giờ nghi lễ
 * kèm gợi ý nhạc cụ, nhịp độ và danh sách bản hòa tấu dễ nghe cho mọi độ tuổi.
 */
import * as React from "react";
import { Disc3, Music, Sparkles, Volume2 } from "lucide-react";

interface MusicPhaseItem {
  id: string;
  moment: string;
  instrumentTone: string;
  tempoNote: string;
  tracks: readonly string[];
  icon: React.ComponentType<{ className?: string }>;
}

const MUSIC_PHASES: readonly MusicPhaseItem[] = [
  {
    id: "welcome",
    moment: "1. Đón khách tại sảnh (17h30–18h30)",
    instrumentTone: "Piano solo hoặc Acoustic Guitar ấm áp",
    tempoNote: "Nhịp vừa phải, tránh bass dập mạnh gây mệt tai khi khách nói chuyện.",
    tracks: [
      "La Vie En Rose (Acoustic Guitar)",
      "Fly Me To The Moon (Jazz Piano Trio)",
      "Ngày Cưới (Hòa tấu Piano nhẹ)",
    ],
    icon: Volume2,
  },
  {
    id: "processional",
    moment: "2. Bước vào lễ đường & Nghi thức gia đình",
    instrumentTone: "Piano kết hợp Violin hoặc Cello giàu cảm xúc",
    tempoNote: "Giai điệu dâng chậm rãi, dễ căn đúng bước chân cô dâu chú rể.",
    tracks: [
      "Canon in D (Piano & Cello)",
      "A Thousand Years (Instrumental Cello)",
      "Beautiful In White (Piano Solo)",
    ],
    icon: Sparkles,
  },
  {
    id: "toast-cake",
    moment: "3. Rót rượu champagne & Cắt bánh kem",
    instrumentTone: "String Quartet hoặc Saxophone lãng mạn",
    tempoNote: "Giữ âm lượng vừa đủ làm nền cho MC đọc lời chúc hai họ.",
    tracks: [
      "Perfect (Violin & Piano Cover)",
      "Can't Help Falling In Love (String Quartet)",
      "Nothing's Gonna Change My Love For You (Saxophone)",
    ],
    icon: Music,
  },
  {
    id: "banquet",
    moment: "4. Dùng tiệc & Đi bàn chúc mừng",
    instrumentTone: "Lo-fi Jazz hoặc Bossa Nova nhẹ nhàng",
    tempoNote: "Tiết tấu thư giãn giúp họ hàng hai bên trò chuyện rõ ràng.",
    tracks: [
      "What A Wonderful World (Piano Jazz)",
      "Autumn Leaves (Bossa Nova Guitar)",
      "Bức Thư Tình Đầu Tiên (Instrumental)",
    ],
    icon: Disc3,
  },
];

export function WeddingMusicMoodTimeline() {
  return (
    <figure
      aria-label="Phân bổ nhạc nền đám cưới không lời theo 4 chặng thời gian tại nhà hàng"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          LỘ TRÌNH ÂM NHẠC THEO KHUNG GIỜ
        </span>
        <span className="font-display text-xl font-semibold text-text">
          4 chặng nhạc không lời giữ mạch cảm xúc từ lúc đón khách đến cuối tiệc
        </span>
      </figcaption>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {MUSIC_PHASES.map((phase) => {
          const Icon = phase.icon;
          return (
            <div
              key={phase.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold text-text">
                      {phase.moment}
                    </h3>
                    <p className="text-xs font-medium text-accent-text">
                      {phase.instrumentTone}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-text">
                  {phase.tracks.map((track) => (
                    <li key={track}>{track}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-[11px] leading-relaxed text-text-muted">
                {phase.tempoNote}
              </p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
