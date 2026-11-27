"use client";

import * as React from "react";
import { TEMPLATE_FONT_VARIABLES } from "@/lib/template-fonts";

const TEMPLATE_FONT_CLASS_LIST = TEMPLATE_FONT_VARIABLES.split(/\s+/).filter(Boolean);

/**
 * Đưa các CSS variable font trang trí của thiệp vào route dùng thiệp/trình tạo thiệp
 * (đồng thời gắn lên `<html>` của đúng ownerDocument — kể cả iframe MobilePreviewFrame —
 * để các portal như GiftModal, Lightbox thừa hưởng),
 * giúp các trang catalog/marketing như `/thiep-cuoi` không phải tải CSS của 8 font mẫu thiệp.
 *
 * Dùng `display: contents` để không tạo thêm hộp layout và không làm gãy chuỗi `h-full`
 * của chế độ `contained` preview (AGENTS.md §7.1).
 */
export function TemplateFontScope({ children }: { children?: React.ReactNode }) {
  const scopeRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const targetDoc = scopeRef.current?.ownerDocument ?? document;
    targetDoc.documentElement.classList.add(...TEMPLATE_FONT_CLASS_LIST);
    if (targetDoc !== document) {
      document.documentElement.classList.add(...TEMPLATE_FONT_CLASS_LIST);
    }
  }, []);

  if (!children) {
    return <span ref={scopeRef} className="hidden" aria-hidden="true" />;
  }

  return (
    <div ref={scopeRef} className={`contents ${TEMPLATE_FONT_VARIABLES}`}>
      {children}
    </div>
  );
}
