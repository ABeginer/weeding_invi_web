"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { WeddingTemplateProps } from "./types";
import { THEME_CONFIGS } from "./themed/theme-configs";

function TemplateLoadingFallback() {
  return (
    <div
      aria-hidden="true"
      className="flex min-h-[540px] w-full flex-col items-center justify-center gap-4 bg-surface px-6 py-16 text-center animate-pulse motion-reduce:animate-none"
    >
      <div className="h-16 w-16 rounded-full border border-border bg-surface-alt" />
      <div className="h-4 w-32 rounded-full bg-border" />
      <div className="h-3 w-48 rounded-full bg-border/60" />
      <div className="mt-4 h-24 w-full max-w-[220px] rounded-xl border border-border bg-surface-alt/70" />
    </div>
  );
}

const DynamicBasic1 = dynamic(() => import("./basic-1"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBasic2 = dynamic(() => import("./basic-2"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBasic3 = dynamic(() => import("./basic-3"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicPro1 = dynamic(() => import("./pro-1"), {
  loading: () => <TemplateLoadingFallback />,
});

// 17 New Templates
const DynamicAnhDaoHong = dynamic(() => import("./anh-dao-hong"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBachSuDo = dynamic(() => import("./bach-su-do"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBachSuNau = dynamic(() => import("./bach-su-nau"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicChibiRed = dynamic(() => import("./chibi-red"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicHoaMocNau = dynamic(() => import("./hoa-moc-nau"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicHoangKimDo = dynamic(() => import("./hoang-kim-do"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicLongPhungV2Do = dynamic(() => import("./long-phung-v2-do"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicMaiLanXanh = dynamic(() => import("./mai-lan-xanh"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicRenTheuTrang = dynamic(() => import("./ren-theu-trang"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicSongHyV2Do = dynamic(() => import("./song-hy-v2-do"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicSongPhungXanh = dynamic(() => import("./song-phung-xanh"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicToDuyenDoDam = dynamic(() => import("./to-duyen-do-dam"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicToDuyenHong = dynamic(() => import("./to-duyen-hong"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicVuonXuanDo = dynamic(() => import("./vuon-xuan-do"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicVuonXuanXanh = dynamic(() => import("./vuon-xuan-xanh"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicVuonkinhXanhNhat = dynamic(() => import("./vuonkinh-xanh-nhat"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicVuonkinhXanh = dynamic(() => import("./vuonkinh-xanh"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicVariant = dynamic(() => import("./themed/VariantTemplate").then((mod) => mod.VariantTemplate), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicHoaAnhDaoV2 = dynamic(() => import("./hoa-anh-dao-v2"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicDoMayMan = dynamic(() => import("./do-may-man"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicXanhTuDo = dynamic(() => import("./xanh-tu-do"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicDoMixXanh = dynamic(() => import("./do-mix-xanh"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicNauToiGian = dynamic(() => import("./nau-toi-gian"), {
  loading: () => <TemplateLoadingFallback />,
});

export interface TemplatePreviewRendererProps extends WeddingTemplateProps {
  templateId: string;
}

export function TemplatePreviewRenderer({
  templateId,
  ...props
}: TemplatePreviewRendererProps) {
  const variantMatch = templateId.match(/^(.+)-(v[234])$/);
  if (variantMatch && THEME_CONFIGS[variantMatch[1]]) {
    const baseId = variantMatch[1];
    const variantIndex = Number(variantMatch[2].slice(1)) - 2;
    return (
      <DynamicVariant
        baseId={baseId}
        variantIndex={variantIndex}
        {...props}
      />
    );
  }

  switch (templateId) {
    case "nau-toi-gian":
      return <DynamicNauToiGian {...props} />;
    case "do-mix-xanh":
      return <DynamicDoMixXanh {...props} />;
    case "xanh-tu-do":
      return <DynamicXanhTuDo {...props} />;
    case "do-may-man":
      return <DynamicDoMayMan {...props} />;
    case "hoa-anh-dao-v2":
      return <DynamicHoaAnhDaoV2 {...props} />;
    case "basic-2":
    case "ritual-gia-tien":
      return <DynamicBasic2 {...props} />;
    case "basic-3":
    case "ritual-vu-quy":
      return <DynamicBasic3 {...props} />;
    case "pro-1":
      return <DynamicPro1 {...props} />;
    case "anh-dao-hong":
      return <DynamicAnhDaoHong {...props} />;
    case "bach-su-do":
      return <DynamicBachSuDo {...props} />;
    case "bach-su-nau":
      return <DynamicBachSuNau {...props} />;
    case "chibi-red":
      return <DynamicChibiRed {...props} />;
    case "hoa-moc-nau":
      return <DynamicHoaMocNau {...props} />;
    case "hoang-kim-do":
      return <DynamicHoangKimDo {...props} />;
    case "long-phung-v2-do":
      return <DynamicLongPhungV2Do {...props} />;
    case "mai-lan-xanh":
      return <DynamicMaiLanXanh {...props} />;
    case "ren-theu-trang":
      return <DynamicRenTheuTrang {...props} />;
    case "song-hy-v2-do":
      return <DynamicSongHyV2Do {...props} />;
    case "song-phung-xanh":
      return <DynamicSongPhungXanh {...props} />;
    case "to-duyen-do-dam":
      return <DynamicToDuyenDoDam {...props} />;
    case "to-duyen-hong":
      return <DynamicToDuyenHong {...props} />;
    case "vuon-xuan-do":
      return <DynamicVuonXuanDo {...props} />;
    case "vuon-xuan-xanh":
      return <DynamicVuonXuanXanh {...props} />;
    case "vuonkinh-xanh-nhat":
      return <DynamicVuonkinhXanhNhat {...props} />;
    case "vuonkinh-xanh":
      return <DynamicVuonkinhXanh {...props} />;
    case "basic-1":
    case "ritual-an-hoi":
    default:
      return <DynamicBasic1 {...props} />;
  }
}
