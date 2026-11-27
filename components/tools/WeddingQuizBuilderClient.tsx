"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  HelpCircle,
  MessageCircle,
  Mic,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { SmartToolCta } from "@/components/tools/SmartToolCta";
import {
  buildQuizQuestionsForTopic,
  drawQuizStoryCard,
  formatGroupChatQuizText,
  formatMcScriptText,
  QUIZ_TOPIC_OPTIONS,
  type QuizBuilderConfig,
  type QuizOutputMode,
  type QuizQuestionItem,
  type QuizTopicId,
} from "@/lib/wedding-quiz-builder";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "inviwedd_wedding_quiz_v1";

type WizardStep = 1 | 2 | 3 | "result";

const STEP_META: ReadonlyArray<{ id: WizardStep; label: string }> = [
  { id: 1, label: "1. Cặp đôi & Chủ đề" },
  { id: 2, label: "2. Chọn & sửa câu hỏi" },
  { id: 3, label: "3. Kiểu xuất" },
  { id: "result", label: "4. Bộ Quiz hoàn chỉnh" },
];

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export function WeddingQuizBuilderClient() {
  const [step, setStep] = React.useState<WizardStep>(1);
  const [config, setConfig] = React.useState<QuizBuilderConfig>({
    groomName: "Minh Hoàng",
    brideName: "Thu Hà",
    topic: "all",
    outputMode: "mc_script",
  });
  const [questions, setQuestions] = React.useState<QuizQuestionItem[]>(() =>
    buildQuizQuestionsForTopic("all", "Minh Hoàng", "Thu Hà"),
  );
  const [slideIndex, setSlideIndex] = React.useState(0);
  const [revealAnswer, setRevealAnswer] = React.useState(false);
  const [copiedMode, setCopiedMode] = React.useState<"mc" | "chat" | null>(null);
  const [downloadedCard, setDownloadedCard] = React.useState(false);

  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const storyCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const activeQuestions = React.useMemo(
    () => questions.filter((q) => q.selected),
    [questions],
  );

  // Restore saved browser progress cleanly outside synchronous effect body
  React.useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active || typeof window === "undefined") return;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          config?: QuizBuilderConfig;
          questions?: QuizQuestionItem[];
        };
        if (parsed.config && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          setConfig(parsed.config);
          setQuestions(parsed.questions);
        }
      } catch {
        // Ignore corrupted localStorage
      }
    });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, questions }));
    } catch {
      // Ignore storage quota issues
    }
  }, [config, questions]);

  const safeSlideIndex = Math.min(slideIndex, Math.max(0, activeQuestions.length - 1));
  const currentQuizQuestion = activeQuestions[safeSlideIndex] ?? questions[0];

  React.useEffect(() => {
    if (step !== "result" || !currentQuizQuestion) return;
    const canvas = storyCanvasRef.current;
    if (!canvas) return;
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawQuizStoryCard(
      ctx,
      config,
      currentQuizQuestion,
      safeSlideIndex + 1,
      Math.max(1, activeQuestions.length),
      revealAnswer,
    );
  }, [
    activeQuestions.length,
    config,
    currentQuizQuestion,
    revealAnswer,
    safeSlideIndex,
    step,
  ]);

  const goToStep = (next: WizardStep) => {
    setStep(next);
    window.setTimeout(() => {
      headingRef.current?.focus();
    }, 30);
  };

  const handleSelectTopic = (topic: QuizTopicId) => {
    const nextConfig = { ...config, topic };
    setConfig(nextConfig);
    setQuestions(
      buildQuizQuestionsForTopic(topic, nextConfig.groomName, nextConfig.brideName),
    );
    goToStep(2);
  };

  const handleRegenerateNames = () => {
    setQuestions(
      buildQuizQuestionsForTopic(config.topic, config.groomName, config.brideName),
    );
  };

  const handleSelectOutputMode = (mode: QuizOutputMode) => {
    setConfig((prev) => ({ ...prev, outputMode: mode }));
    goToStep("result");
  };

  const toggleQuestionSelected = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q)),
    );
  };

  const updateQuestionField = (
    id: string,
    patch: Partial<Pick<QuizQuestionItem, "prompt" | "correctIndex" | "mcNote">>,
  ) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
  };

  const updateQuestionOption = (id: string, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const nextOpts: [string, string, string, string] = [...q.options] as [
          string,
          string,
          string,
          string,
        ];
        nextOpts[optIdx] = value;
        return { ...q, options: nextOpts };
      }),
    );
  };

  const addCustomQuestion = () => {
    const customId = `custom-${Date.now()}`;
    setQuestions((prev) => [
      {
        id: customId,
        topic: "best_friends",
        prompt: `${config.groomName || "Chú rể"} & ${config.brideName || "Cô dâu"} thích đi đâu nhất vào dịp kỷ niệm?`,
        options: ["Đà Lạt", "Vũng Tàu / Biển gần", "Ở nhà nấu ăn", "Đi xem phim & ăn khuya"],
        correctIndex: 0,
        selected: true,
        mcNote: "Câu hỏi tự thêm theo kỷ niệm riêng của hai bạn.",
      },
      ...prev,
    ]);
  };

  const handleCopy = async (kind: "mc" | "chat") => {
    const text =
      kind === "mc"
        ? formatMcScriptText(config, questions)
        : formatGroupChatQuizText(config, questions);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMode(kind);
      window.setTimeout(() => setCopiedMode(null), 2200);
    } catch {
      // Clipboard unsupported
    }
  };

  const handleDownloadStoryCard = () => {
    const canvas = storyCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `quiz-dam-cuoi-cau-${safeSlideIndex + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setDownloadedCard(true);
    window.setTimeout(() => setDownloadedCard(false), 2200);
  };

  const handleResetAll = () => {
    const defaults: QuizBuilderConfig = {
      groomName: "Minh Hoàng",
      brideName: "Thu Hà",
      topic: "all",
      outputMode: "mc_script",
    };
    setConfig(defaults);
    setQuestions(buildQuizQuestionsForTopic("all", "Minh Hoàng", "Thu Hà"));
    setSlideIndex(0);
    setRevealAnswer(false);
    goToStep(1);
  };

  const progressIndex = STEP_META.findIndex((item) => item.id === step);
  const progressPercent = Math.round(((progressIndex + 1) / STEP_META.length) * 100);

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#E8E2D9] bg-white p-5 sm:p-7 shadow-xs">
        {/* Thin progress header */}
        <div className="space-y-3 border-b border-[#E8E2D9] pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[#7A1C24]">
              {STEP_META[progressIndex]?.label}
            </span>
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 text-[#6B655E] hover:text-[#1F1D1A]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Làm lại từ đầu</span>
            </button>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F4EFEA]">
            <div
              className="h-full rounded-full bg-[#7A1C24] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Couple names + Topic */}
        {step === 1 && (
          <div className="mt-6 space-y-6">
            <div>
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="font-serif text-2xl font-normal text-[#1F1D1A] focus:outline-none"
              >
                Bước 1: Nhập tên cặp đôi và chọn chủ đề bộ câu hỏi
              </h2>
              <p className="mt-1 text-sm text-[#6B655E]">
                Tên của hai bạn sẽ được ghép tự động vào từng câu đố. Bấm chọn chủ đề bên dưới để đi tiếp ngay.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="quiz-groom" className="block text-xs font-semibold text-[#1F1D1A]">
                  Tên Chú rể
                </label>
                <input
                  id="quiz-groom"
                  type="text"
                  maxLength={35}
                  value={config.groomName}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, groomName: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="quiz-bride" className="block text-xs font-semibold text-[#1F1D1A]">
                  Tên Cô dâu
                </label>
                <input
                  id="quiz-bride"
                  type="text"
                  maxLength={35}
                  value={config.brideName}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, brideName: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUIZ_TOPIC_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectTopic(option.id)}
                  className={cn(
                    "group flex flex-col justify-between rounded-xl border p-4 text-left transition-all",
                    config.topic === option.id
                      ? "border-[#7A1C24] bg-[#7A1C24]/5"
                      : "border-[#E8E2D9] bg-[#FAF8F5] hover:border-[#B89B72]",
                  )}
                >
                  <div>
                    <p className="font-serif text-lg font-medium text-[#1F1D1A] group-hover:text-[#7A1C24]">
                      {option.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#6B655E]">
                      {option.description}
                    </p>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#7A1C24]">
                    <span>Chọn &amp; sang bước 2</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Customize 6-12 questions */}
        {step === 2 && (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-serif text-2xl font-normal text-[#1F1D1A] focus:outline-none"
                >
                  Bước 2: Chọn và chỉnh sửa câu hỏi ({activeQuestions.length} câu đã chọn)
                </h2>
                <p className="mt-1 text-sm text-[#6B655E]">
                  Bấm tích chọn đáp án đúng cho từng câu, sửa chữ nếu cần hoặc bỏ qua để dùng ngay bộ gợi ý chuẩn.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addCustomQuestion}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 py-2 text-xs font-medium text-[#1F1D1A] hover:border-[#7A1C24]"
                >
                  <Plus className="h-3.5 w-3.5 text-[#7A1C24]" aria-hidden="true" />
                  <span>Thêm câu hỏi riêng</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateNames}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-3.5 py-2 text-xs font-medium text-[#6B655E] hover:text-[#1F1D1A]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#B89B72]" aria-hidden="true" />
                  <span>Khôi phục bộ mẫu</span>
                </button>
              </div>
            </div>

            <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
              {questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    q.selected
                      ? "border-[#E8E2D9] bg-[#FAF8F5]"
                      : "border-[#E8E2D9]/60 bg-white opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#7A1C24]">
                      <input
                        type="checkbox"
                        checked={q.selected}
                        onChange={() => toggleQuestionSelected(q.id)}
                        className="h-4 w-4 accent-[#7A1C24]"
                      />
                      <span>Câu {qIdx + 1}</span>
                    </label>
                    <span className="text-[11px] text-[#6B655E]">
                      {q.selected ? "Hiển thị trong bộ Quiz" : "Đang ẩn"}
                    </span>
                  </div>

                  <input
                    type="text"
                    aria-label={`Nội dung câu hỏi ${qIdx + 1}`}
                    value={q.prompt}
                    onChange={(e) => updateQuestionField(q.id, { prompt: e.target.value })}
                    className="mt-2.5 w-full rounded-lg border border-[#E8E2D9] bg-white px-3 py-2 text-sm font-medium text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none"
                  />

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = q.correctIndex === oIdx;
                      return (
                        <div key={`${q.id}-opt-${oIdx}`} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuestionField(q.id, { correctIndex: oIdx })}
                            title="Chọn làm đáp án đúng"
                            className={cn(
                              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors",
                              isCorrect
                                ? "border-[#7A1C24] bg-[#7A1C24] text-white"
                                : "border-[#E8E2D9] bg-white text-[#6B655E] hover:border-[#7A1C24]",
                            )}
                          >
                            {OPTION_LETTERS[oIdx]}
                          </button>
                          <input
                            type="text"
                            aria-label={`Đáp án ${OPTION_LETTERS[oIdx]} câu ${qIdx + 1}`}
                            value={opt}
                            onChange={(e) => updateQuestionOption(q.id, oIdx, e.target.value)}
                            className="w-full rounded-lg border border-[#E8E2D9] bg-white px-2.5 py-1.5 text-xs text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E2D9] pt-4">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-4 text-xs font-medium text-[#1F1D1A] hover:border-[#7A1C24]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Quay lại</span>
              </button>

              <button
                type="button"
                disabled={activeQuestions.length === 0}
                onClick={() => goToStep(3)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#7A1C24] px-5 text-xs font-medium text-white transition-colors hover:bg-[#5E141B] disabled:opacity-50"
              >
                <span>Chọn kiểu sử dụng ({activeQuestions.length} câu)</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Choose Output Mode */}
        {step === 3 && (
          <div className="mt-6 space-y-5">
            <div>
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="font-serif text-2xl font-normal text-[#1F1D1A] focus:outline-none"
              >
                Bước 3: Bạn muốn dùng bộ Quiz này theo cách nào?
              </h2>
              <p className="mt-1 text-sm text-[#6B655E]">
                Ở màn hình kết quả tiếp theo bạn vẫn có thể chuyển qua lại cả ba chế độ bất kỳ lúc nào.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              {[
                {
                  id: "mc_script" as const,
                  title: "Kịch bản MC & Trình chiếu",
                  desc: "Gồm lời dẫn mở màn, câu hỏi, đáp án đúng và gợi ý khuấy động cho MC.",
                  icon: Mic,
                },
                {
                  id: "group_chat" as const,
                  title: "Gửi nhóm chat trước tiệc",
                  desc: "Tự ẩn đáp án để gửi nhóm bạn thân đoán trước trên Zalo hoặc Facebook.",
                  icon: MessageCircle,
                },
                {
                  id: "story_card" as const,
                  title: "Thẻ ảnh Story 9:16 đố vui",
                  desc: "Xuất ảnh PNG câu hỏi đố vui 1080×1920 đăng Story Instagram/Facebook.",
                  icon: HelpCircle,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectOutputMode(item.id)}
                    className="flex flex-col justify-between rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 text-left transition-all hover:border-[#7A1C24] hover:bg-[#7A1C24]/5"
                  >
                    <div>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8E2D9] bg-white text-[#7A1C24]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <p className="mt-3 font-serif text-lg font-medium text-[#1F1D1A]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#6B655E]">
                        {item.desc}
                      </p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#7A1C24]">
                      <span>Xem kết quả ngay</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-[#E8E2D9] pt-4">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-4 text-xs font-medium text-[#1F1D1A] hover:border-[#7A1C24]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Quay lại chỉnh câu hỏi</span>
              </button>
            </div>
          </div>
        )}

        {/* RESULT SCREEN: Stage Slide Runner + Copy Scripts + Story PNG Export */}
        {step === "result" && currentQuizQuestion && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-serif text-2xl font-normal text-[#1F1D1A] focus:outline-none"
                >
                  Bộ câu hỏi Quiz của {config.groomName} &amp; {config.brideName} ({activeQuestions.length} câu)
                </h2>
                <p className="mt-1 text-xs text-[#6B655E]">
                  Trình chiếu từng câu cho MC ngay trên trình duyệt, sao chép kịch bản hoặc tải thẻ ảnh Story.
                </p>
              </div>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 text-xs font-medium text-[#1F1D1A] hover:border-[#7A1C24]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Chỉnh lại câu hỏi</span>
              </button>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleCopy("mc")}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#7A1C24] px-4 text-xs font-medium text-white hover:bg-[#5E141B]"
              >
                {copiedMode === "mc" ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>Đã chép kịch bản MC</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    <span>Sao chép kịch bản MC (kèm đáp án)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCopy("chat")}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-[#E8E2D9] bg-white px-4 text-xs font-medium text-[#1F1D1A] hover:border-[#7A1C24]"
              >
                {copiedMode === "chat" ? (
                  <>
                    <Check className="h-4 w-4 text-[#7A1C24]" aria-hidden="true" />
                    <span>Đã chép bản đố nhóm chat</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 text-[#7A1C24]" aria-hidden="true" />
                    <span>Sao chép gửi nhóm chat (ẩn đáp án)</span>
                  </>
                )}
              </button>
            </div>

            {/* Interactive Runner + Story Preview Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
              {/* Stage slide runner */}
              <div className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[#7A1C24] px-3 py-1 text-[11px] font-semibold text-white">
                    Câu {safeSlideIndex + 1} / {activeQuestions.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRevealAnswer((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-3 py-1 text-xs font-medium text-[#1F1D1A] hover:border-[#7A1C24]"
                  >
                    {revealAnswer ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5 text-[#7A1C24]" aria-hidden="true" />
                        <span>Ẩn đáp án</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5 text-[#7A1C24]" aria-hidden="true" />
                        <span>Hiện đáp án đúng</span>
                      </>
                    )}
                  </button>
                </div>

                <h3 className="font-serif text-xl font-medium leading-snug text-[#1F1D1A]">
                  {currentQuizQuestion.prompt}
                </h3>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {currentQuizQuestion.options.map((opt, idx) => {
                    const isCorrect = revealAnswer && idx === currentQuizQuestion.correctIndex;
                    return (
                      <div
                        key={`${currentQuizQuestion.id}-view-${idx}`}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border p-3 text-sm transition-colors",
                          isCorrect
                            ? "border-[#7A1C24] bg-[#7A1C24] text-white"
                            : "border-[#E8E2D9] bg-white text-[#1F1D1A]",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                            isCorrect
                              ? "bg-[#E3C37A] text-[#1F1D1A]"
                              : "bg-[#FAF8F5] text-[#7A1C24]",
                          )}
                        >
                          {OPTION_LETTERS[idx]}
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {currentQuizQuestion.mcNote && (
                  <p className="rounded-xl border border-[#E8E2D9] bg-white px-3.5 py-2.5 text-xs text-[#6B655E]">
                    <strong className="text-[#1F1D1A]">Gợi ý MC:</strong>{" "}
                    {currentQuizQuestion.mcNote}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={safeSlideIndex === 0}
                    onClick={() => {
                      setSlideIndex((prev) => Math.max(0, prev - 1));
                      setRevealAnswer(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-[#E8E2D9] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1F1D1A] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Câu trước</span>
                  </button>
                  <button
                    type="button"
                    disabled={safeSlideIndex >= activeQuestions.length - 1}
                    onClick={() => {
                      setSlideIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1));
                      setRevealAnswer(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-[#E8E2D9] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1F1D1A] disabled:opacity-40"
                  >
                    <span>Câu tiếp</span>
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Story 9:16 quiz card download */}
              <div className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#B89B72]">
                      THẺ CÂU HỎI STORY 9:16
                    </p>
                    <p className="text-xs text-[#6B655E]">1080 × 1920 px</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadStoryCard}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#7A1C24] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#5E141B]"
                  >
                    {downloadedCard ? (
                      <>
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Đã tải PNG</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Tải thẻ câu {safeSlideIndex + 1}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-center">
                  <canvas
                    ref={storyCanvasRef}
                    className="w-full max-w-[230px] aspect-[9/16] rounded-xl border border-[#E8E2D9] shadow-xs"
                    aria-label={`Thẻ câu hỏi Story số ${safeSlideIndex + 1}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <SmartToolCta
        eyebrow="NÂNG TẦM TRẢI NGHIỆM KHÁCH MỜI TẠI SẢNH TIỆC"
        title="Kết hợp Quiz với mã QR Check-in và Màn hình LED chiếu ảnh khách mời"
        description="Tạo thiệp cưới online Inviwedd để đồng bộ số bàn khách mời, bật tường lời chúc và trình chiếu trực tiếp ảnh chụp từ điện thoại khách lên màn hình sân khấu."
        buttonText="Tạo thiệp cưới miễn phí"
        buttonHref="/tao-thiep"
        highlightPulse={Boolean(copiedMode || downloadedCard)}
      />
    </div>
  );
}
