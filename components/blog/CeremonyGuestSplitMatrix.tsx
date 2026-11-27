/**
 * Ma trận phân bổ khách mời theo 3 buổi lễ truyền thống Việt Nam (Vu Quy, Thành Hôn, Tiệc Cưới)
 * giúp tránh đặt thừa hoặc thiếu bàn khi lập danh sách trên bảng tính.
 */
import * as React from "react";
import { CalendarHeart, Home, UtensilsCrossed } from "lucide-react";

interface CeremonyBucket {
  id: string;
  ceremonyName: string;
  audience: string;
  tableRule: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CEREMONY_BUCKETS: readonly CeremonyBucket[] = [
  {
    id: "vu-quy",
    ceremonyName: "Lễ Vu Quy (Tư gia nhà gái)",
    audience: "Họ hàng bên ngoại, cô bác ruột, đại diện nhà trai sang rước dâu",
    tableRule: "Tính theo số mâm cỗ sáng tại nhà (thường 2–6 mâm hoặc chỉ tiệc trà nhẹ)",
    note: "Tách cột đánh dấu riêng để không cộng nhầm khách chỉ ăn tiệc nhà hàng buổi tối.",
    icon: Home,
  },
  {
    id: "thanh-hon",
    ceremonyName: "Lễ Thành Hôn (Tư gia nhà trai)",
    audience: "Họ hàng nội tộc chú rể, đoàn rước dâu nhà gái và hàng xóm thân thiết",
    tableRule: "Chốt số mâm riêng cho lễ gia tiên buổi sáng trước khi di chuyển ra sảnh",
    note: "Ghi rõ người đi cả hai buổi để đếm đúng suất ăn sáng và suất tối.",
    icon: CalendarHeart,
  },
  {
    id: "tiec-cuoi",
    ceremonyName: "Tiệc Cưới Nhà Hàng (Tiệc chính)",
    audience: "Khách hai họ, đồng nghiệp công ty, đối tác, bạn thân của cô dâu chú rể",
    tableRule: "Tổng đầu người (cả người đi kèm) chia 10, cộng thêm 5–10% bàn dự phòng",
    note: "Sắp bàn theo cụm quan hệ (bàn gia đình, bàn công ty, bàn đại học) trên cùng 1 cột.",
    icon: UtensilsCrossed,
  },
];

export function CeremonyGuestSplitMatrix() {
  return (
    <figure
      aria-label="Cách tách danh sách khách mời theo từng buổi lễ Vu Quy, Thành Hôn và Tiệc Cưới"
      className="my-7 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <figcaption className="mb-4 flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-accent-text uppercase">
          PHÂN LOẠI THEO BUỔI LỄ
        </span>
        <span className="font-display text-xl font-semibold text-text">
          Cách tách 3 luồng khách trên cùng một bảng tính không bị trùng mâm
        </span>
      </figcaption>

      <div className="grid gap-3.5 md:grid-cols-3">
        {CEREMONY_BUCKETS.map((bucket) => {
          const Icon = bucket.icon;
          return (
            <div
              key={bucket.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/45 p-4"
            >
              <div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 font-display text-base font-semibold text-text">
                  {bucket.ceremonyName}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                  <strong className="font-semibold text-text">Nhóm khách:</strong>{" "}
                  {bucket.audience}
                </p>
              </div>
              <div className="mt-3 space-y-1.5 rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed">
                <p className="font-semibold text-accent-text">{bucket.tableRule}</p>
                <p className="text-text-muted">{bucket.note}</p>
              </div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
