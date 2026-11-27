"use client";

import * as React from "react";
import jsQR from "jsqr";
import {
  AlertCircle,
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Undo2,
  UserCheck,
  Utensils,
  Volume2,
  Zap,
  ZapOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  extractGuestSlugFromQr,
  formatCheckInTime,
  calculateTableOccupancy,
  type TableOccupancyInfo,
} from "@/lib/checkin-utils";
import type { FamilyShareGuest } from "./FamilySharePortal";

interface QrCheckInScannerProps {
  weddingSlug: string;
  guests: FamilyShareGuest[];
  onGuestsUpdated: (updatedGuests: FamilyShareGuest[]) => void;
}

interface ScanFeedback {
  type: "success" | "already" | "invalid";
  guest?: FamilyShareGuest;
  message?: string;
  previousCheckedInAt?: string | null;
}

export function QrCheckInScanner({
  weddingSlug,
  guests,
  onGuestsUpdated,
}: QrCheckInScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const lastScanTimeRef = React.useRef<number>(0);
  const lastScannedCodeRef = React.useRef<string | null>(null);

  // Camera states
  const [cameraActive, setCameraActive] = React.useState(true);
  const [torchActive, setTorchActive] = React.useState(false);
  const [torchSupported, setTorchSupported] = React.useState(false);
  const [permissionState, setPermissionState] = React.useState<
    "idle" | "granted" | "denied" | "unsupported"
  >("idle");
  const [cameraError, setCameraError] = React.useState<string | null>(null);

  // Scan feedback & processing state
  const [scanFeedback, setScanFeedback] = React.useState<ScanFeedback | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [stepperCount, setStepperCount] = React.useState<number>(1);

  // Manual search fallback state
  const [manualQuery, setManualQuery] = React.useState("");

  // Dừng camera an toàn
  const stopCamera = React.useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchActive(false);
    setTorchSupported(false);
  }, []);

  // Khởi động camera
  const startCamera = React.useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setPermissionState("unsupported");
      setCameraError(
        "Trình duyệt không hỗ trợ mở camera trực tiếp. Vui lòng mở bằng Safari hoặc Chrome.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setPermissionState("granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Kiểm tra khả năng bật đèn Flash (Torch)
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as
          | { torch?: boolean }
          | undefined;
        if (capabilities && capabilities.torch) {
          setTorchSupported(true);
        }
      }
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : "";
      if (
        errorName === "NotAllowedError" ||
        errorName === "PermissionDeniedError"
      ) {
        setPermissionState("denied");
        setCameraError(
          "Bạn đã từ chối quyền truy cập camera. Vui lòng cấp quyền trong cài đặt trình duyệt hoặc tìm tên check-in bên dưới.",
        );
      } else {
        setPermissionState("unsupported");
        setCameraError(
          "Không thể kết nối đến camera thiết bị. Vui lòng thử lại hoặc mở bằng Safari/Chrome.",
        );
      }
    }
  }, [stopCamera]);

  // Bật/tắt Flash đèn pin
  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchActive;
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchActive(nextState);
    } catch (err) {
      console.warn("Không thể bật/tắt đèn flash:", err);
    }
  };

  // Quản lý vòng đời camera: Dừng khi unmount hoặc tắt camera
  React.useEffect(() => {
    if (cameraActive) {
      void startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [cameraActive, startCamera, stopCamera]);

  // Xử lý gửi Check-in lên Server
  const handlePerformCheckIn = React.useCallback(
    async (targetGuest: FamilyShareGuest, arrivedCountOverride?: number) => {
      setIsProcessing(true);

      const targetHeadcount =
        arrivedCountOverride ??
        (typeof targetGuest.checkedInCount === "number" && targetGuest.checkedInCount > 0
          ? targetGuest.checkedInCount
          : 1 + Math.max(0, targetGuest.plusOnes ?? 0));

      setStepperCount(targetHeadcount);

      try {
        const res = await fetch("/api/share/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: weddingSlug,
            guestId: targetGuest.id,
            arrivedCount: targetHeadcount,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Không thể thực hiện check-in.");
        }

        // Rung nhẹ haptic feedback nếu thiết bị hỗ trợ
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(100);
        }

        const updatedGuest: FamilyShareGuest = {
          ...targetGuest,
          checkedInAt: data.guest.checkedInAt,
          checkedInCount: data.guest.checkedInCount,
          tableNumber: data.guest.tableNumber ?? targetGuest.tableNumber,
        };

        // Cập nhật danh sách khách mời trong state cha
        onGuestsUpdated(
          guests.map((g) => (g.id === updatedGuest.id ? updatedGuest : g)),
        );

        setScanFeedback({
          type: data.alreadyCheckedIn ? "already" : "success",
          guest: updatedGuest,
          previousCheckedInAt: data.previousCheckedInAt,
        });
      } catch (err) {
        setScanFeedback({
          type: "invalid",
          message: err instanceof Error ? err.message : "Lỗi check-in.",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [guests, onGuestsUpdated, weddingSlug],
  );

  // Xử lý Hoàn tác (Undo) Check-in
  const handleUndoCheckIn = React.useCallback(
    async (guestId: string) => {
      setIsProcessing(true);
      try {
        const res = await fetch("/api/share/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: weddingSlug,
            guestId,
            undo: true,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Không thể hoàn tác check-in.");
        }

        const nextGuests = guests.map((g) =>
          g.id === guestId ? { ...g, checkedInAt: null, checkedInCount: null } : g,
        );
        onGuestsUpdated(nextGuests);

        if (scanFeedback?.guest?.id === guestId) {
          setScanFeedback(null);
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Không thể hoàn tác.");
      } finally {
        setIsProcessing(false);
      }
    },
    [guests, onGuestsUpdated, scanFeedback, weddingSlug],
  );

  // Xử lý mã QR khi camera phát hiện
  const handleQrDetected = React.useCallback(
    (codeText: string) => {
      const now = Date.now();
      // Debounce 2500ms chống quét trùng lặp liên tục khi giơ điện thoại
      if (
        codeText === lastScannedCodeRef.current &&
        now - lastScanTimeRef.current < 2500
      ) {
        return;
      }

      lastScanTimeRef.current = now;
      lastScannedCodeRef.current = codeText;

      const slug = extractGuestSlugFromQr(codeText);
      if (!slug) {
        setScanFeedback({
          type: "invalid",
          message: "Mã QR không hợp lệ hoặc không thuộc hệ thống thiệp cưới.",
        });
        return;
      }

      // Tìm khách mời trong danh sách
      const foundGuest = guests.find(
        (g) => g.slug.toLowerCase() === slug.toLowerCase() || g.id === slug,
      );

      if (!foundGuest) {
        setScanFeedback({
          type: "invalid",
          message:
            "Không tìm thấy khách mời này trong tiệc cưới. Vui lòng kiểm tra lại mã QR.",
        });
        return;
      }

      void handlePerformCheckIn(foundGuest);
    },
    [guests, handlePerformCheckIn],
  );

  // Vòng lặp quét frame từ video canvas (Throttled ~8-10 FPS để tiết kiệm pin)
  React.useEffect(() => {
    if (!cameraActive || permissionState !== "granted" || scanFeedback !== null) {
      return;
    }

    let isScanning = true;

    const scanFrame = () => {
      if (!isScanning) return;

      const now = Date.now();
      // Giới hạn tần suất phân tích frame: mỗi 110ms (~9 FPS)
      if (now - lastScanTimeRef.current >= 110) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (
          video &&
          canvas &&
          video.readyState === video.HAVE_ENOUGH_DATA &&
          video.videoWidth > 0
        ) {
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (qrCode && qrCode.data) {
              handleQrDetected(qrCode.data);
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [cameraActive, permissionState, scanFeedback, handleQrDetected]);

  // Cập nhật số người đến thực tế (Stepper +/-)
  const handleUpdateStepper = (delta: number) => {
    const next = Math.max(1, stepperCount + delta);
    setStepperCount(next);
    if (scanFeedback?.guest) {
      void handlePerformCheckIn(scanFeedback.guest, next);
    }
  };

  // Tìm kiếm khách mời thủ công
  const manualFilteredGuests = React.useMemo(() => {
    const q = manualQuery.toLowerCase().trim();
    if (!q) return guests.slice(0, 15);
    return guests
      .filter((g) => {
        const matchName = g.name.toLowerCase().includes(q);
        const matchTable = (g.tableNumber || "").toLowerCase().includes(q);
        const matchSlug = g.slug.toLowerCase().includes(q);
        return matchName || matchTable || matchSlug;
      })
      .slice(0, 30);
  }, [guests, manualQuery]);

  // Tính toán tiến độ khách đã đến
  const occupancyStats = React.useMemo(
    () => calculateTableOccupancy(guests),
    [guests],
  );

  return (
    <div className="space-y-6">
      {/* 1. Viewfinder Camera Quét QR */}
      <div className="relative mx-auto max-w-sm overflow-hidden rounded-3xl border border-[#E8E2D9] bg-[#141210] shadow-xl">
        {/* Aspect-Square Camera Viewport */}
        <div className="relative aspect-square w-full overflow-hidden bg-black">
          {cameraActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          )}

          {/* Canvas ẩn để trích xuất frame */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Khi camera bị tắt hoặc có lỗi */}
          {!cameraActive ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-[#FAF8F5]/80">
              <CameraOff className="h-10 w-10 text-[#B89B72]/60" />
              <p className="mt-3 text-xs font-medium">Camera đang tắt để tiết kiệm pin</p>
              <button
                type="button"
                onClick={() => setCameraActive(true)}
                className="mt-4 rounded-full bg-[#7A1C24] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#5E141B]"
              >
                Bật lại Camera
              </button>
            </div>
          ) : cameraError ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-[#FAF8F5]">
              <AlertCircle className="h-10 w-10 text-rose-400" />
              <p className="mt-3 text-xs font-medium text-rose-200">{cameraError}</p>
              <button
                type="button"
                onClick={() => void startCamera()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xs hover:bg-white/30"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : (
            <>
              {/* Antique Gold Viewfinder Corner Brackets */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-8"
              >
                {/* Top-Left */}
                <div className="absolute top-0 left-0 h-8 w-8 rounded-tl-xl border-t-3 border-l-3 border-[#B89B72]" />
                {/* Top-Right */}
                <div className="absolute top-0 right-0 h-8 w-8 rounded-tr-xl border-t-3 border-r-3 border-[#B89B72]" />
                {/* Bottom-Left */}
                <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-3 border-l-3 border-[#B89B72]" />
                {/* Bottom-Right */}
                <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-3 border-r-3 border-[#B89B72]" />

                {/* Subtle Moving Scanline Animation */}
                <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#B89B72] to-transparent shadow-[0_0_12px_#B89B72] animate-bounce" />
              </div>

              {/* Viewfinder Overlay Controls */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {torchSupported && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    aria-label={torchActive ? "Tắt đèn flash" : "Bật đèn flash"}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-colors",
                      torchActive
                        ? "bg-[#B89B72] text-[#141210]"
                        : "bg-black/50 text-[#FAF8F5] hover:bg-black/70",
                    )}
                  >
                    {torchActive ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCameraActive(false)}
                  aria-label="Tắt camera"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-[#FAF8F5] backdrop-blur-md transition-colors hover:bg-black/70"
                >
                  <CameraOff className="h-4 w-4" />
                </button>
              </div>

              {/* Helper badge inside viewfinder */}
              <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center">
                <span className="rounded-full bg-black/60 px-3.5 py-1 text-[11px] font-medium text-[#FAF8F5]/90 backdrop-blur-xs">
                  Hướng camera vào mã QR trên vé mời
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Result Bottom Sheet / Card (Khi vừa quét hoặc bấm check-in) */}
      {scanFeedback && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "mx-auto max-w-sm rounded-3xl border p-5 shadow-lg transition-all animate-in fade-in zoom-in-95",
            scanFeedback.type === "success" && "border-[#2F6F4E] bg-[#ECF5F0]",
            scanFeedback.type === "already" && "border-[#B89B72] bg-[#FAF3E3]",
            scanFeedback.type === "invalid" && "border-[#9E3B3B] bg-[#FBEFEF]",
          )}
        >
          {scanFeedback.type === "invalid" ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-serif text-lg font-bold text-[#1F1D1A]">
                Không thể check-in
              </h3>
              <p className="mt-1 text-xs text-[#6B655E]">
                {scanFeedback.message || "Mã QR không hợp lệ hoặc không thuộc tiệc cưới này."}
              </p>
              <button
                type="button"
                onClick={() => setScanFeedback(null)}
                className="mt-4 rounded-full bg-[#1F1D1A] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#151412]"
              >
                Tiếp tục quét
              </button>
            </div>
          ) : scanFeedback.guest ? (
            <div className="text-center">
              {/* Header status */}
              <div className="flex items-center justify-center gap-1.5">
                {scanFeedback.type === "already" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#8A6D3B]/15 px-3 py-0.5 text-[11px] font-semibold text-[#8A6D3B]">
                    <Clock className="h-3 w-3" />
                    Đã check-in lúc {formatCheckInTime(scanFeedback.previousCheckedInAt)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#2F6F4E]/15 px-3 py-0.5 text-[11px] font-semibold text-[#2F6F4E]">
                    <CheckCircle2 className="h-3 w-3" />
                    Check-in thành công
                  </span>
                )}
              </div>

              {/* Tên khách mời */}
              <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#1F1D1A]">
                {scanFeedback.guest.name}
              </h2>

              {/* HUGE Table Badge: Giúp người đón khách chỉ bàn trong 1 giây */}
              <div className="my-3.5 rounded-2xl border border-[#E8E2D9] bg-white py-4 px-2 shadow-2xs">
                <p className="text-[10px] font-bold tracking-[0.2em] text-[#6B655E] uppercase">
                  Vị trí bàn tiệc
                </p>
                <p className="mt-1 font-serif text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-[#7A1C24]">
                  {scanFeedback.guest.tableNumber
                    ? /^bàn\s*/i.test(scanFeedback.guest.tableNumber)
                      ? scanFeedback.guest.tableNumber.toUpperCase()
                      : `BÀN ${scanFeedback.guest.tableNumber.toUpperCase()}`
                    : "CHƯA XẾP BÀN"}
                </p>
              </div>

              {/* Thông tin khẩu phần ăn & Số người đi cùng */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-1 font-medium text-[#1F1D1A]">
                  Khẩu phần: {scanFeedback.guest.diet === "veg" ? "Ăn chay" : "Ăn mặn"}
                </span>

                {/* Stepper điều chỉnh số người thực tế có mặt */}
                <div className="inline-flex items-center rounded-full border border-[#E8E2D9] bg-white px-2 py-0.5 shadow-2xs">
                  <span className="text-[11px] text-[#6B655E] mr-1.5">Số khách đến:</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateStepper(-1)}
                    disabled={isProcessing || stepperCount <= 1}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF8F5] text-[#1F1D1A] hover:bg-[#E8E2D9] disabled:opacity-40"
                    aria-label="Giảm 1 người"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs tabular-nums text-[#1F1D1A]">
                    {stepperCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateStepper(1)}
                    disabled={isProcessing}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF8F5] text-[#1F1D1A] hover:bg-[#E8E2D9]"
                    aria-label="Thêm 1 người"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Nút Tiếp tục quét & Hoàn tác */}
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setScanFeedback(null)}
                  className="flex-1 rounded-full bg-[#1F1D1A] py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#151412]"
                >
                  Tiếp tục quét tiếp
                </button>
                <button
                  type="button"
                  onClick={() => handleUndoCheckIn(scanFeedback.guest!.id)}
                  disabled={isProcessing}
                  title="Hủy check-in nếu lỡ ấn nhầm"
                  className="inline-flex items-center gap-1 rounded-full border border-[#E8E2D9] bg-white px-3 py-2.5 text-xs font-medium text-[#6B655E] hover:text-[#9E3B3B] disabled:opacity-50"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span>Hoàn tác</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 3. Manual Search Check-In Fallback (Dành cho khách lớn tuổi hoặc không cầm điện thoại) */}
      <div className="rounded-3xl border border-[#E8E2D9] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1F1D1A]">
              Tìm tên check-in thủ công
            </h3>
            <p className="text-xs text-[#6B655E]">
              Dành cho khách không có mã QR hoặc đón khách đông cùng lúc
            </p>
          </div>
          <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-0.5 text-[11px] font-mono font-semibold text-[#1F1D1A]">
            {occupancyStats.totalArrivedGuests}/{occupancyStats.totalGuests} đã đến
          </span>
        </div>

        {/* Search input */}
        <div className="relative mt-3.5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B655E]" />
          <input
            type="search"
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            placeholder="Tìm theo tên khách, số bàn (vd: Bàn 08, Chú Ba)..."
            className="h-10 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] pl-10 pr-4 text-xs text-[#1F1D1A] placeholder:text-[#6B655E] focus:border-[#7A1C24] focus:bg-white focus:outline-none"
          />
        </div>

        {/* Guest Search Results Table / Cards */}
        <div className="mt-4 divide-y divide-[#E8E2D9]/70 max-h-96 overflow-y-auto pr-1">
          {manualFilteredGuests.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#6B655E]">
              Không tìm thấy khách mời nào phù hợp với từ khóa &ldquo;{manualQuery}&rdquo;.
            </p>
          ) : (
            manualFilteredGuests.map((guest) => {
              const isCheckedIn = Boolean(guest.checkedInAt);
              const headcount =
                guest.checkedInCount ?? 1 + Math.max(0, guest.plusOnes ?? 0);

              return (
                <div
                  key={guest.id}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-[#FAF8F5]/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-[#1F1D1A] truncate">
                        {guest.name}
                      </p>
                      {guest.tableNumber ? (
                        <span className="rounded-full bg-[#7A1C24]/10 px-2 py-0.5 text-[10px] font-semibold text-[#7A1C24]">
                          {guest.tableNumber}
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-2 py-0.5 text-[10px] text-[#6B655E]">
                          Chưa xếp bàn
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#6B655E]">
                      <span>{headcount} người</span>
                      <span>·</span>
                      <span>{guest.diet === "veg" ? "Ăn chay" : "Ăn mặn"}</span>
                      {isCheckedIn && (
                        <>
                          <span>·</span>
                          <span className="text-[#2F6F4E] font-medium">
                            Đã đến {formatCheckInTime(guest.checkedInAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Nút Check-in 1-chạm hoặc Hoàn tác */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCheckedIn ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#ECF5F0] border border-[#2F6F4E]/40 px-2.5 py-1 text-xs font-semibold text-[#2F6F4E]">
                          <Check className="h-3.5 w-3.5" />
                          <span>Đã đến</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUndoCheckIn(guest.id)}
                          disabled={isProcessing}
                          className="cursor-pointer text-[10px] text-[#6B655E] underline hover:text-[#9E3B3B] p-1"
                        >
                          Hoàn tác
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handlePerformCheckIn(guest)}
                        disabled={isProcessing}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-[#7A1C24] px-3.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#5E141B] disabled:opacity-50"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Check-in</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
