"use client";

import { RevealSection } from "./RevealSection";
import { useWeddingContent } from "./WeddingContentProvider";

function renderParentLines(parents: string) {
  const parts = parents.split(/\s*&\s*/);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return (
      <>
        <p className="font-inv-serif text-[11px] leading-[1.4] tracking-[0.01em] text-inv-ink uppercase sm:text-[12.5px]">
          {parts[0].trim()}
        </p>
        <p className="mt-0.5 font-inv-serif text-[11px] leading-[1.4] tracking-[0.01em] text-inv-ink uppercase sm:text-[12.5px]">
          {parts[1].trim()}
        </p>
      </>
    );
  }
  return (
    <p className="font-inv-serif text-[11px] leading-[1.4] tracking-[0.01em] text-inv-ink uppercase sm:text-[12.5px]">
      {parents}
    </p>
  );
}

function HandDrawnHeart() {
  return (
    <svg
      viewBox="0 0 110 92"
      aria-hidden="true"
      className="mx-auto mt-5 mb-3 block h-auto w-[72px] text-inv-ink motion-safe:animate-[inv-heartbeat_1.8s_ease-in-out_infinite] sm:w-[88px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M29 76 C50 62, 82 40, 82 22 C82 11, 71 6, 61 11 C53 15, 49 24, 48 31 C45 20, 35 12, 24 16 C12 20, 12 39, 25 53 C34 62, 46 70, 56 77" />
    </svg>
  );
}

export function Families() {
  const wedding = useWeddingContent();
  const { groom, bride } = wedding.families;

  return (
    <RevealSection className="bg-inv-bg px-4 pt-8 pb-3 text-center sm:px-6">
      {/* #2. Lời dẫn ngắn căn giữa */}
      {wedding.quote && (
        <blockquote className="mx-auto mb-7 max-w-[420px] font-inv-quote text-[21px] leading-[1.4] text-inv-text sm:text-[23px]">
          “{wedding.quote}”
        </blockquote>
      )}

      {/* #3. Hai khối NHÀ TRAI và NHÀ GÁI luôn xếp 2 cột song song */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <div className="min-w-0">
          <h2 className="mb-2 font-inv-serif text-[12px] font-semibold leading-[1.2] tracking-[0.04em] text-inv-ink uppercase sm:text-[13px]">
            {groom.label}
          </h2>
          {renderParentLines(groom.parents)}
          <p className="mt-2 font-inv-serif text-[11px] leading-[1.4] text-inv-muted sm:text-[12.5px]">
            {groom.address}
          </p>
        </div>

        <div className="min-w-0">
          <h2 className="mb-2 font-inv-serif text-[12px] font-semibold leading-[1.2] tracking-[0.04em] text-inv-ink uppercase sm:text-[13px]">
            {bride.label}
          </h2>
          {renderParentLines(bride.parents)}
          <p className="mt-2 font-inv-serif text-[11px] leading-[1.4] text-inv-muted sm:text-[12.5px]">
            {bride.address}
          </p>
        </div>
      </div>

      {/* Biểu tượng trái tim nét mảnh chính giữa */}
      <HandDrawnHeart />
    </RevealSection>
  );
}
