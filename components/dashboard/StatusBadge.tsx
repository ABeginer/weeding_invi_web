import { Check, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { GuestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: GuestStatus;
  className?: string;
}

const statusConfig: Record<
  GuestStatus,
  {
    label: string;
    classes: string;
    Icon: typeof CheckCircle2;
  }
> = {
  accepted: {
    label: "Đã xác nhận",
    classes: "border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E]",
    Icon: CheckCircle2,
  },
  declined: {
    label: "Từ chối",
    classes: "border-[#ECCFCF] bg-[#FBEFEF] text-[#9E3B3B]",
    Icon: XCircle,
  },
  pending: {
    label: "Chờ phản hồi",
    classes: "border-[#E8DAC0] bg-[#FAF3E3] text-[#8A6D3B]",
    Icon: Clock,
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, classes, Icon } = statusConfig[status] ?? statusConfig.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        classes,
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function SentBadge({
  isSent,
  onClick,
  className,
}: {
  isSent: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={isSent ? "Nhấn để đánh dấu Chưa gửi" : "Nhấn để đánh dấu Đã gửi"}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all hover:scale-105 select-none whitespace-nowrap",
        isSent
          ? "border-[#BBDBC9] bg-[#ECF5F0] text-[#2F6F4E] hover:bg-[#d8ece0]"
          : "border-[#E8DAC0] bg-[#FAF3E3] text-[#8A6D3B] hover:bg-[#f3e7ce]",
        className,
      )}
    >
      {isSent ? (
        <>
          <Check className="h-3 w-3 shrink-0" />
          <span>Đã gửi</span>
        </>
      ) : (
        <>
          <Clock className="h-3 w-3 shrink-0" />
          <span>Chưa gửi</span>
        </>
      )}
    </button>
  );
}
