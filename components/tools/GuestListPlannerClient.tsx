"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  ListChecks,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { SmartToolCta } from "@/components/tools/SmartToolCta";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import {
  autoAssignTablesByGroup,
  buildGuestListCsv,
  buildInviweddBulkTsv,
  buildSampleGuests,
  CEREMONY_OPTIONS,
  clampPlusOnes,
  clampSeatsPerTable,
  createGuestRowId,
  DEFAULT_SEATS_PER_TABLE,
  getCeremonyLabel,
  getSideLabel,
  MAX_PLUS_ONES,
  MAX_SEATS_PER_TABLE,
  MIN_SEATS_PER_TABLE,
  parseQuickLinesToRows,
  ROLE_OPTIONS,
  SIDE_OPTIONS,
  summarizeGuestPlan,
  type CeremonyId,
  type GuestPlanRow,
  type GuestSide,
} from "@/lib/guest-list-planner";
import type { RelationshipGroup } from "@/lib/salutation-engine";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "inviwedd_guest_list_planner_v1";

type WizardStep = 1 | 2 | 3 | "result";

interface StoredPlannerState {
  step: WizardStep;
  activeCeremonies: CeremonyId[];
  seatsPerTable: number;
  guests: GuestPlanRow[];
  savedAt: string;
}

const CEREMONY_PRESETS: ReadonlyArray<{
  id: string;
  title: string;
  description: string;
  ceremonies: CeremonyId[];
  badge?: string;
}> = [
  {
    id: "both_and_banquet",
    title: "Cả 2 lễ gia tiên + Tiệc cưới",
    description: "Tách riêng khách đi Lễ Vu Quy, Lễ Thành Hôn và Tiệc Cưới nhà hàng.",
    ceremonies: ["vu_quy", "thanh_hon", "tiec_cuoi"],
    badge: "Phổ biến nhất",
  },
  {
    id: "groom_only",
    title: "Lễ Thành Hôn & Tiệc Cưới",
    description: "Phù hợp khi nhà trai tổ chức lễ đón dâu và tiệc chiêu đãi chung.",
    ceremonies: ["thanh_hon", "tiec_cuoi"],
  },
  {
    id: "bride_only",
    title: "Lễ Vu Quy & Tiệc Cưới",
    description: "Phù hợp khi nhà gái lên danh sách cho lễ gia tiên và tiệc báo hỷ.",
    ceremonies: ["vu_quy", "tiec_cuoi"],
  },
  {
    id: "banquet_only",
    title: "Chỉ 1 buổi Tiệc Cưới chung",
    description: "Gộp toàn bộ khách hai họ, bạn bè và đồng nghiệp vào một bảng.",
    ceremonies: ["tiec_cuoi"],
  },
];

const TABLE_SIZE_PRESETS: ReadonlyArray<{
  seats: number;
  title: string;
  hint: string;
  badge?: string;
}> = [
  {
    seats: 10,
    title: "10 người / bàn",
    hint: "Chuẩn bàn tròn nhà hàng & trung tâm tiệc cưới",
    badge: "Phổ biến nhất",
  },
  {
    seats: 8,
    title: "8 người / bàn",
    hint: "Ngồi rộng rãi, phù hợp tiệc thân mật hoặc gia đình có trẻ nhỏ",
  },
  {
    seats: 12,
    title: "12 người / bàn",
    hint: "Bàn cỗ truyền thống hoặc mâm gia đình đông người",
  },
  {
    seats: 6,
    title: "6 người / bàn",
    hint: "Bàn dài sân vườn, rooftop hoặc tiệc báo hỷ quy mô nhỏ",
  },
];

async function copyTextToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    throw new Error("Clipboard unavailable");
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

function isCeremonyId(value: unknown): value is CeremonyId {
  return value === "vu_quy" || value === "thanh_hon" || value === "tiec_cuoi";
}

function isGuestSide(value: unknown): value is GuestSide {
  return (
    value === "nha_trai" ||
    value === "nha_gai" ||
    value === "ban_be" ||
    value === "dong_nghiep"
  );
}

function isRoleGroup(value: unknown): value is RelationshipGroup {
  return (
    value === "elder" ||
    value === "family" ||
    value === "peer_formal" ||
    value === "close_friend"
  );
}

function sanitizeStoredGuests(raw: unknown): GuestPlanRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const name = typeof item.name === "string" ? item.name.slice(0, 120) : "";
      const ceremonies: CeremonyId[] = Array.isArray(item.ceremonies)
        ? item.ceremonies.filter(isCeremonyId)
        : [];
      const resolvedCeremonies: CeremonyId[] =
        ceremonies.length > 0 ? ceremonies : ["tiec_cuoi"];

      return {
        id: typeof item.id === "string" && item.id ? item.id : createGuestRowId(),
        name,
        side: isGuestSide(item.side) ? item.side : "ban_be",
        role: isRoleGroup(item.role) ? item.role : "peer_formal",
        ceremonies: resolvedCeremonies,
        plusOnes: clampPlusOnes(typeof item.plusOnes === "number" ? item.plusOnes : 0),
        tableLabel: typeof item.tableLabel === "string" ? item.tableLabel.slice(0, 32) : "",
        note: typeof item.note === "string" ? item.note.slice(0, 120) : "",
      };
    })
    .filter((row) => row.name.trim().length > 0);
}

function formatSavedTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function GuestListPlannerClient() {
  const [step, setStep] = React.useState<WizardStep>(1);
  const [activeCeremonies, setActiveCeremonies] = React.useState<CeremonyId[]>([
    "vu_quy",
    "thanh_hon",
    "tiec_cuoi",
  ]);
  const [showCustomCeremonies, setShowCustomCeremonies] = React.useState(false);
  const [seatsPerTable, setSeatsPerTable] = React.useState<number>(DEFAULT_SEATS_PER_TABLE);
  const [customSeatsInput, setCustomSeatsInput] = React.useState<string>("10");
  const [guests, setGuests] = React.useState<GuestPlanRow[]>([]);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  // Step 3 bulk starter drawer state
  const [step3Mode, setStep3Mode] = React.useState<"choose" | "paste">("choose");
  const [step3PasteText, setStep3PasteText] = React.useState("");
  const [step3PasteSide, setStep3PasteSide] = React.useState<GuestSide>("ban_be");

  // Result filters & forms
  const [sideFilter, setSideFilter] = React.useState<GuestSide | "all">("all");
  const [ceremonyFilter, setCeremonyFilter] = React.useState<CeremonyId | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Quick-add row state
  const [newName, setNewName] = React.useState("");
  const [newSide, setNewSide] = React.useState<GuestSide>("ban_be");
  const [newRole, setNewRole] = React.useState<RelationshipGroup>("close_friend");
  const [newPlusOnes, setNewPlusOnes] = React.useState<number>(0);
  const [newTable, setNewTable] = React.useState("");
  const [newCeremonies, setNewCeremonies] = React.useState<CeremonyId[]>(["tiec_cuoi"]);
  const [quickAddError, setQuickAddError] = React.useState<string | null>(null);

  // Result inline paste drawer + feedback
  const [resultPasteOpen, setResultPasteOpen] = React.useState(false);
  const [resultPasteText, setResultPasteText] = React.useState("");
  const [resultPasteSide, setResultPasteSide] = React.useState<GuestSide>("ban_be");
  const [copyStatus, setCopyStatus] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = React.useState(false);

  // Focus heading on explicit step transition
  const stepHeadingRef = React.useRef<HTMLHeadingElement | null>(null);
  const shouldMoveFocusRef = React.useRef(false);

  // Hydrate saved state on mount asynchronously so React avoids synchronous setState inside effect
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<StoredPlannerState>;
          const ceremonies = Array.isArray(parsed.activeCeremonies)
            ? parsed.activeCeremonies.filter(isCeremonyId)
            : [];
          const validCeremonies: CeremonyId[] =
            ceremonies.length > 0 ? ceremonies : ["vu_quy", "thanh_hon", "tiec_cuoi"];
          const validSeats = clampSeatsPerTable(parsed.seatsPerTable ?? DEFAULT_SEATS_PER_TABLE);
          const validGuests = sanitizeStoredGuests(parsed.guests);

          setActiveCeremonies(validCeremonies);
          setNewCeremonies(validCeremonies);
          setSeatsPerTable(validSeats);
          setCustomSeatsInput(String(validSeats));
          setGuests(validGuests);
          if (parsed.step === "result" && validGuests.length > 0) {
            setStep("result");
          }
          if (typeof parsed.savedAt === "string") {
            setSavedAt(parsed.savedAt);
          }
        }
      } catch {
        // Bỏ qua lỗi đọc localStorage ở chế độ ẩn danh
      } finally {
        setHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Save state to localStorage when entering result or mutating guests
  React.useEffect(() => {
    if (!hydrated) return;
    if (step !== "result" && guests.length === 0) return;

    const payload: StoredPlannerState = {
      step,
      activeCeremonies,
      seatsPerTable,
      guests,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota exceeded
    }
  }, [hydrated, step, activeCeremonies, seatsPerTable, guests]);

  React.useEffect(() => {
    if (!shouldMoveFocusRef.current) return;
    shouldMoveFocusRef.current = false;
    stepHeadingRef.current?.focus();
  }, [step]);

  const goToStep = (next: WizardStep) => {
    shouldMoveFocusRef.current = true;
    setStep(next);
  };

  // Wizard Step 1 handlers
  const handleSelectCeremonyPreset = (ceremonies: CeremonyId[]) => {
    setActiveCeremonies(ceremonies);
    setNewCeremonies(ceremonies);
    goToStep(2);
  };

  const handleToggleCustomCeremony = (id: CeremonyId) => {
    setActiveCeremonies((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      setNewCeremonies(next.length > 0 ? next : [id]);
      return next;
    });
  };

  // Wizard Step 2 handlers
  const handleSelectSeatsPreset = (seats: number) => {
    const safeSeats = clampSeatsPerTable(seats);
    setSeatsPerTable(safeSeats);
    setCustomSeatsInput(String(safeSeats));
    goToStep(3);
  };

  const handleConfirmCustomSeats = () => {
    const safeSeats = clampSeatsPerTable(customSeatsInput);
    setSeatsPerTable(safeSeats);
    setCustomSeatsInput(String(safeSeats));
    goToStep(3);
  };

  // Wizard Step 3 handlers
  const handleStartWithSample = () => {
    const safeCeremonies: CeremonyId[] =
      activeCeremonies.length > 0 ? activeCeremonies : ["tiec_cuoi"];
    setGuests(buildSampleGuests(safeCeremonies));
    setSideFilter("all");
    setCeremonyFilter("all");
    goToStep("result");
  };

  const handleStartBlank = () => {
    setGuests([]);
    setSideFilter("all");
    setCeremonyFilter("all");
    goToStep("result");
  };

  const handleImportFromStep3 = () => {
    const rows = parseQuickLinesToRows(step3PasteText, activeCeremonies, step3PasteSide);
    if (rows.length === 0) {
      setActionNotice("Chưa có tên khách hợp lệ. Bạn có thể nạp mẫu hoặc bắt đầu bảng trống.");
      return;
    }
    setGuests(rows);
    setActionNotice(null);
    setStep3PasteText("");
    setStep3Mode("choose");
    goToStep("result");
  };

  // Result table handlers
  const summary = React.useMemo(
    () => summarizeGuestPlan(guests, activeCeremonies, seatsPerTable),
    [guests, activeCeremonies, seatsPerTable],
  );

  const filteredGuests = React.useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return guests.filter((g) => {
      if (sideFilter !== "all" && g.side !== sideFilter) return false;
      if (ceremonyFilter !== "all" && !g.ceremonies.includes(ceremonyFilter)) return false;
      if (
        keyword &&
        !g.name.toLowerCase().includes(keyword) &&
        !g.tableLabel.toLowerCase().includes(keyword) &&
        !g.note.toLowerCase().includes(keyword)
      ) {
        return false;
      }
      return true;
    });
  }, [guests, sideFilter, ceremonyFilter, searchQuery]);

  const handleAddQuickGuest = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = newName.trim();
    if (!cleanName) {
      setQuickAddError("Vui lòng nhập tên khách mời trước khi thêm.");
      return;
    }
    setQuickAddError(null);
    const ceremoniesToUse =
      newCeremonies.length > 0
        ? newCeremonies
        : activeCeremonies.length > 0
          ? activeCeremonies
          : (["tiec_cuoi"] as CeremonyId[]);

    const newRow: GuestPlanRow = {
      id: createGuestRowId(),
      name: cleanName.slice(0, 120),
      side: newSide,
      role: newRole,
      ceremonies: [...ceremoniesToUse],
      plusOnes: clampPlusOnes(newPlusOnes),
      tableLabel: newTable.trim().slice(0, 32),
      note: "",
    };

    setGuests((prev) => [newRow, ...prev]);
    setNewName("");
    setNewPlusOnes(0);
    setNewTable("");
  };

  const handleAppendBulkInResult = () => {
    const newRows = parseQuickLinesToRows(
      resultPasteText,
      activeCeremonies,
      resultPasteSide,
    );
    if (newRows.length === 0) {
      setActionNotice("Không tìm thấy tên khách mới hợp lệ để thêm.");
      return;
    }
    setGuests((prev) => [...prev, ...newRows]);
    setResultPasteText("");
    setResultPasteOpen(false);
    setActionNotice(`Đã thêm ${newRows.length} khách vào danh sách.`);
  };

  const handleUpdateGuest = (id: string, patch: Partial<GuestPlanRow>) => {
    setGuests((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const handleToggleGuestCeremony = (guestId: string, ceremony: CeremonyId) => {
    setGuests((prev) =>
      prev.map((row) => {
        if (row.id !== guestId) return row;
        const exists = row.ceremonies.includes(ceremony);
        if (exists && row.ceremonies.length === 1) {
          return row;
        }
        const next = exists
          ? row.ceremonies.filter((item) => item !== ceremony)
          : [...row.ceremonies, ceremony];
        return { ...row, ceremonies: next };
      }),
    );
  };

  const handleDeleteGuest = (id: string) => {
    setGuests((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAutoAssignTables = () => {
    if (guests.length === 0) return;
    setGuests((prev) => autoAssignTablesByGroup(prev, seatsPerTable, ceremonyFilter));
    setActionNotice(
      `Đã tự động xếp số bàn theo nhóm (tối đa ${seatsPerTable} người/bàn).`,
    );
  };

  const handleCopyForInviwedd = async () => {
    const tsv = buildInviweddBulkTsv(guests, ceremonyFilter);
    if (!tsv) {
      setCopyStatus("empty");
      return;
    }
    const ok = await copyTextToClipboard(tsv);
    setCopyStatus(ok ? "copied" : "error");
    window.setTimeout(() => {
      setCopyStatus(null);
    }, 3000);
  };

  const handleDownloadCsv = () => {
    if (guests.length === 0) return;
    const csv = buildGuestListCsv(guests);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "danh-sach-khach-moi-dam-cuoi.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setActionNotice("Đã tải file CSV chuẩn UTF-8 cho Excel & Google Sheets.");
  };

  const handleConfirmResetAll = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setGuests([]);
    setSavedAt(null);
    setActionNotice(null);
    setConfirmResetOpen(false);
    setSideFilter("all");
    setCeremonyFilter("all");
    goToStep(1);
  };

  const progressStepNumber = step === "result" ? 4 : step;
  const progressPercent = Math.round((progressStepNumber / 4) * 100);

  return (
    <div className="space-y-8">
      {/* Main Wizard / Workspace Card */}
      <section
        aria-label="Công cụ lập danh sách khách mời theo buổi lễ"
        className="rounded-2xl border border-[#E8E2D9] bg-white p-5 shadow-xs sm:p-7"
      >
        {/* Thin Progress Bar Chrome */}
        <div className="mb-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B655E]">
            <span className="font-semibold tracking-[0.12em] uppercase text-[#8A6D3B]">
              {step === "result" ? "Bảng danh sách & chia bàn" : `Bước ${step} / 3`}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {savedAt && step === "result" ? (
                <span className="inline-flex items-center gap-1 text-[#2F6F4E]">
                  <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Đã lưu trên trình duyệt ({formatSavedTime(savedAt)})
                </span>
              ) : null}
              {step === "result" ? (
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-3 py-1 text-xs font-medium text-[#1F1D1A] transition-colors hover:border-[#B89B72] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#7A1C24]" aria-hidden="true" />
                  Chỉnh buổi lễ / cỡ bàn
                </button>
              ) : null}
            </div>
          </div>
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuenow={progressStepNumber}
            aria-label="Tiến trình thiết lập danh sách khách mời"
            className="h-1.5 w-full overflow-hidden rounded-full bg-[#F4EFEA]"
          >
            <div
              className="h-full rounded-full bg-[#7A1C24] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Choose Ceremonies */}
        {step === 1 ? (
          <div className="mx-auto max-w-2xl py-2">
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="font-serif text-2xl font-normal text-[#1F1D1A] outline-none sm:text-3xl"
            >
              Bạn cần lập danh sách khách cho những buổi lễ nào?
            </h2>
            <p className="mt-2 text-sm text-[#6B655E]">
              Chọn một kịch bản phổ biến để sang bước tiếp theo, hoặc tự chọn từng buổi lễ bên dưới.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {CEREMONY_PRESETS.map((preset) => {
                const isSelected =
                  preset.ceremonies.length === activeCeremonies.length &&
                  preset.ceremonies.every((id) => activeCeremonies.includes(id));

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectCeremonyPreset([...preset.ceremonies])}
                    className={cn(
                      "group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]",
                      isSelected
                        ? "border-[#7A1C24] bg-[#7A1C24]/[0.04]"
                        : "border-[#E8E2D9] bg-[#FAF8F5]/60 hover:border-[#B89B72] hover:bg-white",
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-[#1F1D1A] sm:text-base">
                          {preset.title}
                        </span>
                        {preset.badge ? (
                          <span className="shrink-0 rounded-full bg-[#F4EFEA] px-2.5 py-0.5 text-[11px] font-medium text-[#7A1C24]">
                            {preset.badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#6B655E]">
                        {preset.description}
                      </p>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#7A1C24]">
                      <span>Chọn và tiếp tục</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom multi-select toggle */}
            <div className="mt-5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-4">
              <button
                type="button"
                onClick={() => setShowCustomCeremonies((prev) => !prev)}
                className="text-xs font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
              >
                {showCustomCeremonies
                  ? "Ẩn tùy chọn từng lễ riêng"
                  : "Hoặc tích chọn từng buổi lễ riêng"}
              </button>

              {showCustomCeremonies ? (
                <div className="mt-3 space-y-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {CEREMONY_OPTIONS.map((opt) => {
                      const checked = activeCeremonies.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-xs transition-colors",
                            checked
                              ? "border-[#7A1C24] bg-white"
                              : "border-[#E8E2D9] bg-white/60",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleCustomCeremony(opt.id)}
                            className="mt-0.5 h-4 w-4 accent-[#7A1C24]"
                          />
                          <span>
                            <span className="block font-semibold text-[#1F1D1A]">
                              {opt.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-[#6B655E]">
                              {opt.hint}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      disabled={activeCeremonies.length === 0}
                      onClick={() => goToStep(2)}
                      className="rounded-full bg-[#7A1C24] text-white hover:bg-[#5E141B]"
                    >
                      Tiếp tục bước 2
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E2D9] pt-4">
              {guests.length > 0 ? (
                <button
                  type="button"
                  onClick={() => goToStep("result")}
                  className="text-xs font-medium text-[#1F1D1A] underline underline-offset-4 hover:text-[#7A1C24]"
                >
                  Quay lại bảng danh sách hiện có ({guests.length} khách)
                </button>
              ) : (
                <span className="text-xs text-[#6B655E]">
                  Có thể thêm hoặc tắt từng buổi lễ bất cứ lúc nào sau này.
                </span>
              )}
              <button
                type="button"
                onClick={() =>
                  handleSelectCeremonyPreset(["vu_quy", "thanh_hon", "tiec_cuoi"])
                }
                className="text-xs font-medium text-[#6B655E] hover:text-[#1F1D1A]"
              >
                Bỏ qua, dùng cấu hình mặc định →
              </button>
            </div>
          </div>
        ) : null}

        {/* STEP 2: Seats Per Table */}
        {step === 2 ? (
          <div className="mx-auto max-w-2xl py-2">
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="font-serif text-2xl font-normal text-[#1F1D1A] outline-none sm:text-3xl"
            >
              Mỗi bàn tiệc dự kiến xếp bao nhiêu người?
            </h2>
            <p className="mt-2 text-sm text-[#6B655E]">
              Số ghế mỗi bàn giúp công cụ tính tổng số bàn chính thức và bàn dự phòng cho từng buổi lễ.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {TABLE_SIZE_PRESETS.map((preset) => {
                const isSelected = seatsPerTable === preset.seats;
                return (
                  <button
                    key={preset.seats}
                    type="button"
                    onClick={() => handleSelectSeatsPreset(preset.seats)}
                    className={cn(
                      "group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]",
                      isSelected
                        ? "border-[#7A1C24] bg-[#7A1C24]/[0.04]"
                        : "border-[#E8E2D9] bg-[#FAF8F5]/60 hover:border-[#B89B72] hover:bg-white",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-serif text-xl font-normal text-[#1F1D1A]">
                          {preset.title}
                        </span>
                        {preset.badge ? (
                          <span className="rounded-full bg-[#F4EFEA] px-2.5 py-0.5 text-[11px] font-medium text-[#7A1C24]">
                            {preset.badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#6B655E]">
                        {preset.hint}
                      </p>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#7A1C24]">
                      <span>Chọn cỡ bàn này</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-4">
              <div className="min-w-[180px] flex-1">
                <label
                  htmlFor="custom-seats-input"
                  className="block text-xs font-medium text-[#1F1D1A]"
                >
                  Hoặc nhập số khách mỗi bàn khác ({MIN_SEATS_PER_TABLE}–{MAX_SEATS_PER_TABLE})
                </label>
                <input
                  id="custom-seats-input"
                  type="number"
                  min={MIN_SEATS_PER_TABLE}
                  max={MAX_SEATS_PER_TABLE}
                  value={customSeatsInput}
                  onChange={(e) => setCustomSeatsInput(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-3 text-sm text-[#1F1D1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmCustomSeats}
                className="h-10 rounded-full bg-[#7A1C24] px-5 text-white hover:bg-[#5E141B]"
              >
                Áp dụng & Tiếp tục
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E2D9] pt-4">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1F1D1A] hover:text-[#7A1C24]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Quay lại bước 1
              </button>
              <button
                type="button"
                onClick={() => handleSelectSeatsPreset(DEFAULT_SEATS_PER_TABLE)}
                className="text-xs font-medium text-[#6B655E] hover:text-[#1F1D1A]"
              >
                Bỏ qua, giữ 10 người/bàn →
              </button>
            </div>
          </div>
        ) : null}

        {/* STEP 3: Start Mode */}
        {step === 3 ? (
          <div className="mx-auto max-w-2xl py-2">
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="font-serif text-2xl font-normal text-[#1F1D1A] outline-none sm:text-3xl"
            >
              Bạn muốn khởi tạo danh sách theo cách nào?
            </h2>
            <p className="mt-2 text-sm text-[#6B655E]">
              Chọn bộ khung 12 nhóm khách chuẩn để sửa nhanh, dán cột tên từ Excel/Zalo, hoặc tự thêm từng người.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleStartWithSample}
                className="flex w-full items-start justify-between gap-4 rounded-2xl border border-[#7A1C24] bg-[#7A1C24]/[0.04] p-4 text-left transition-colors hover:bg-[#7A1C24]/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F1D1A] sm:text-base">
                    <Sparkles className="h-4 w-4 text-[#7A1C24]" aria-hidden="true" />
                    Nạp 12 nhóm khách mẫu chuẩn Việt
                  </span>
                  <p className="mt-1 text-xs leading-relaxed text-[#6B655E]">
                    Gồm sẵn họ nội, họ ngoại, bạn thân và đồng nghiệp đã phân buổi lễ & số bàn để bạn tùy chỉnh ngay.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#7A1C24] px-3 py-1 text-xs font-medium text-white">
                  Khuyên dùng
                </span>
              </button>

              <div className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5]/60 p-4">
                <button
                  type="button"
                  onClick={() =>
                    setStep3Mode((prev) => (prev === "paste" ? "choose" : "paste"))
                  }
                  className="flex w-full items-center justify-between text-left focus-visible:outline-none"
                >
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F1D1A] sm:text-base">
                      <ClipboardPaste className="h-4 w-4 text-[#8A6D3B]" aria-hidden="true" />
                      Dán nhanh danh sách có sẵn (mỗi dòng 1 tên)
                    </span>
                    <p className="mt-1 text-xs text-[#6B655E]">
                      Hỗ trợ dán cột tên từ Excel, Google Sheets hoặc tin nhắn ghi chú.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#7A1C24]">
                    {step3Mode === "paste" ? "Thu gọn" : "Mở ô dán"}
                  </span>
                </button>

                {step3Mode === "paste" ? (
                  <div className="mt-4 space-y-3 border-t border-[#E8E2D9] pt-4">
                    <div>
                      <span className="block text-xs font-medium text-[#1F1D1A]">
                        Gán mặc định nhóm khách cho danh sách sắp dán:
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SIDE_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setStep3PasteSide(opt.id)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                              step3PasteSide === opt.id
                                ? "border-[#7A1C24] bg-[#7A1C24] text-white"
                                : "border-[#E8E2D9] bg-white text-[#1F1D1A] hover:border-[#B89B72]",
                            )}
                          >
                            {opt.shortLabel}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={5}
                      value={step3PasteText}
                      onChange={(e) => setStep3PasteText(e.target.value)}
                      placeholder={"Ví dụ:\nNguyễn Minh Anh\nTrần Quốc Bảo\tBạn thân\tBàn 3\nChú Tư & Gia đình"}
                      className="w-full rounded-xl border border-[#E8E2D9] bg-white p-3 text-sm text-[#1F1D1A] placeholder:text-[#6B655E]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                    />

                    {actionNotice ? (
                      <p className="text-xs text-[#7A1C24]">{actionNotice}</p>
                    ) : null}

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleImportFromStep3}
                        className="rounded-full bg-[#7A1C24] px-5 text-white hover:bg-[#5E141B]"
                      >
                        Tạo bảng từ danh sách này
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleStartBlank}
                className="flex w-full items-center justify-between rounded-2xl border border-[#E8E2D9] bg-white p-4 text-left transition-colors hover:border-[#B89B72] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F1D1A]">
                    <ListChecks className="h-4 w-4 text-[#6B655E]" aria-hidden="true" />
                    Bắt đầu bảng trống để tự thêm từng khách
                  </span>
                  <p className="mt-1 text-xs text-[#6B655E]">
                    Phù hợp khi bạn muốn gõ mới từ đầu từng gia đình hai bên.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#6B655E]" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E2D9] pt-4">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1F1D1A] hover:text-[#7A1C24]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Quay lại bước 2
              </button>
              <button
                type="button"
                onClick={handleStartWithSample}
                className="text-xs font-medium text-[#6B655E] hover:text-[#1F1D1A]"
              >
                Bỏ qua, mở ngay bảng mẫu →
              </button>
            </div>
          </div>
        ) : null}

        {/* RESULT WORKSPACE */}
        {step === "result" ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E8E2D9] pb-4">
              <div>
                <h2
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="font-serif text-2xl font-normal text-[#1F1D1A] outline-none sm:text-3xl"
                >
                  Tổng hợp khách mời & số bàn theo buổi lễ
                </h2>
                <p className="mt-1 text-xs text-[#6B655E] sm:text-sm">
                  Cấu hình hiện tại: <strong>{seatsPerTable} người/bàn</strong> · Tổng cộng{" "}
                  <strong>{summary.totalInvites}</strong> thiệp mời ({summary.totalHeadcount} khách dự kiến).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoAssignTables}
                  disabled={guests.length === 0}
                  className="rounded-full border-[#E8E2D9] bg-[#FAF8F5] text-xs font-medium text-[#1F1D1A] hover:border-[#B89B72] hover:bg-white"
                >
                  Tự chia bàn theo nhóm
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyForInviwedd}
                  disabled={guests.length === 0}
                  className="rounded-full bg-[#7A1C24] text-xs font-medium text-white hover:bg-[#5E141B]"
                >
                  {copyStatus === "copied" ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Đã sao chép TSV
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Sao chép dán Inviwedd
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCsv}
                  disabled={guests.length === 0}
                  className="rounded-full border-[#E8E2D9] text-xs font-medium text-[#1F1D1A] hover:border-[#B89B72]"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Xuất Excel (.csv)
                </Button>
              </div>
            </div>

            {actionNotice ? (
              <div
                role="status"
                className="flex items-center justify-between gap-3 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/[0.06] px-4 py-2.5 text-xs text-[#2F6F4E]"
              >
                <span>{actionNotice}</span>
                <button
                  type="button"
                  onClick={() => setActionNotice(null)}
                  className="font-medium underline"
                >
                  Đóng
                </button>
              </div>
            ) : null}

            {copyStatus === "copied" ? (
              <div
                role="status"
                className="rounded-xl border border-[#7A1C24]/25 bg-[#7A1C24]/[0.05] px-4 py-2.5 text-xs text-[#1F1D1A]"
              >
                Đã sao chép danh sách định dạng 3 cột (Tên khách · Vai vế · Số bàn). Bạn chỉ cần mở{" "}
                <strong>/tao-thiep</strong>, vào mục Khách mời và dán hàng loạt.
              </div>
            ) : null}

            {/* Ceremony Summary Cards */}
            <div
              className={cn(
                "grid gap-3",
                summary.ceremonies.length === 1
                  ? "grid-cols-1"
                  : summary.ceremonies.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-3",
              )}
            >
              {summary.ceremonies.map((c) => (
                <div
                  key={c.ceremony}
                  className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold tracking-[0.08em] uppercase text-[#8A6D3B]">
                      {c.label}
                    </span>
                    <span className="text-xs text-[#6B655E]">
                      {c.inviteCount} thiệp
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-normal text-[#1F1D1A]">
                      {c.baseTables} bàn
                    </span>
                    <span className="text-xs text-[#6B655E]">
                      ({c.headcount} người)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#6B655E]">
                    {c.baseTables > 0
                      ? `Nên dự phòng +${c.reserveTables} bàn (tổng ${c.totalTablesWithReserve} bàn)`
                      : "Chưa có khách chọn buổi lễ này"}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick-Add Form */}
            <form
              onSubmit={handleAddQuickGuest}
              className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5]/70 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#1F1D1A]">
                  <Users className="h-3.5 w-3.5 text-[#7A1C24]" aria-hidden="true" />
                  Thêm nhanh khách mời mới
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setResultPasteOpen((prev) => !prev)}
                    className="text-xs font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
                  >
                    {resultPasteOpen ? "Đóng ô dán nhiều dòng" : "+ Dán nhiều tên cùng lúc"}
                  </button>
                  <button
                    type="button"
                    onClick={handleStartWithSample}
                    className="text-xs font-medium text-[#6B655E] hover:text-[#1F1D1A]"
                  >
                    Nạp lại 12 mẫu
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#6B655E] hover:text-[#7A1C24]"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    Làm mới
                  </button>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <label htmlFor="quick-guest-name" className="sr-only">
                    Tên khách mời
                  </label>
                  <input
                    id="quick-guest-name"
                    type="text"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (quickAddError) setQuickAddError(null);
                    }}
                    placeholder="Tên khách (vd: Chú Ba, Minh Thư...)"
                    className="h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-3 text-sm text-[#1F1D1A] placeholder:text-[#6B655E]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="quick-guest-side" className="sr-only">
                    Nhóm khách
                  </label>
                  <select
                    id="quick-guest-side"
                    value={newSide}
                    onChange={(e) => setNewSide(e.target.value as GuestSide)}
                    className="h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-2.5 text-xs text-[#1F1D1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                  >
                    {SIDE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="quick-guest-role" className="sr-only">
                    Vai vế xưng hô
                  </label>
                  <select
                    id="quick-guest-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as RelationshipGroup)}
                    className="h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-2.5 text-xs text-[#1F1D1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label htmlFor="quick-guest-plusones" className="sr-only">
                    Số người đi cùng
                  </label>
                  <input
                    id="quick-guest-plusones"
                    type="number"
                    min={0}
                    max={MAX_PLUS_ONES}
                    value={newPlusOnes}
                    onChange={(e) => setNewPlusOnes(clampPlusOnes(e.target.value))}
                    title="Số người đi cùng (+)"
                    placeholder="+0"
                    className="h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-2.5 text-center text-xs text-[#1F1D1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label htmlFor="quick-guest-table" className="sr-only">
                    Số bàn
                  </label>
                  <input
                    id="quick-guest-table"
                    type="text"
                    value={newTable}
                    onChange={(e) => setNewTable(e.target.value)}
                    placeholder="Bàn 1"
                    className="h-10 w-full rounded-xl border border-[#E8E2D9] bg-white px-2.5 text-xs text-[#1F1D1A] placeholder:text-[#6B655E]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-10 w-full rounded-full bg-[#7A1C24] text-xs font-medium text-white hover:bg-[#5E141B]"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    Thêm khách
                  </Button>
                </div>
              </div>

              {/* Quick ceremony checkboxes for new guest */}
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-[#6B655E]">
                <span>Tham dự:</span>
                {activeCeremonies.map((cid) => {
                  const checked = newCeremonies.includes(cid);
                  return (
                    <label key={cid} className="inline-flex cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setNewCeremonies((prev) => {
                            if (prev.includes(cid) && prev.length === 1) return prev;
                            return prev.includes(cid)
                              ? prev.filter((item) => item !== cid)
                              : [...prev, cid];
                          });
                        }}
                        className="h-3.5 w-3.5 accent-[#7A1C24]"
                      />
                      <span className="text-[#1F1D1A]">{getCeremonyLabel(cid)}</span>
                    </label>
                  );
                })}
              </div>

              {quickAddError ? (
                <p role="alert" className="mt-2 text-xs text-[#7A1C24]">
                  {quickAddError}
                </p>
              ) : null}

              {resultPasteOpen ? (
                <div className="mt-4 space-y-2.5 border-t border-[#E8E2D9] pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[#1F1D1A]">Nhóm mặc định:</span>
                    {SIDE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setResultPasteSide(opt.id)}
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                          resultPasteSide === opt.id
                            ? "border-[#7A1C24] bg-[#7A1C24] text-white"
                            : "border-[#E8E2D9] bg-white text-[#1F1D1A]",
                        )}
                      >
                        {opt.shortLabel}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={4}
                    value={resultPasteText}
                    onChange={(e) => setResultPasteText(e.target.value)}
                    placeholder="Dán mỗi dòng 1 tên khách (hoặc copy từ Excel: Tên [Tab] Vai vế [Tab] Số bàn)"
                    className="w-full rounded-xl border border-[#E8E2D9] bg-white p-3 text-sm text-[#1F1D1A] placeholder:text-[#6B655E]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAppendBulkInResult}
                      className="rounded-full bg-[#7A1C24] text-xs text-white hover:bg-[#5E141B]"
                    >
                      Thêm vào bảng
                    </Button>
                  </div>
                </div>
              ) : null}
            </form>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSideFilter("all")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    sideFilter === "all"
                      ? "border-[#1F1D1A] bg-[#1F1D1A] text-white"
                      : "border-[#E8E2D9] bg-white text-[#6B655E] hover:text-[#1F1D1A]",
                  )}
                >
                  Tất cả ({guests.length})
                </button>
                {summary.sides.map((s) => (
                  <button
                    key={s.side}
                    type="button"
                    onClick={() => setSideFilter(s.side)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      sideFilter === s.side
                        ? "border-[#7A1C24] bg-[#7A1C24] text-white"
                        : "border-[#E8E2D9] bg-white text-[#6B655E] hover:text-[#1F1D1A]",
                    )}
                  >
                    {s.label} ({s.headcount})
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeCeremonies.length > 1 ? (
                  <select
                    aria-label="Lọc theo buổi lễ"
                    value={ceremonyFilter}
                    onChange={(e) =>
                      setCeremonyFilter(e.target.value as CeremonyId | "all")
                    }
                    className="h-9 rounded-full border border-[#E8E2D9] bg-white px-3 text-xs text-[#1F1D1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                  >
                    <option value="all">Mọi buổi lễ</option>
                    {activeCeremonies.map((cid) => (
                      <option key={cid} value={cid}>
                        Lọc: {getCeremonyLabel(cid)}
                      </option>
                    ))}
                  </select>
                ) : null}

                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#6B655E]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên khách hoặc số bàn..."
                    aria-label="Tìm tên khách hoặc số bàn"
                    className="h-9 w-52 rounded-full border border-[#E8E2D9] bg-white pr-3 pl-8 text-xs text-[#1F1D1A] placeholder:text-[#6B655E]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                  />
                </div>
              </div>
            </div>

            {/* Guest List */}
            {filteredGuests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E8E2D9] bg-[#FAF8F5]/60 px-6 py-10 text-center">
                <p className="text-sm font-medium text-[#1F1D1A]">
                  {guests.length === 0
                    ? "Danh sách đang trống. Nhập tên khách ở thanh phía trên để bắt đầu."
                    : "Không có khách nào khớp bộ lọc hiện tại."}
                </p>
                {guests.length === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStartWithSample}
                    className="mt-3 rounded-full border-[#E8E2D9] text-xs"
                  >
                    Nạp 12 nhóm khách mẫu chuẩn Việt
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredGuests.map((guest, idx) => (
                  <div
                    key={guest.id}
                    className="rounded-xl border border-[#E8E2D9] bg-white p-3.5 transition-colors hover:border-[#B89B72]/70"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      {/* Name + Side/Role */}
                      <div className="grid flex-1 gap-2 sm:grid-cols-12">
                        <div className="flex items-center gap-2 sm:col-span-5">
                          <span className="w-6 shrink-0 text-center text-xs text-[#6B655E]">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            aria-label={`Tên khách mời ${guest.name}`}
                            value={guest.name}
                            onChange={(e) =>
                              handleUpdateGuest(guest.id, { name: e.target.value })
                            }
                            className="h-9 w-full rounded-lg border border-transparent bg-[#FAF8F5] px-2.5 text-sm font-medium text-[#1F1D1A] focus:border-[#B89B72] focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <select
                            aria-label={`Nhóm của ${guest.name}`}
                            value={guest.side}
                            onChange={(e) =>
                              handleUpdateGuest(guest.id, {
                                side: e.target.value as GuestSide,
                              })
                            }
                            className="h-9 w-full rounded-lg border border-[#E8E2D9] bg-white px-2 text-xs text-[#1F1D1A] focus:outline-none"
                          >
                            {SIDE_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.shortLabel}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <select
                            aria-label={`Vai vế xưng hô của ${guest.name}`}
                            value={guest.role}
                            onChange={(e) =>
                              handleUpdateGuest(guest.id, {
                                role: e.target.value as RelationshipGroup,
                              })
                            }
                            className="h-9 w-full rounded-lg border border-[#E8E2D9] bg-white px-2 text-xs text-[#1F1D1A] focus:outline-none"
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Ceremonies + Plus ones + Table + Delete */}
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <div className="flex flex-wrap items-center gap-1">
                          {activeCeremonies.map((cid) => {
                            const active = guest.ceremonies.includes(cid);
                            return (
                              <button
                                key={cid}
                                type="button"
                                onClick={() => handleToggleGuestCeremony(guest.id, cid)}
                                aria-pressed={active}
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                                  active
                                    ? "border-[#7A1C24] bg-[#7A1C24]/10 text-[#7A1C24]"
                                    : "border-[#E8E2D9] bg-white text-[#6B655E]",
                                )}
                              >
                                {getCeremonyLabel(cid)}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center rounded-lg border border-[#E8E2D9] bg-[#FAF8F5] px-1.5 py-0.5 text-xs">
                          <span className="mr-1 text-[11px] text-[#6B655E]">Đi cùng</span>
                          <button
                            type="button"
                            aria-label={`Giảm người đi cùng của ${guest.name}`}
                            onClick={() =>
                              handleUpdateGuest(guest.id, {
                                plusOnes: clampPlusOnes(guest.plusOnes - 1),
                              })
                            }
                            className="h-6 w-6 rounded text-center font-medium text-[#1F1D1A] hover:bg-white"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-semibold text-[#1F1D1A]">
                            +{guest.plusOnes}
                          </span>
                          <button
                            type="button"
                            aria-label={`Tăng người đi cùng của ${guest.name}`}
                            onClick={() =>
                              handleUpdateGuest(guest.id, {
                                plusOnes: clampPlusOnes(guest.plusOnes + 1),
                              })
                            }
                            className="h-6 w-6 rounded text-center font-medium text-[#1F1D1A] hover:bg-white"
                          >
                            +
                          </button>
                        </div>

                        <input
                          type="text"
                          aria-label={`Số bàn của ${guest.name}`}
                          value={guest.tableLabel}
                          onChange={(e) =>
                            handleUpdateGuest(guest.id, { tableLabel: e.target.value })
                          }
                          placeholder="Bàn..."
                          className="h-9 w-20 rounded-lg border border-[#E8E2D9] bg-white px-2 text-center text-xs text-[#1F1D1A] placeholder:text-[#6B655E]/70 focus:border-[#7A1C24] focus:outline-none"
                        />

                        <button
                          type="button"
                          aria-label={`Xóa ${guest.name} khỏi danh sách`}
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#6B655E] transition-colors hover:bg-[#FAF8F5] hover:text-[#7A1C24]"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Side Summary Strip */}
            {guests.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-4 py-3 text-xs text-[#6B655E]">
                <div className="flex flex-wrap items-center gap-3">
                  {summary.sides.map((s) => (
                    <span key={s.side}>
                      <strong className="text-[#1F1D1A]">{getSideLabel(s.side)}:</strong>{" "}
                      {s.inviteCount} thiệp ({s.headcount} người)
                    </span>
                  ))}
                </div>
                <span>
                  Đã xếp bàn: <strong className="text-[#1F1D1A]">{guests.length - summary.unassignedCount}/{guests.length}</strong> thiệp
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Conversion CTA */}
      <SmartToolCta
        eyebrow="Bước tiếp theo trên Inviwedd"
        title="Biến danh sách khách thành link thiệp cá nhân hóa"
        description={
          <>
            Bấm tạo thiệp trên Inviwedd, dán danh sách 3 cột vừa sao chép (hỗ trợ tối đa 500 khách một lần) để tự sinh xưng hô đúng vai vế và theo dõi xác nhận tham dự ngay khi gửi link qua Zalo.
          </>
        }
        buttonText="Tạo thiệp & Dán danh sách ngay"
        buttonHref="/tao-thiep"
        highlightPulse={guests.length > 0 && step === "result"}
      />

      {/* Confirm Reset Dialog */}
      <Dialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        title="Làm mới toàn bộ danh sách?"
        description="Toàn bộ khách mời và số bàn đã lưu trên trình duyệt cho công cụ này sẽ bị xóa để thiết lập lại từ bước 1."
      >
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmResetOpen(false)}
          >
            Giữ lại
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleConfirmResetAll}
          >
            Xóa và làm mới
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
