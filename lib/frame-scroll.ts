/**
 * Tìm đúng phần tử cuộn bên trong iframe thiệp. Template code dùng body làm
 * scroll container (overflow-y:auto), designer dùng document; không phải lúc
 * nào `window.scrollTo` cũng có tác dụng.
 */
export function findFrameScroller(
  frame: HTMLIFrameElement,
): { element: HTMLElement; max: number } | null {
  try {
    const doc = frame.contentDocument;
    if (!doc) return null;
    const candidates: HTMLElement[] = [
      doc.body,
      doc.documentElement,
      ...doc.querySelectorAll<HTMLElement>(
        "[data-invitation-scroll], main, .overflow-y-auto, .overflow-auto",
      ),
    ];
    let best: HTMLElement | null = null;
    let max = 0;
    for (const element of candidates) {
      if (!element) continue;
      const distance = element.scrollHeight - element.clientHeight;
      if (distance > max) {
        best = element;
        max = distance;
      }
    }
    return best && max > 0 ? { element: best, max } : null;
  } catch {
    return null;
  }
}

export function setFrameScroll(frame: HTMLIFrameElement, top: number): void {
  const target = findFrameScroller(frame);
  if (target) {
    target.element.scrollTop = top;
    return;
  }
  try {
    frame.contentWindow?.scrollTo(0, top);
  } catch {
    // iframe chưa sẵn sàng.
  }
}

/**
 * Một số template khoá scroll của body/html khi nhúng. Dịch body bằng transform
 * cho preview luôn chạy, đồng thời không hiện scrollbar.
 */
export function frameOffsetMax(frame: HTMLIFrameElement): number {
  try {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !win) return 0;
    const height = Math.max(
      doc.body?.scrollHeight ?? 0,
      doc.documentElement.scrollHeight,
    );
    return Math.max(0, height - win.innerHeight);
  } catch {
    return 0;
  }
}

export function setFrameOffset(frame: HTMLIFrameElement, offset: number): void {
  try {
    const body = frame.contentDocument?.body;
    if (!body) return;
    body.style.transform = offset > 0 ? `translateY(-${offset}px)` : "";
    body.style.willChange = offset > 0 ? "transform" : "";
  } catch {
    // iframe chưa sẵn sàng.
  }
}
