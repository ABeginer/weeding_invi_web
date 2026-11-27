"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Download,
  Plus,
  RotateCcw,
} from "lucide-react";
import { SmartToolCta } from "@/components/tools/SmartToolCta";
import {
  buildMilestonesWithDates,
  buildWeddingChecklistCsv,
  computeDaysRemaining,
  getOwnerSideLabel,
  getTasksForScale,
  WEDDING_SCALES,
  type ChecklistMilestoneId,
  type ChecklistTaskItem,
  type TaskOwnerSide,
  type WeddingScaleId,
} from "@/lib/wedding-checklist";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "inviwedd_wedding_checklist_v1";
const STORAGE_EVENT = "inviwedd-checklist-storage";

interface SavedChecklistState {
  weddingDate: string;
  scale: WeddingScaleId;
  completedIds: string[];
  customTasks: ChecklistTaskItem[];
}

function getDefaultWeddingDateIso(): string {
  return "2027-03-20";
}

const DEFAULT_STATE: SavedChecklistState = {
  weddingDate: getDefaultWeddingDateIso(),
  scale: "standard",
  completedIds: [],
  customTasks: [],
};

const DEFAULT_SNAPSHOT_JSON = JSON.stringify(DEFAULT_STATE);

function subscribeChecklistStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(STORAGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(STORAGE_EVENT, handler);
  };
}

function getChecklistSnapshot(): string {
  if (typeof window === "undefined") return DEFAULT_SNAPSHOT_JSON;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_SNAPSHOT_JSON;
  } catch {
    return DEFAULT_SNAPSHOT_JSON;
  }
}

function getChecklistServerSnapshot(): string {
  return DEFAULT_SNAPSHOT_JSON;
}

function parseChecklistState(raw: string): SavedChecklistState {
  try {
    const parsed = JSON.parse(raw) as Partial<SavedChecklistState>;
    const weddingDate =
      typeof parsed.weddingDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.weddingDate)
        ? parsed.weddingDate
        : DEFAULT_STATE.weddingDate;
    const scale: WeddingScaleId =
      parsed.scale === "intimate" || parsed.scale === "standard" || parsed.scale === "both_sides"
        ? parsed.scale
        : "standard";
    const completedIds = Array.isArray(parsed.completedIds)
      ? parsed.completedIds.filter((id): id is string => typeof id === "string")
      : [];
    const customTasks = Array.isArray(parsed.customTasks)
      ? parsed.customTasks.filter(
          (item): item is ChecklistTaskItem =>
            Boolean(item) &&
            typeof item.id === "string" &&
            typeof item.title === "string" &&
            typeof item.milestone === "string",
        )
      : [];
    return { weddingDate, scale, completedIds, customTasks };
  } catch {
    return DEFAULT_STATE;
  }
}

function persistChecklistState(next: SavedChecklistState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    // Bỏ qua nếu trình duyệt chặn localStorage
  }
}

type SideFilter = "all" | "pending" | TaskOwnerSide;

