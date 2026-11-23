"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { MotionProvider } from "@/components/theme/MotionProvider";
import { playOpenCardSound } from "@/lib/sound-effects";
import {
  InvitationExperienceProvider,
  type InvitationExperienceMode,
} from "@/components/invitation/InvitationExperienceProvider";
import type { WeddingTemplateProps } from "./types";
import { THEME_CONFIGS } from "./themed/theme-configs";

function TemplateLoadingFallback() {
  return (
    <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-[#FAF8F5]/90 text-[#5C554E] backdrop-blur-xs">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B89B72] border-t-transparent" />
        <p className="font-serif text-sm tracking-wide">Đang tải giao diện thiệp...</p>
      </div>
    </div>
  );
}

const DynamicBasic1 = dynamic(() => import("./basic-1"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBachLanLuaNga = dynamic(() => import("./bach-lan-lua-nga"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicRangHongHoangHon = dynamic(() => import("./rang-hong-hoang-hon"), {
  loading: () => <TemplateLoadingFallback />,
});

// Remaining Themed / New Templates
const DynamicPhuongLoanGamDo = dynamic(() => import("./phuong-loan-gam-do"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicThanhMaiNgocLan = dynamic(() => import("./thanh-mai-ngoc-lan"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicSongHyV2Do = dynamic(() => import("./song-hy-v2-do"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicSongPhungBichDao = dynamic(() => import("./song-phung-bich-dao"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicToHongLuaTham = dynamic(() => import("./to-hong-lua-tham"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicVuonkinhXanh = dynamic(() => import("./vuonkinh-xanh"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicVariant = dynamic(() => import("./themed/VariantTemplate").then((mod) => mod.VariantTemplate), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicAnhDaoPhanTuyet = dynamic(() => import("./anh-dao-phan-tuyet"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicYenChiMauDon = dynamic(() => import("./yen-chi-mau-don"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicNauToiGian = dynamic(() => import("./nau-toi-gian"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicDoTruyenThong = dynamic(() => import("./do-truyen-thong"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicLongPhung = dynamic(() => import("./long-phung"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicChuSaLongPhung = dynamic(() => import("./chu-sa-long-phung"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBichNgocHoangTrieu = dynamic(() => import("./bich-ngoc-hoang-trieu"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicLongPhungEp4 = dynamic(() => import("./long-phung-ep4"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBachNguyet = dynamic(() => import("./bach-nguyet"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicLamHoaVien = dynamic(() => import("./lam-hoa-vien"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBachTraSuongMai = dynamic(() => import("./bach-tra-suong-mai"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicSongHacKimVan = dynamic(() => import("./song-hac-kim-van"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicHacVuLuuLy = dynamic(() => import("./hac-vu-luu-ly"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicDiemPhanKimTo = dynamic(() => import("./diem-phan-kim-to"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicPhiThuyDongDuong = dynamic(() => import("./phi-thuy-dong-duong"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicHoPhachMatThu = dynamic(() => import("./ho-phach-mat-thu"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicLamTuNgocSuong = dynamic(() => import("./lam-tu-ngoc-suong"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicTuDangDaKhuc = dynamic(() => import("./tu-dang-da-khuc"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicHuyenKimLongPhung = dynamic(() => import("./huyen-kim-long-phung"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicHacKimNhatThuc = dynamic(() => import("./hac-kim-nhat-thuc"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicDaYenPhaLe = dynamic(() => import("./da-yen-pha-le"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicMacLamKimTuyen = dynamic(() => import("./mac-lam-kim-tuyen"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicDoRuouVang = dynamic(() => import("./do-ruou-vang"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicMinimalRed = dynamic(() => import("./minimal-red"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicMocHuongNangThu = dynamic(() => import("./moc-huong-nang-thu"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicFloweryWhite = dynamic(() => import("./flowery-white"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBanSacHuongCang = dynamic(() => import("./ban-sac-huong-cang"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicCuuLongHyYen = dynamic(() => import("./cuu-long-hy-yen"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicDaAnhHuongCang = dynamic(() => import("./da-anh-huong-cang"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicHaoQuangHuongCang = dynamic(() => import("./hao-quang-huong-cang"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicHuongCangDemNeon = dynamic(() => import("./huong-cang-dem-neon"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicNhatKyMuaYeu = dynamic(() => import("./nhat-ky-mua-yeu"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicMotThoiDeNho = dynamic(() => import("./mot-thoi-de-nho"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicLongPhungEp2 = dynamic(() => import("./long-phung-ep2"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicLongPhungEp3 = dynamic(() => import("./long-phung-ep3"), {
  loading: () => <TemplateLoadingFallback />,
});
const DynamicBasic3 = dynamic(() => import("./basic-3"), {
  loading: () => <TemplateLoadingFallback />,
});

export interface TemplatePreviewRendererProps extends WeddingTemplateProps {
  templateId: string;
  experienceMode?: InvitationExperienceMode;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

function TemplatePreviewRendererInner({
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
    case "do-ruou-vang":
      return <DynamicDoRuouVang {...props} />;
    case "minimal-red":
      return <DynamicMinimalRed {...props} />;
    case "moc-huong-nang-thu":
    case "moc_huong_nang_thu":
      return <DynamicMocHuongNangThu {...props} />;
    case "flowery-white":
      return <DynamicFloweryWhite {...props} />;
    case "long-phung":
      return <DynamicLongPhung {...props} />;
    case "chu-sa-long-phung":
    case "chu_sa_long_phung":
      return <DynamicChuSaLongPhung {...props} />;
    case "bich-ngoc-hoang-trieu":
    case "bich_ngoc_hoang_trieu":
      return <DynamicBichNgocHoangTrieu {...props} />;
    case "long-phung-ep2":
      return <DynamicLongPhungEp2 {...props} />;
    case "long-phung-ep3":
      return <DynamicLongPhungEp3 {...props} />;
    case "long-phung-ep4":
      return <DynamicLongPhungEp4 {...props} />;
    case "bach-nguyet":
    case "bach_nguyet":
      return <DynamicBachNguyet {...props} />;
    case "lam-hoa-vien":
    case "lam_hoa_vien":
      return <DynamicLamHoaVien {...props} />;
    case "bach-tra-suong-mai":
    case "bach_tra_suong_mai":
      return <DynamicBachTraSuongMai {...props} />;
    case "song-hac-kim-van":
    case "song_hac_kim_van":
      return <DynamicSongHacKimVan {...props} />;
    case "hac-vu-luu-ly":
    case "hac_vu_luu_ly":
      return <DynamicHacVuLuuLy {...props} />;
    case "diem-phan-kim-to":
    case "diem_phan_kim_to":
      return <DynamicDiemPhanKimTo {...props} />;
    case "phi-thuy-dong-duong":
    case "phi_thuy_dong_duong":
      return <DynamicPhiThuyDongDuong {...props} />;
    case "ho-phach-mat-thu":
    case "ho_phach_mat_thu":
      return <DynamicHoPhachMatThu {...props} />;
    case "lam-tu-ngoc-suong":
    case "lam_tu_ngoc_suong":
      return <DynamicLamTuNgocSuong {...props} />;
    case "tu-dang-da-khuc":
    case "tu_dang_da_khuc":
      return <DynamicTuDangDaKhuc {...props} />;
    case "huyen-kim-long-phung":
    case "huyen_kim_long_phung":
      return <DynamicHuyenKimLongPhung {...props} />;
    case "hac-kim-nhat-thuc":
    case "hac_kim_nhat_thuc":
      return <DynamicHacKimNhatThuc {...props} />;
    case "da-yen-pha-le":
    case "da_yen_pha_le":
      return <DynamicDaYenPhaLe {...props} />;
    case "mac-lam-kim-tuyen":
    case "mac_lam_kim_tuyen":
      return <DynamicMacLamKimTuyen {...props} />;
    case "do-truyen-thong":
      return <DynamicDoTruyenThong {...props} />;
    case "nau-toi-gian":
      return <DynamicNauToiGian {...props} />;
    case "yen-chi-mau-don":
    case "yen_chi_mau_don":
      return <DynamicYenChiMauDon {...props} />;
    case "anh-dao-phan-tuyet":
      return <DynamicAnhDaoPhanTuyet {...props} />;
    case "bach-lan-lua-nga":
    case "ritual-gia-tien":
      return <DynamicBachLanLuaNga {...props} />;
    case "rang-hong-hoang-hon":
    case "rang_hong_hoang_hon":
      return <DynamicRangHongHoangHon {...props} />;
    case "phuong-loan-gam-do":
      return <DynamicPhuongLoanGamDo {...props} />;
    case "thanh-mai-ngoc-lan":
    case "thanh_mai_ngoc_lan":
      return <DynamicThanhMaiNgocLan {...props} />;
    case "song-hy-v2-do":
      return <DynamicSongHyV2Do {...props} />;
    case "song-phung-bich-dao":
      return <DynamicSongPhungBichDao {...props} />;
    case "to-hong-lua-tham":
      return <DynamicToHongLuaTham {...props} />;
    case "ban-sac-huong-cang":
    case "ban_sac_huong_cang":
      return <DynamicBanSacHuongCang {...props} />;
    case "cuu-long-hy-yen":
    case "cuu_long_hy_yen":
      return <DynamicCuuLongHyYen {...props} />;
    case "da-anh-huong-cang":
    case "da_anh_huong_cang":
      return <DynamicDaAnhHuongCang {...props} />;
    case "hao-quang-huong-cang":
    case "hao_quang_huong_cang":
      return <DynamicHaoQuangHuongCang {...props} />;
    case "huong-cang-dem-neon":
    case "huong_cang_dem_neon":
      return <DynamicHuongCangDemNeon {...props} />;
    case "nhat-ky-mua-yeu":
    case "nhat_ky_mua_yeu":
      return <DynamicNhatKyMuaYeu {...props} />;
    case "mot-thoi-de-nho":
    case "mot_thoi_de_nho":
      return <DynamicMotThoiDeNho {...props} />;
    case "vuonkinh-xanh":
      return <DynamicVuonkinhXanh {...props} />;
    case "vuon-o-liu":
    case "basic-3":
      return <DynamicBasic3 {...props} />;
    case "basic-1":
    case "ritual-an-hoi":
    default:
      return <DynamicBasic1 {...props} />;
  }
}

/**
 * Mọi màn hình render template đều đi qua đây (thiệp thật, preview, demo,
 * dashboard, landing), nên đặt LazyMotion và InvitationExperienceProvider ở đây
 * là đủ để `m` luôn có context và toàn bộ 100% template có chung trải nghiệm
 * phát nhạc đồng bộ + Auto-Scroll mượt mà.
 */
export function TemplatePreviewRenderer(props: TemplatePreviewRendererProps) {
  const {
    onOpenedChange: userOnOpenedChange,
    externalMusicControl,
    experienceMode: explicitExperienceMode,
    scrollContainerRef,
    ...restProps
  } = props;

  const experienceMode: InvitationExperienceMode =
    explicitExperienceMode ??
    (props.mode === "live"
      ? "guest"
      : props.mode === "demo" && !props.contained
        ? "standalone-preview"
        : props.mode === "preview"
          ? "editor"
          : "card-preview");

  const handleOpenedChange = React.useCallback(
    (opened: boolean) => {
      if (opened) {
        playOpenCardSound();
      }
      userOnOpenedChange?.(opened);
    },
    [userOnOpenedChange],
  );

  React.useEffect(() => {
    const handleEnvelopeOpen = () => {
      playOpenCardSound();
    };
    window.addEventListener("inviwedd:open-envelope", handleEnvelopeOpen);
    return () => {
      window.removeEventListener("inviwedd:open-envelope", handleEnvelopeOpen);
    };
  }, []);

  return (
    <MotionProvider>
      <InvitationExperienceProvider
        musicSrc={props.data?.music?.src}
        musicTitle={props.data?.music?.title}
        mode={experienceMode}
        initialOpened={props.isOpened}
        onOpenedChange={handleOpenedChange}
        scrollContainerRef={scrollContainerRef}
      >
        <TemplatePreviewRendererInner
          {...restProps}
          onOpenedChange={handleOpenedChange}
          externalMusicControl={externalMusicControl ?? true}
        />
      </InvitationExperienceProvider>
    </MotionProvider>
  );
}
