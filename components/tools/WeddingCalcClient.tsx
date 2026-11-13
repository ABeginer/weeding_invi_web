"use client";

import * as React from "react";
import { BookmarkCheck, Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { WEDDING_CALC_COPY } from "@/config/tools-copy";
import { cn } from "@/lib/utils";
import {
  evaluateWeddingCalculator,
  formatVnd,
  type OtherExpenseItem,
  type WeddingCalcRawInputs,
} from "@/lib/wedding-calc";

const STORAGE_KEY = "inviwedd_wedding_calc_v1";

interface SavedCalcPayload {
  inputs: WeddingCalcRawInputs;
  savedAt: string;
}

function createInitialInputs(): WeddingCalcRawInputs {
  return {
    invitedGuests: "",
    attendanceRate: "90",
    avgPlusOnes: "0",
    guestsPerTable: "10",
    reserveRate: "5",
    pricePerTable: "",
    otherExpenses: WEDDING_CALC_COPY.suggestedExpenses.map((cat) => ({
      id: cat.id,
      name: cat.label,
      amount: "",
    })),
    avgGiftPerGuest: "",
  };
}

function formatSavedTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

const CHART_FILLS = [
  "var(--brand-accent)",
  "var(--brand-sage)",
  "var(--brand-rose)",
  "var(--brand-accent-text)",
] as const;

export function WeddingCalcClient() {
  const [inputs, setInputs] = React.useState<WeddingCalcRawInputs>(() =>
    createInitialInputs(),
  );
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);
  const [storageNotice, setStorageNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SavedCalcPayload>;
      if (parsed && parsed.inputs && typeof parsed.inputs === "object") {
        const defaults = createInitialInputs();
        const savedExpenses = Array.isArray(parsed.inputs.otherExpenses)
          ? parsed.inputs.otherExpenses.filter(
              (item): item is OtherExpenseItem =>
                Boolean(item) &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                typeof item.amount === "string",
            )
          : defaults.otherExpenses;

        setInputs({
          invitedGuests:
            typeof parsed.inputs.invitedGuests === "string"
              ? parsed.inputs.invitedGuests
              : defaults.invitedGuests,
          attendanceRate:
            typeof parsed.inputs.attendanceRate === "string"
              ? parsed.inputs.attendanceRate
              : defaults.attendanceRate,
          avgPlusOnes:
            typeof parsed.inputs.avgPlusOnes === "string"
              ? parsed.inputs.avgPlusOnes
              : defaults.avgPlusOnes,
          guestsPerTable:
            typeof parsed.inputs.guestsPerTable === "string"
              ? parsed.inputs.guestsPerTable
              : defaults.guestsPerTable,
          reserveRate:
            typeof parsed.inputs.reserveRate === "string"
              ? parsed.inputs.reserveRate
              : defaults.reserveRate,
          pricePerTable:
            typeof parsed.inputs.pricePerTable === "string"
              ? parsed.inputs.pricePerTable
              : defaults.pricePerTable,
          otherExpenses: savedExpenses,
          avgGiftPerGuest:
            typeof parsed.inputs.avgGiftPerGuest === "string"
              ? parsed.inputs.avgGiftPerGuest
              : defaults.avgGiftPerGuest,
        });
        if (typeof parsed.savedAt === "string") {
          setSavedAt(parsed.savedAt);
        }
      }
    } catch {
      // Bỏ qua khi trình duyệt chặn localStorage hoặc dữ liệu cũ không hợp lệ
    }
  }, []);

  const result = React.useMemo(
    () =>
      evaluateWeddingCalculator(inputs, WEDDING_CALC_COPY.results.chartMenuLabel),
    [inputs],
  );

  const suggestedHintMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of WEDDING_CALC_COPY.suggestedExpenses) {
      map.set(cat.id, cat.hint);
    }
    return map;
  }, []);

  const updateField = <K extends keyof WeddingCalcRawInputs>(
    field: K,
    value: WeddingCalcRawInputs[K],
  ) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
    setStorageNotice(null);
  };

  const updateExpenseItem = (
    id: string,
    patch: Partial<Pick<OtherExpenseItem, "name" | "amount">>,
  ) => {
    setInputs((prev) => ({
      ...prev,
      otherExpenses: prev.otherExpenses.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
    setStorageNotice(null);
  };

  const handleAddCustomExpense = () => {
    const uniqueId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setInputs((prev) => ({
      ...prev,
      otherExpenses: [
        ...prev.otherExpenses,
        { id: uniqueId, name: "", amount: "" },
      ],
    }));
    setStorageNotice(null);
  };

  const handleRemoveExpense = (id: string) => {
    setInputs((prev) => ({
      ...prev,
      otherExpenses: prev.otherExpenses.filter((item) => item.id !== id),
    }));
    setStorageNotice(null);
  };

  const handleSave = () => {
    const nowIso = new Date().toISOString();
    try {
      const payload: SavedCalcPayload = { inputs, savedAt: nowIso };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSavedAt(nowIso);
      setStorageNotice(
        `${WEDDING_CALC_COPY.actions.savedBannerPrefix} ${formatSavedTimestamp(nowIso)}.`,
      );
    } catch {
      setStorageNotice(
        "Trình duyệt đang tắt bộ nhớ cục bộ (localStorage), chưa thể lưu tự động.",
      );
    }
  };

  const handleConfirmClear = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Bỏ qua nếu localStorage không khả dụng
    }
    setInputs(createInitialInputs());
    setSavedAt(null);
    setStorageNotice("Đã xóa dữ liệu đã lưu và đặt lại bảng tính.");
    setConfirmClearOpen(false);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const { groups, results, actions } = WEDDING_CALC_COPY;

  return (
    <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      {/* Cột trái: Các ô nhập liệu (ẩn khi in) */}
      <div className="min-w-0 space-y-6 lg:col-span-7 print:hidden">
        <div className="rounded-xl border border-border bg-accent-soft/60 px-4 py-3 text-xs leading-relaxed text-text sm:text-sm">
          <strong className="font-semibold text-accent-text">Lưu ý: </strong>
          {WEDDING_CALC_COPY.defaultDisclaimer}
        </div>

        {/* Nhóm A */}
        <section
          aria-labelledby="group-a-title"
          className="rounded-2xl border border-border bg-surface p-4 sm:p-6"
        >
          <h2
            id="group-a-title"
            className="font-display text-xl font-semibold text-text sm:text-2xl"
          >
            {groups.guestsAndTables.title}
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={groups.guestsAndTables.invitedGuestsLabel}
              type="text"
              inputMode="numeric"
              value={inputs.invitedGuests}
              onChange={(e) => updateField("invitedGuests", e.target.value)}
              placeholder={groups.guestsAndTables.invitedGuestsPlaceholder}
              hint={groups.guestsAndTables.invitedGuestsHint}
              error={result.errors.invitedGuests}
            />

            <Input
              label={groups.guestsAndTables.pricePerTableLabel}
              type="text"
              inputMode="numeric"
              value={inputs.pricePerTable}
              onChange={(e) => updateField("pricePerTable", e.target.value)}
              placeholder={groups.guestsAndTables.pricePerTablePlaceholder}
              hint={groups.guestsAndTables.pricePerTableHint}
              error={result.errors.pricePerTable}
            />

            <Input
              label={groups.guestsAndTables.attendanceRateLabel}
              type="text"
              inputMode="decimal"
              value={inputs.attendanceRate}
              onChange={(e) => updateField("attendanceRate", e.target.value)}
              hint={groups.guestsAndTables.attendanceRateHint}
              error={result.errors.attendanceRate}
            />

            <Input
              label={groups.guestsAndTables.avgPlusOnesLabel}
              type="text"
              inputMode="decimal"
              value={inputs.avgPlusOnes}
              onChange={(e) => updateField("avgPlusOnes", e.target.value)}
              hint={groups.guestsAndTables.avgPlusOnesHint}
              error={result.errors.avgPlusOnes}
            />

            <Input
              label={groups.guestsAndTables.guestsPerTableLabel}
              type="text"
              inputMode="numeric"
              value={inputs.guestsPerTable}
              onChange={(e) => updateField("guestsPerTable", e.target.value)}
              hint={groups.guestsAndTables.guestsPerTableHint}
              error={result.errors.guestsPerTable}
            />

            <Input
              label={groups.guestsAndTables.reserveRateLabel}
              type="text"
              inputMode="decimal"
              value={inputs.reserveRate}
              onChange={(e) => updateField("reserveRate", e.target.value)}
              hint={groups.guestsAndTables.reserveRateHint}
              error={result.errors.reserveRate}
            />
          </div>
        </section>

        {/* Nhóm B */}
        <section
          aria-labelledby="group-b-title"
          className="rounded-2xl border border-border bg-surface p-4 sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="group-b-title"
                className="font-display text-xl font-semibold text-text sm:text-2xl"
              >
                {groups.otherExpenses.title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-text-muted sm:text-sm">
                {groups.otherExpenses.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {inputs.otherExpenses.map((item) => {
              const presetHint = suggestedHintMap.get(item.id);
              const errMsg = result.errors.otherExpenseIds[item.id];
              const isPreset = Boolean(presetHint);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-bg p-3"
                >
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      {isPreset ? (
                        <div>
                          <label
                            htmlFor={`expense-${item.id}`}
                            className="block text-sm font-medium text-text"
                          >
                            {item.name}
                          </label>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {presetHint}
                          </p>
                        </div>
                      ) : (
                        <Input
                          aria-label="Tên khoản chi tùy ý"
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateExpenseItem(item.id, { name: e.target.value })
                          }
                          placeholder={groups.otherExpenses.customNamePlaceholder}
                        />
                      )}
                    </div>

                    <div className="flex items-start gap-2 sm:w-52 sm:shrink-0">
                      <div className="min-w-0 flex-1">
                        <Input
                          id={`expense-${item.id}`}
                          aria-label={`Số tiền cho ${item.name || "khoản chi"}`}
                          type="text"
                          inputMode="numeric"
                          value={item.amount}
                          onChange={(e) =>
                            updateExpenseItem(item.id, { amount: e.target.value })
                          }
                          placeholder={groups.otherExpenses.amountPlaceholder}
                          error={errMsg}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExpense(item.id)}
                        aria-label={`${groups.otherExpenses.removeLabel}: ${item.name || "khoản tùy ý"}`}
                        className="mt-0.5 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-colors hover:border-danger-border hover:text-danger-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCustomExpense}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{groups.otherExpenses.addButtonLabel}</span>
            </Button>
            <p className="text-xs text-text-muted">
              {groups.otherExpenses.defaultOtherTotalNote}
            </p>
          </div>
        </section>

        {/* Nhóm C */}
        <section
          aria-labelledby="group-c-title"
          className="rounded-2xl border border-border bg-surface p-4 sm:p-6"
        >
          <h2
            id="group-c-title"
            className="font-display text-xl font-semibold text-text sm:text-2xl"
          >
            {groups.gifts.title}
          </h2>

          <div className="mt-4">
            <Input
              label={groups.gifts.avgGiftLabel}
              type="text"
              inputMode="numeric"
              value={inputs.avgGiftPerGuest}
              onChange={(e) => updateField("avgGiftPerGuest", e.target.value)}
              placeholder={groups.gifts.avgGiftPlaceholder}
              hint={groups.gifts.avgGiftHint}
              error={result.errors.avgGiftPerGuest}
            />
          </div>
        </section>
      </div>

      {/* Cột phải: Kết quả + Giả định (phần được in) */}
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:col-span-5">
        <div
          id="wedding-calc-print-area"
          className="rounded-2xl border border-border bg-surface p-4 sm:p-6 print:border-0 print:p-0"
        >
          <div className="hidden pb-4 print:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Inviwedd — Bảng tính đám cưới
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-text">
              {WEDDING_CALC_COPY.h1}
            </h2>
          </div>

          {/* Giả định đang dùng (luôn nằm ngay trên kết quả) */}
          <div className="rounded-xl border border-border bg-bg p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-text">
              {results.assumptionsTitle}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {WEDDING_CALC_COPY.defaultDisclaimer}
            </p>
            <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div>
                <dt className="text-text-muted">Khách mời:</dt>
                <dd className="font-semibold text-text">
                  {inputs.invitedGuests.trim() || "Chưa nhập"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Giá 1 mâm:</dt>
                <dd className="font-semibold text-text">
                  {inputs.pricePerTable.trim() && !result.errors.pricePerTable
                    ? formatVnd(Number(inputs.pricePerTable))
                    : "Chưa nhập"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Tỉ lệ đến dự:</dt>
                <dd className="font-medium text-text">
                  {inputs.attendanceRate || "0"}%
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Người đi cùng:</dt>
                <dd className="font-medium text-text">
                  {inputs.avgPlusOnes || "0"} / khách
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Khách / bàn:</dt>
                <dd className="font-medium text-text">
                  {inputs.guestsPerTable || "10"} người
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Dự phòng bàn:</dt>
                <dd className="font-medium text-text">
                  {inputs.reserveRate || "0"}%
                </dd>
              </div>
            </dl>
          </div>

          <h2 className="mt-5 font-display text-2xl font-semibold text-text">
            {results.title}
          </h2>

          {!result.canCalculate ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-bg p-5 text-center">
              <p className="text-sm font-medium text-text">
                {results.emptyState}
              </p>
              {result.hasValidationErrors && (
                <p className="mt-1.5 text-xs text-danger-fg">
                  Một số ô đang có giá trị không hợp lệ. Vui lòng kiểm tra thông báo bên dưới từng ô.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Số khách & Số bàn */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-border bg-bg p-3">
                  <p className="text-xs text-text-muted">
                    {results.attendingGuestsLabel}
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-text">
                    {result.attendingGuests}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-bg p-3">
                  <p className="text-xs text-text-muted">
                    {results.attendingPeopleLabel}
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-text">
                    {result.attendingPeople}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-accent/40 bg-accent-soft/45 p-3.5">
                <p className="text-xs font-medium text-text-muted">
                  {results.tablesLabel}
                </p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-accent-text">
                  {result.tablesWithReserve} bàn
                </p>
                <p className="mt-0.5 text-xs text-text">
                  {results.reserveSubtext(result.tables, result.reserveTables)}
                </p>
              </div>

              {/* Tổng chi phí & chi tiết */}
              <div className="space-y-2 rounded-xl border border-border bg-bg p-3.5 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-text">
                    {results.totalCostLabel}
                  </span>
                  <span className="font-display text-2xl font-semibold tabular-nums text-text">
                    {formatVnd(result.totalCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
                  <span>{results.foodCostLabel}</span>
                  <span className="font-medium tabular-nums text-text">
                    {formatVnd(result.foodCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
                  <span>{results.otherCostLabel}</span>
                  <span className="font-medium tabular-nums text-text">
                    {formatVnd(result.otherCostTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-xs text-text-muted">
                  <span>{results.expectedGiftsLabel}</span>
                  <span className="font-medium tabular-nums text-text">
                    {formatVnd(result.expectedGifts)}
                  </span>
                </div>
              </div>

              {/* Chênh lệch (net): âm dùng màu trung tính */}
              <div
                className={cn(
                  "rounded-xl border p-3.5",
                  result.net > 0
                    ? "border-success-border bg-success-bg text-success-fg"
                    : "border-neutral-border bg-neutral-bg text-neutral-fg",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium">{results.netLabel}</span>
                  <span className="font-display text-xl font-semibold tabular-nums">
                    {result.net > 0 ? "+" : ""}
                    {formatVnd(result.net)}
                  </span>
                </div>
                <p className="mt-1 text-xs">
                  {result.net < 0
                    ? results.netNegativeNote
                    : result.net > 0
                      ? results.netPositiveNote
                      : results.netZeroNote}
                </p>
              </div>

              {/* Hòa vốn (chỉ hiện khi g > 0) */}
              {result.breakevenGifts !== null && (
                <div className="rounded-xl border border-border bg-bg p-3.5">
                  <p className="text-xs text-text-muted">
                    {results.breakevenLabel}
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-accent-text">
                    {result.breakevenGifts} {results.breakevenSuffix}
                  </p>
                </div>
              )}

              {/* Biểu đồ cột SVG thuần */}
              {result.breakdown.length > 0 && (
                <div className="rounded-xl border border-border bg-bg p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {results.chartTitle}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {result.breakdown.map((bar, idx) => {
                      const fillColor = CHART_FILLS[idx % CHART_FILLS.length];
                      const barWidth = Math.max(2, Math.min(100, bar.percent));

                      return (
                        <li key={bar.id} className="space-y-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-1 text-xs">
                            <span className="font-medium text-text">
                              {bar.label}
                            </span>
                            <span className="tabular-nums text-text-muted">
                              {formatVnd(bar.amount)} ({bar.percent}%)
                            </span>
                          </div>
                          <svg
                            viewBox="0 0 100 8"
                            preserveAspectRatio="none"
                            className="block h-2.5 w-full overflow-hidden rounded-full bg-surface-alt"
                            role="img"
                            aria-label={`${bar.label}: ${formatVnd(bar.amount)}, chiếm ${bar.percent}% tổng chi phí`}
                          >
                            <rect
                              x="0"
                              y="0"
                              width={barWidth}
                              height="8"
                              rx="4"
                              fill={fillColor}
                            />
                          </svg>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Các nút lưu, xóa và in (ẩn khi in) */}
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 print:hidden">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="flex-1 sm:flex-none"
            >
              <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
              <span>{actions.saveLabel}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex-1 sm:flex-none"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>{actions.printLabel}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmClearOpen(true)}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>{actions.clearLabel}</span>
            </Button>
          </div>

          {storageNotice ? (
            <p className="text-xs font-medium text-accent-text" role="status">
              {storageNotice}
            </p>
          ) : savedAt ? (
            <p className="text-xs text-text-muted">
              {actions.savedBannerPrefix} {formatSavedTimestamp(savedAt)}.
            </p>
          ) : null}

          <p className="text-xs leading-relaxed text-text-muted">
            {actions.privacyNote}
          </p>
        </div>
      </aside>

      <Dialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title={actions.clearConfirmTitle}
        description={actions.clearConfirmMessage}
      >
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmClearOpen(false)}
          >
            {actions.clearConfirmCancel}
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirmClear}>
            {actions.clearConfirmAccept}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