export function WeddingChecklistClient() {
  const rawSnapshot = React.useSyncExternalStore(
    subscribeChecklistStorage,
    getChecklistSnapshot,
    getChecklistServerSnapshot,
  );
  const state = React.useMemo(() => parseChecklistState(rawSnapshot), [rawSnapshot]);

  const [sideFilter, setSideFilter] = React.useState<SideFilter>("all");
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskMilestone, setNewTaskMilestone] =
    React.useState<ChecklistMilestoneId>("1m");
  const [newTaskOwner, setNewTaskOwner] = React.useState<TaskOwnerSide>("both");
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);

  const todayIso = React.useMemo(() => {
    const now = new Date();
    const y = String(now.getFullYear()).padStart(4, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const milestones = React.useMemo(
    () => buildMilestonesWithDates(state.weddingDate),
    [state.weddingDate],
  );

  const allTasks = React.useMemo(() => {
    const baseTasks = getTasksForScale(state.scale);
    return [...baseTasks, ...state.customTasks];
  }, [state.customTasks, state.scale]);

  const completedSet = React.useMemo(
    () => new Set(state.completedIds),
    [state.completedIds],
  );

  const completedCount = React.useMemo(
    () => allTasks.filter((task) => completedSet.has(task.id)).length,
    [allTasks, completedSet],
  );
  const progressPercent =
    allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  const daysRemaining = React.useMemo(
    () => computeDaysRemaining(state.weddingDate, todayIso),
    [state.weddingDate, todayIso],
  );

  const filteredTasks = React.useMemo(() => {
    return allTasks.filter((task) => {
      if (sideFilter === "pending") return !completedSet.has(task.id);
      if (sideFilter === "both" || sideFilter === "groom" || sideFilter === "bride") {
        return task.owner === sideFilter;
      }
      return true;
    });
  }, [allTasks, completedSet, sideFilter]);

  const toggleTask = (taskId: string) => {
    const exists = completedSet.has(taskId);
    const nextIds = exists
      ? state.completedIds.filter((id) => id !== taskId)
      : [...state.completedIds, taskId];
    persistChecklistState({ ...state, completedIds: nextIds });
  };

  const handleAddCustomTask = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const newItem: ChecklistTaskItem = {
      id: `custom_${Date.now().toString(36)}`,
      milestone: newTaskMilestone,
      title: trimmed,
      owner: newTaskOwner,
      scales: ["intimate", "standard", "both_sides"],
      detail: "Đầu việc tự thêm theo kế hoạch riêng của gia đình.",
    };
    persistChecklistState({
      ...state,
      customTasks: [...state.customTasks, newItem],
    });
    setNewTaskTitle("");
    setExportNotice("Đã thêm đầu việc mới và lưu tự động trên trình duyệt.");
  };

  const handleResetProgress = () => {
    persistChecklistState({
      ...state,
      completedIds: [],
      customTasks: [],
    });
    setExportNotice("Đã đặt lại toàn bộ dấu tích và đầu việc tự thêm.");
  };

  const handleExportCsv = () => {
    const milestoneMap = new Map(milestones.map((m) => [m.id, m]));
    const rows = allTasks.map((task) => {
      const m = milestoneMap.get(task.milestone);
      return {
        milestoneLabel: m?.label ?? task.milestone,
        dueDateDisplay: m?.dueDateDisplay ?? "",
        title: task.title,
        owner: task.owner,
        done: completedSet.has(task.id),
        detail: task.detail,
      };
    });
    const csv = buildWeddingChecklistCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `checklist-dam-cuoi-${state.weddingDate}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportNotice("Đã xuất file CSV chuẩn UTF-8 mở trực tiếp bằng Excel.");
  };

  const inputClass =
    "mt-1.5 h-11 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 text-sm text-[#1F1D1A] outline-none transition-all focus-visible:border-[#7A1C24] focus-visible:ring-1 focus-visible:ring-[#7A1C24]/20";

  return (
    <div className="space-y-6">
      {/* Khung thiết lập ngày cưới & thanh tiến độ */}
      <section className="rounded-2xl border border-[#E8E2D9] bg-white p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
                Ngày tổ chức lễ cưới dự kiến
                <input
                  type="date"
                  value={state.weddingDate}
                  onChange={(e) => {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
                      persistChecklistState({ ...state, weddingDate: e.target.value });
                    }
                  }}
                  className={inputClass}
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1D1A]">
                Quy mô đám cưới
                <select
                  value={state.scale}
                  onChange={(e) =>
                    persistChecklistState({
                      ...state,
                      scale: e.target.value as WeddingScaleId,
                    })
                  }
                  className={inputClass}
                >
                  {WEDDING_SCALES.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="text-xs text-[#6B655E]">
              {WEDDING_SCALES.find((s) => s.id === state.scale)?.hint}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 sm:p-5 lg:col-span-5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A1C24]">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {daysRemaining === null
                  ? "Chọn ngày cưới"
                  : daysRemaining > 0
                    ? `Còn ${daysRemaining} ngày tới lễ cưới`
                    : daysRemaining === 0
                      ? "Hôm nay là ngày cưới"
                      : `Đã qua ${Math.abs(daysRemaining)} ngày`}
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#1F1D1A] border border-[#E8E2D9]">
                {completedCount}/{allTasks.length} việc ({progressPercent}%)
              </span>
            </div>

            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white border border-[#E8E2D9]">
              <div
                className="h-full rounded-full bg-[#7A1C24] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#7A1C24] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5E141B]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Xuất Excel (.csv)</span>
              </button>

              <button
                type="button"
                onClick={handleResetProgress}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-3.5 text-xs font-medium text-[#6B655E] transition-colors hover:text-[#1F1D1A]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>
        </div>

        {exportNotice && (
          <p className="mt-3 text-xs font-medium text-[#7A1C24]">{exportNotice}</p>
        )}
      </section>

      {/* Bộ lọc & Thêm việc riêng */}
      <section className="flex flex-col gap-4 rounded-2xl border border-[#E8E2D9] bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: "Tất cả" },
              { id: "pending", label: "Chưa xong" },
              { id: "both", label: "Cả hai bên" },
              { id: "groom", label: "Nhà trai" },
              { id: "bride", label: "Nhà gái" },
            ] as const
          ).map((tab) => {
            const active = sideFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSideFilter(tab.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-[#7A1C24] text-white"
                    : "border border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E] hover:text-[#1F1D1A]",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleAddCustomTask}
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-center"
        >
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Thêm đầu việc riêng (ví dụ: Thử mâm cỗ chay cho họ nội...)"
            className="h-10 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 text-xs sm:text-sm text-[#1F1D1A] outline-none focus-visible:border-[#7A1C24] sm:col-span-6"
          />
          <select
            value={newTaskMilestone}
            onChange={(e) =>
              setNewTaskMilestone(e.target.value as ChecklistMilestoneId)
            }
            aria-label="Chọn mốc thời gian"
            className="h-10 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3 text-xs text-[#1F1D1A] sm:col-span-2"
          >
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={newTaskOwner}
            onChange={(e) => setNewTaskOwner(e.target.value as TaskOwnerSide)}
            aria-label="Chọn bên phụ trách"
            className="h-10 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3 text-xs text-[#1F1D1A] sm:col-span-2"
          >
            <option value="both">Cả hai bên</option>
            <option value="groom">Nhà trai</option>
            <option value="bride">Nhà gái</option>
          </select>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#1F1D1A] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#3A3530] sm:col-span-2"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Thêm việc</span>
          </button>
        </form>
      </section>

      {/* Danh sách theo 5 mốc thời gian */}
      <div className="space-y-5">
        {milestones.map((milestone) => {
          const items = filteredTasks.filter((t) => t.milestone === milestone.id);
          if (items.length === 0) return null;

          return (
            <section
              key={milestone.id}
              className="rounded-2xl border border-[#E8E2D9] bg-white p-5 sm:p-6 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D9] pb-3">
                <div>
                  <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
                    {milestone.label}
                  </span>
                  <h2 className="font-serif text-xl font-medium text-[#1F1D1A]">
                    Hạn gợi ý: {milestone.dueDateDisplay}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#6B655E]">{milestone.summary}</p>
                </div>
                <span className="rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-3 py-1 text-xs font-medium text-[#1F1D1A]">
                  {items.filter((i) => completedSet.has(i.id)).length}/{items.length} hoàn thành
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {items.map((task) => {
                  const done = completedSet.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex flex-col gap-2 rounded-xl border p-3.5 transition-colors sm:flex-row sm:items-start sm:justify-between",
                        done
                          ? "border-[#E8E2D9]/60 bg-[#FAF8F5]/60"
                          : "border-[#E8E2D9] bg-white hover:border-[#B89B72]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="flex flex-1 items-start gap-3 text-left"
                      >
                        {done ? (
                          <CheckCircle2
                            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="mt-0.5 h-5 w-5 shrink-0 text-[#B89B72]"
                            aria-hidden="true"
                          />
                        )}
                        <div>
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              done ? "line-through text-[#6B655E]" : "text-[#1F1D1A]",
                            )}
                          >
                            {task.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-[#6B655E]">
                            {task.detail}
                          </p>
                        </div>
                      </button>

                      <div className="flex flex-wrap items-center gap-2 pl-8 sm:pl-0 sm:shrink-0">
                        <span className="rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-2.5 py-0.5 text-[11px] font-medium text-[#6B655E]">
                          {getOwnerSideLabel(task.owner)}
                        </span>
                        {task.suggestedToolHref && task.suggestedToolLabel && (
                          <Link
                            href={task.suggestedToolHref}
                            className="inline-flex items-center gap-1 rounded-full bg-[#7A1C24]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#7A1C24] hover:bg-[#7A1C24]/15"
                          >
                            <span>{task.suggestedToolLabel}</span>
                            <ArrowRight className="h-3 w-3" aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <SmartToolCta
        eyebrow="HOÀN TẤT MỐC GỬI THIỆP CƯỚI"
        title="Đến mốc 1 tháng trước lễ? Khởi tạo thiệp cưới online cá nhân hóa ngay"
        description="Dán danh sách khách từ Excel lên Inviwedd, tự sinh đường dẫn riêng mang tên từng khách, tích hợp chỉ đường Google Maps và thu xác nhận tham dự RSVP tự động — miễn phí cho 20 khách đầu."
        buttonText="Tạo thiệp cưới miễn phí"
        buttonHref="/tao-thiep"
      />
    </div>
  );
}
