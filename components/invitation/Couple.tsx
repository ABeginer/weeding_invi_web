"use client";

import { wedding } from "@/content/wedding";
import { RevealSection } from "./RevealSection";

export function Couple() {
  return (
    <RevealSection className="bg-inv-bg text-center">
      {/* Vai trò & tên thư pháp Chú rể - Cô dâu nằm cạnh nhau */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-1 pb-6 sm:gap-5 sm:px-6">
        <div className="min-w-0">
          <p className="mb-1 font-inv-serif text-[12px] font-semibold leading-[1.2] tracking-[0.04em] text-inv-ink uppercase sm:text-[13px]">
            {wedding.groom.label}
          </p>
          <h2 className="font-inv-script text-[clamp(23px,6.2vw,31px)] leading-[1.2] font-normal text-inv-ink">
            {wedding.groom.fullName}
          </h2>
        </div>

        <div className="min-w-0">
          <p className="mb-1 font-inv-serif text-[12px] font-semibold leading-[1.2] tracking-[0.04em] text-inv-ink uppercase sm:text-[13px]">
            {wedding.bride.label}
          </p>
          <h2 className="font-inv-script text-[clamp(23px,6.2vw,31px)] leading-[1.2] font-normal text-inv-ink">
            {wedding.bride.fullName}
          </h2>
        </div>
      </div>

      {/* Dải băng xanh olive bọc hai ảnh chân dung góc vuông */}
      <div className="grid grid-cols-2 gap-3 bg-inv-olive-mid p-3">
        <div className="h-[220px] w-full overflow-hidden bg-inv-olive-deep/30 sm:h-[300px]">
          <img
            src={wedding.groom.photo}
            alt={`${wedding.groom.name} ${wedding.groom.fullName}`}
            width={600}
            height={800}
            loading="lazy"
            className="block h-full w-full object-cover object-[center_22%]"
          />
        </div>

        <div className="h-[220px] w-full overflow-hidden bg-inv-olive-deep/30 sm:h-[300px]">
          <img
            src={wedding.bride.photo}
            alt={`${wedding.bride.name} ${wedding.bride.fullName}`}
            width={600}
            height={800}
            loading="lazy"
            className="block h-full w-full object-cover object-[center_22%]"
          />
        </div>
      </div>
    </RevealSection>
  );
}
