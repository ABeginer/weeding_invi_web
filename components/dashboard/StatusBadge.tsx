import { CheckCircle2, Clock, XCircle } from "lucide-react";
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
    label: "Chấp nhận",
    classes: "border-success-border bg-success-bg text-success-fg",
    Icon: CheckCircle2,
  },
  declined: {
    label: "Từ chối",
    classes: "border-danger-border bg-danger-bg text-danger-fg",
    Icon: XCircle,
  },
  pending: {
    label: "Chưa phản hồi",
    classes: "border-neutral-border bg-neutral-bg text-neutral-fg",
    Icon: Clock,
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, classes, Icon } = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        classes,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
