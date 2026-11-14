const MESSAGES = [
  {
    dot: "accepted",
    text: "Thiệp cưới Minh Khôi & Thảo Nguyên vừa nhận xác nhận từ Bạn Thanh Mai (2 người · Ăn mặn)",
  },
  {
    dot: "sent",
    text: "Thiệp cưới Hoàng Nam & Mai Anh vừa tạo 350 link mời riêng qua Zalo",
  },
  {
    dot: "album",
    text: "Album QR tiệc cưới Đức Huy & Lan Vy vừa nhận 48 ảnh hậu trường từ khách mời",
  },
] as const;

const DOT_CLASS: Record<string, string> = {
  accepted: "bg-success-fg",
  sent: "bg-accent",
  album: "bg-warning-fg",
};

export function SocialProofMarquee() {
  const items = [...MESSAGES, ...MESSAGES];

  return (
    <section className="border-y border-border bg-surface-alt py-4" aria-label="Hoạt động gần đây">
      <p className="mx-auto max-w-5xl px-4 text-center text-xs font-medium text-text-muted sm:px-6">
        Không giới hạn lượt xem · Hàng ngàn lời mời và xác nhận tham dự được gửi đi mỗi tuần
      </p>

      <div className="marquee-mask mt-3 overflow-hidden">
        <ul className="marquee-track flex w-max gap-3 hover:[animation-play-state:paused] motion-reduce:animate-none">
          {items.map((item, index) => (
            <li
              key={`${item.dot}-${index}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-xs text-text"
              aria-hidden={index >= MESSAGES.length ? "true" : undefined}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[item.dot]}`}
                aria-hidden="true"
              />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
