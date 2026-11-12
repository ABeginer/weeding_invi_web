import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplatePhotoPlaceholderProps {
  label?: string;
  className?: string;
}

export function TemplatePhotoPlaceholder({
  label = "Chưa có ảnh",
  className,
}: TemplatePhotoPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1b1b1b] via-[#131313] to-[#0b0b0b] px-4 text-center text-[#A89F86]",
        className,
      )}
    >
      <ImageOff className="h-6 w-6 text-[#8C7A3F]" aria-hidden="true" />
      <span className="text-xs font-medium tracking-[0.08em] text-[#E8DFC8]/85">
        {label}
      </span>
    </div>
  );
}

