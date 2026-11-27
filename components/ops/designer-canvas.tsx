"use client";

import * as React from "react";
import Link from "next/link";
import "@/styles/designer-animations.css";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Heart,
  ImagePlus,
  Layers,
  Loader2,
  MapPin,
  Music,
  Play,
  QrCode,
  Redo2,
  RotateCw,
  Save,
  Snowflake,
  Flower2,
  Type,
  Undo2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { opsRequest } from "@/lib/ops-api";
import {
  createHistory,
  pushHistory,
  canUndo,
  canRedo,
  undo,
  redo,
  type HistoryState,
} from "@/lib/designer-history";
import {
  DESIGNER_FONT_GROUPS,
  DESIGNER_FONT_OPTIONS,
  DESIGNER_TEXT_EFFECT_OPTIONS,
  DESIGNER_TEXT_STYLES,
  getTextEffectStyles,
} from "@/components/designer/designer-fonts";
import { DesignerAnimationPanel } from "./designer-animation-panel";
import { DesignerFallingPanel } from "./designer-falling-panel";
import { ElementAnimator } from "@/components/designer/element-animator";
import { FallingEffectCanvas } from "@/components/designer/falling-effect-canvas";
import {
  createDefaultFallingEffect,
} from "@/components/designer/falling-effect-presets";
import {
  DEFAULT_DESIGNER_COVER,
  DESIGNER_COVER_OPTIONS,
} from "@/components/designer/cover-templates";
import {
  createDefaultEntrance,
  ENTRANCE_OPTIONS,
} from "@/components/designer/animation-catalog";
import { sortDesignerElementsByLayer, elementLayer, designerLayerCount } from "@/components/designer/layer-order";
import {
  DESIGNER_ACTIONS,
  DESIGNER_BLOCKS,
  DESIGNER_ICONS,
  DESIGNER_TEXT_ALIGNS,
  PHOTO_SLOTS,
  PLACEHOLDER_OPTIONS,
  type DesignerCanvasContent,
  type DesignerCover,
  type DesignerElement,
  type DesignerEntrancePreset,
  type DesignerFallingEffectElement,
  type DesignerPage,
  type DesignerTextEffect,
  type DesignerTextElement,
} from "./designer-types";

interface DesignerCanvasProps {
  templateId: string;
  name: string;
  initialCanvas: DesignerCanvasContent;
  backgroundKey: string | null;
}

const DEFAULT_FONT_FAMILY =
  DESIGNER_FONT_OPTIONS.find((font) => font.label === "Playfair Display")?.value ??
  DESIGNER_FONT_OPTIONS[0]?.value ??
  "var(--font-playfair)";

function elementLabel(element: DesignerElement): string {
  if (element.type === "text") {
    return element.placeholder
      ? `[${element.placeholder}] ${element.text}`
      : element.text || "Text";
  }
  if (element.type === "image") return "Ảnh minh họa";
  if (element.type === "photo") return `Khung ảnh (${element.slot})`;
  if (element.type === "box") return "Khung viền / nền";
  if (element.type === "icon") return `Icon (${element.icon})`;
  if (element.type === "button") return `Nút: ${element.label}`;
  if (element.type === "fallingEffect") return `Hiệu ứng rơi (${element.preset})`;
  return `Khối: ${element.block}`;
}

function resolveCanvasFont(family: string): string {
  if (family.includes("playfair")) return "Georgia, serif";
  if (
    family.includes("garamond") ||
    family.includes("lora") ||
    family.includes("viaoda")
  ) {
    return "Garamond, Georgia, serif";
  }
  if (
    family.includes("nautigal") ||
    family.includes("pinyon") ||
    family.includes("carattere")
  ) {
    return "cursive";
  }
  return "Arial, sans-serif";
}

function normalizePages(canvas: DesignerCanvasContent): DesignerPage[] {
  if (Array.isArray(canvas.pages) && canvas.pages.length > 0) return canvas.pages;
  return [
    {
      id: "page-1",
      name: "Bìa",
      background: canvas.background || "#FAF8F5",
      backgroundUrl: canvas.backgroundUrl,
      elements: Array.isArray(canvas.elements) ? canvas.elements : [],
    },
  ];
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.readAsDataURL(blob);
  });
}

async function fileToWebpDataUrl(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Trình duyệt không hỗ trợ canvas.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  if (!blob) throw new Error("Không xuất được ảnh webp.");
  return {
    dataUrl: await blobToDataUrl(blob),
    width: canvas.width,
    height: canvas.height,
  };
}

export function DesignerCanvas({
  templateId,
  name,
  initialCanvas,
  backgroundKey,
}: DesignerCanvasProps) {
  const [pages, setPages] = React.useState<DesignerPage[]>(() =>
    normalizePages(initialCanvas),
  );
  const [activeId, setActiveId] = React.useState(() => normalizePages(initialCanvas)[0].id);
  const activeIndex = Math.max(0, pages.findIndex((page) => page.id === activeId));
  const activePage = pages[activeIndex] ?? pages[0];
  const [cover, setCover] = React.useState<DesignerCover | undefined>(
    initialCanvas.cover,
  );
  const [accentColor, setAccentColor] = React.useState(
    initialCanvas.accentColor ?? "#5f4636",
  );
  const [coverUploading, setCoverUploading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"element" | "layer" | "cover">("element");
  const updateCover = React.useCallback((patch: Partial<DesignerCover>) => {
    setCover((previous) => ({
      ...DEFAULT_DESIGNER_COVER,
      ...previous,
      ...patch,
    }));
  }, []);
  const orderedElements = React.useMemo(
    () => sortDesignerElementsByLayer(activePage.elements),
    [activePage.elements],
  );

  const content: DesignerCanvasContent = {
    width: initialCanvas.width,
    height: initialCanvas.height,
    background: activePage.background,
    backgroundUrl: activePage.backgroundUrl,
    elements: activePage.elements,
    cover,
    accentColor,
  };

  const setContent = React.useCallback(
    (updater: React.SetStateAction<DesignerCanvasContent>) => {
      setPages((previous) => {
        const index = previous.findIndex((page) => page.id === activeId);
        if (index < 0) return previous;
        const current = previous[index];
        const currentContent: DesignerCanvasContent = {
          width: initialCanvas.width,
          height: initialCanvas.height,
          ...current,
        };
        const next =
          typeof updater === "function"
            ? (updater as (prev: DesignerCanvasContent) => DesignerCanvasContent)(currentContent)
            : updater;
        const updated = previous.slice();
        updated[index] = {
          ...current,
          background: next.background,
          backgroundUrl: next.backgroundUrl,
          elements: next.elements,
        };
        return updated;
      });
    },
    [activeId, initialCanvas.height, initialCanvas.width],
  );

  const addPage = () => {
    const id = crypto.randomUUID();
    setPages((previous) => [
      ...previous,
      {
        id,
        name: previous.length === 1 ? "Nội dung" : `Nội dung ${previous.length}`,
        background: "#FAF8F5",
        elements: [],
      },
    ]);
    setActiveId(id);
  };

  const removePage = (id: string) => {
    if (pages.length <= 1) return;
    const remaining = pages.filter((page) => page.id !== id);
    setPages(remaining);
    if (activeId === id) setActiveId(remaining[0].id);
  };
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const selectedId = selectedIds[0] ?? null;
  const setSelectedId = React.useCallback((id: string | null) => {
    setSelectedIds(id ? [id] : []);
  }, []);

  // Quản lý Undo / Redo cho cấu trúc trang và nội dung
  type CanvasSnapshot = {
    pages: DesignerPage[];
    cover?: DesignerCover;
    accentColor: string;
  };

  const [history, setHistory] = React.useState<HistoryState<CanvasSnapshot>>(() =>
    createHistory({
      pages: normalizePages(initialCanvas),
      cover: initialCanvas.cover,
      accentColor: initialCanvas.accentColor ?? "#5f4636",
    }),
  );

  const isUndoingRef = React.useRef(false);
  const isInteractingRef = React.useRef(false);

  const lastSavedRef = React.useRef<string>(
    JSON.stringify({
      canvas_json: {
        width: initialCanvas.width,
        height: initialCanvas.height,
        background: initialCanvas.background,
        backgroundUrl: initialCanvas.backgroundUrl,
        elements: initialCanvas.elements,
        cover: initialCanvas.cover,
        accentColor: initialCanvas.accentColor ?? "#5f4636",
        pages: normalizePages(initialCanvas),
      },
    }),
  );

  const [autoSaveStatus, setAutoSaveStatus] = React.useState<
    "saved" | "saving" | "unsaved"
  >("saved");

  const handleUndo = React.useCallback(() => {
    setHistory((prev) => {
      if (!canUndo(prev)) return prev;
      const next = undo(prev);
      isUndoingRef.current = true;
      setPages(next.present.pages);
      setCover(next.present.cover);
      setAccentColor(next.present.accentColor);
      setSelectedIds([]);
      return next;
    });
  }, []);

  const handleRedo = React.useCallback(() => {
    setHistory((prev) => {
      if (!canRedo(prev)) return prev;
      const next = redo(prev);
      isUndoingRef.current = true;
      setPages(next.present.pages);
      setCover(next.present.cover);
      setAccentColor(next.present.accentColor);
      setSelectedIds([]);
      return next;
    });
  }, []);

  // Tự động ghi nhận snapshot vào history khi pages/cover/accentColor thay đổi (ngoài lúc undo hoặc tương tác kéo thả)
  React.useEffect(() => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }
    if (isInteractingRef.current) {
      return;
    }
    setHistory((prev) =>
      pushHistory(prev, { pages, cover, accentColor }),
    );
  }, [pages, cover, accentColor]);

  // Phím tắt bàn phím: Ctrl+Z / Cmd+Z (Undo), Ctrl+Y / Shift+Cmd+Z (Redo)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select"
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Dirty guard: cảnh báo trước khi rời trang nếu có thay đổi chưa lưu
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const current = JSON.stringify({
        canvas_json: { ...content, pages },
      });
      if (current !== lastSavedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [content, pages]);

  // Autosave: debounce PATCH 1500ms khi ngừng chỉnh sửa và không trong lúc tương tác chuột
  React.useEffect(() => {
    const currentPayload = JSON.stringify({
      canvas_json: { ...content, pages },
    });
    if (currentPayload === lastSavedRef.current) {
      setAutoSaveStatus("saved");
      return;
    }

    setAutoSaveStatus("unsaved");
    const timer = setTimeout(async () => {
      if (isInteractingRef.current) return;
      setAutoSaveStatus("saving");
      try {
        await opsRequest(`/api/ops/designer/templates/${templateId}`, {
          method: "PATCH",
          body: currentPayload,
        });
        lastSavedRef.current = currentPayload;
        setAutoSaveStatus("saved");
      } catch {
        setAutoSaveStatus("unsaved");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [content, pages, templateId]);

  const [playingAnimKey, setPlayingAnimKey] = React.useState(0);
  const [playingIds, setPlayingIds] = React.useState<Set<string> | null>(null);
  const stopPlayTimerRef = React.useRef<number>(0);

  const handlePlayElement = React.useCallback((id: string) => {
    if (stopPlayTimerRef.current) window.clearTimeout(stopPlayTimerRef.current);
    setPlayingIds(new Set([id]));
    setPlayingAnimKey((k) => k + 1);
    stopPlayTimerRef.current = window.setTimeout(() => {
      setPlayingIds(null);
    }, 3200);
  }, []);

  const handlePlayAll = React.useCallback(() => {
    if (stopPlayTimerRef.current) window.clearTimeout(stopPlayTimerRef.current);
    const allIds = content.elements.map((el) => el.id);
    setPlayingIds(new Set(allIds));
    setPlayingAnimKey((k) => k + 1);
    stopPlayTimerRef.current = window.setTimeout(() => {
      setPlayingIds(null);
    }, 4500);
  }, [content.elements]);

  const applyBatchAnimation = React.useCallback((preset: DesignerEntrancePreset | null) => {
    setContent((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => {
        if (!selectedIds.includes(el.id)) return el;
        if (!preset) {
          if (!el.animation) return el;
          const rest = { ...el.animation };
          delete rest.in;
          const hasOther = rest.loop || rest.out || rest.parallax;
          return { ...el, animation: hasOther ? rest : undefined };
        }
        return {
          ...el,
          animation: {
            ...el.animation,
            in: createDefaultEntrance(preset),
          },
        };
      }),
    }));
  }, [selectedIds, setContent]);

  const deleteBatchSelected = React.useCallback(() => {
    setContent((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => !selectedIds.includes(el.id)),
    }));
    setSelectedIds([]);
  }, [selectedIds, setContent]);

  const layerCount = React.useMemo(
    () => designerLayerCount(content.elements),
    [content.elements],
  );

  const moveLayer = React.useCallback(
    (id: string, direction: "up" | "down" | "front" | "back") => {
      setContent((prev) => {
        const elements = [...prev.elements];
        const currentIndex = elements.findIndex((element) => element.id === id);
        if (currentIndex < 0) return prev;
        let targetIndex = currentIndex;
        if (direction === "up") targetIndex = Math.min(elements.length - 1, currentIndex + 1);
        if (direction === "down") targetIndex = Math.max(0, currentIndex - 1);
        if (direction === "front") targetIndex = elements.length - 1;
        if (direction === "back") targetIndex = 0;
        if (targetIndex === currentIndex) return prev;
        const [element] = elements.splice(currentIndex, 1);
        elements.splice(targetIndex, 0, element);
        return { ...prev, elements };
      });
    },
    [setContent],
  );
  const [saving, setSaving] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [liveFallingPreview, setLiveFallingPreview] = React.useState(false);
  const boardRef = React.useRef<HTMLDivElement | null>(null);
  const dragRef = React.useRef<{
    id: string;
    startX: number;
    startY: number;
    xPct: number;
    yPct: number;
    width: number;
    height: number;
  } | null>(null);
  const rotateRef = React.useRef<{
    id: string;
    centerX: number;
    centerY: number;
    startAngle: number;
    startRotation: number;
  } | null>(null);
  const resizeRef = React.useRef<{
    id: string;
    corner: "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    x: number;
    y: number;
    w: number;
    h: number | null;
    boardW: number;
    boardH: number;
  } | null>(null);

  const startResize = (
    event: React.PointerEvent<HTMLSpanElement>,
    element: DesignerElement,
    corner: "nw" | "ne" | "sw" | "se",
  ) => {
    event.stopPropagation();
    isInteractingRef.current = true;
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const wrapper = event.currentTarget.parentElement;
    const wrapperRect = wrapper?.getBoundingClientRect();
    const existingHeight =
      "hPct" in element && typeof element.hPct === "number" ? element.hPct : null;
    const fallbackHeight =
      wrapperRect && rect.height > 0 ? (wrapperRect.height / rect.height) * 100 : null;

    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = {
      id: element.id,
      corner,
      startX: event.clientX,
      startY: event.clientY,
      x: element.xPct,
      y: element.yPct,
      w: element.wPct,
      h: existingHeight ?? fallbackHeight,
      boardW: rect.width,
      boardH: rect.height,
    };
  };

  const moveResize = (
    event: React.PointerEvent<HTMLSpanElement>,
    element: DesignerElement,
  ) => {
    const resize = resizeRef.current;
    if (!resize || resize.id !== element.id) return;

    const dx = ((event.clientX - resize.startX) / resize.boardW) * 100;
    const dy = ((event.clientY - resize.startY) / resize.boardH) * 100;
    let { x, y, w } = resize;

    if (resize.corner === "ne" || resize.corner === "se") w = resize.w + dx;
    if (resize.corner === "nw" || resize.corner === "sw") {
      x = resize.x + dx;
      w = resize.w - dx;
    }

    const baseH = resize.h;
    let h = baseH;
    if (h !== null && baseH !== null) {
      if (resize.corner === "sw" || resize.corner === "se") h = baseH + dy;
      if (resize.corner === "nw" || resize.corner === "ne") {
        y = resize.y + dy;
        h = baseH - dy;
      }
    }

    w = Math.max(4, Math.min(100, w));
    x = Math.max(0, Math.min(100 - w, x));
    if (h !== null) {
      h = Math.max(4, Math.min(100, h));
      y = Math.max(0, Math.min(100 - h, y));
    } else {
      y = Math.max(0, Math.min(96, y));
    }

    updateElement(element.id, {
      xPct: x,
      yPct: y,
      wPct: w,
      ...(h !== null ? { hPct: h } : {}),
    } as Partial<DesignerElement>);
  };

  const selected = content.elements.find((element) => element.id === selectedId) ?? null;

  const updateElement = (id: string, patch: Partial<DesignerElement>) => {
    setContent((previous) => ({
      ...previous,
      elements: previous.elements.map((element) =>
        element.id === id ? ({ ...element, ...patch } as DesignerElement) : element,
      ),
    }));
  };

  const addText = (placeholder: string | null) => {
    const id = crypto.randomUUID();
    const element: DesignerTextElement = {
      id,
      type: "text",
      xPct: 12,
      yPct: 30,
      wPct: 76,
      text: placeholder
        ? PLACEHOLDER_OPTIONS.find((option) => option.id === placeholder)?.sample ?? ""
        : "Nhập nội dung",
      fontSize: 28,
      color: "#2C2523",
      fontFamily: DEFAULT_FONT_FAMILY,
      placeholder,
    };
    setContent((previous) => ({ ...previous, elements: [...previous.elements, element] }));
    setSelectedId(id);
  };

  const addPhoto = () => {
    const id = crypto.randomUUID();
    setContent((previous) => ({
      ...previous,
      elements: [
        ...previous.elements,
        {
          id,
          type: "photo",
          xPct: 20,
          yPct: 18,
          wPct: 60,
          hPct: 34,
          slot: "hero",
          radius: 16,
          fit: "cover",
        },
      ],
    }));
    setSelectedId(id);
  };

  const addBox = () => {
    const id = crypto.randomUUID();
    setContent((previous) => ({
      ...previous,
      elements: [
        ...previous.elements,
        {
          id,
          type: "box",
          xPct: 15,
          yPct: 20,
          wPct: 70,
          hPct: 24,
          fill: "#F3EFEA",
          border: "#E6E0D6",
          radius: 16,
        },
      ],
    }));
    setSelectedId(id);
  };

  const addIcon = () => {
    const id = crypto.randomUUID();
    setContent((previous) => ({
      ...previous,
      elements: [
        ...previous.elements,
        {
          id,
          type: "icon",
          xPct: 44,
          yPct: 24,
          wPct: 12,
          icon: "Heart",
          color: "#B87D74",
        },
      ],
    }));
    setSelectedId(id);
  };

  const addFallingEffect = () => {
    const existing = content.elements.filter(
      (element) => element.type === "fallingEffect",
    ).length;
    if (existing >= 2) {
      setError("Tối đa 2 hiệu ứng rơi trong một thiệp.");
      return;
    }
    const id = crypto.randomUUID();
    const element: DesignerFallingEffectElement = {
      id,
      type: "fallingEffect",
      ...createDefaultFallingEffect("sakura"),
    };
    setError(null);
    setContent((previous) => ({
      ...previous,
      elements: [...previous.elements, element],
    }));
    setSelectedId(id);
  };

  const applyAutoAnimations = () => {
    const animated = content.elements.filter(
      (element) => element.type !== "fallingEffect",
    ).length;
    if (animated === 0) {
      setMessage("Chưa có element nào để áp dụng.");
      return;
    }
    setError(null);
    setContent((previous) => ({
      ...previous,
      elements: previous.elements.map((element, index) =>
        element.type === "fallingEffect"
          ? element
          : ({
            ...element,
            animation: {
              ...element.animation,
              in: {
                ...createDefaultEntrance("fadeIn"),
                delay: index * 120,
              },
            },
          } as DesignerElement),
      ),
    }));
    setMessage(`Đã thêm hiệu ứng vào ${animated} element, so le 120ms.`);
  };

  const addButton = () => {
    const id = crypto.randomUUID();
    setContent((previous) => ({
      ...previous,
      elements: [
        ...previous.elements,
        {
          id,
          type: "button",
          xPct: 25,
          yPct: 70,
          wPct: 50,
          label: "Xác nhận tham dự",
          action: "rsvp",
          fill: "#4A5D4E",
          textColor: "#FFFFFF",
          radius: 999,
        },
      ],
    }));
    setSelectedId(id);
  };

  const addBlock = (block: "calendar" | "map" | "rsvp" | "gift" | "gallery" | "music") => {
    const id = crypto.randomUUID();
    setContent((previous) => ({
      ...previous,
      elements: [
        ...previous.elements,
        {
          id,
          type: "block",
          xPct: 12,
          yPct: 50,
          wPct: 76,
          hPct: 18,
          block,
          color: "#4A5D4E",
        },
      ],
    }));
    setSelectedId(id);
  };

  const [assets, setAssets] = React.useState<{ key: string; url: string }[] | null>(null);
  const [loadingAssets, setLoadingAssets] = React.useState(false);

  const loadAssets = async () => {
    setLoadingAssets(true);
    try {
      const result = await opsRequest<{ items?: { r2_key: string }[] }>(
        "/api/ops/designer/assets",
      );
      setAssets(
        (result.items ?? []).map((item) => ({
          key: item.r2_key,
          url: `/media/${item.r2_key}`,
        })),
      );
    } catch {
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setMessage("Đang tải ảnh…");
    try {
      const { dataUrl } = await fileToWebpDataUrl(file);
      let url = dataUrl;
      let embedded = false;
      try {
        const body = await opsRequest<{ url?: string }>("/api/ops/designer/assets", {
          method: "POST",
          body: JSON.stringify({ kind: "png", dataUrl }),
        });
        if (body.url) url = body.url;
        else embedded = true;
      } catch {
        // Dev trên Windows: Miniflare/R2 không khởi động được → nhúng tạm data URL.
        embedded = true;
      }
      const id = crypto.randomUUID();
      setContent((previous) => ({
        ...previous,
        elements: [
          ...previous.elements,
          { id, type: "image", xPct: 20, yPct: 20, wPct: 60, url },
        ],
      }));
      setSelectedId(id);
      setMessage(
        embedded
          ? "R2 dev chưa chạy được — ảnh được nhúng tạm vào layout (chỉ dùng khi dev)."
          : "Đã thêm ảnh.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh thất bại.");
      setMessage(null);
    }
  };

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    setError(null);
    setMessage("Đang tải ảnh bìa…");
    try {
      const { dataUrl } = await fileToWebpDataUrl(file);
      let url = dataUrl;
      try {
        const body = await opsRequest<{ url?: string }>("/api/ops/designer/assets", {
          method: "POST",
          body: JSON.stringify({ kind: "background", dataUrl }),
        });
        if (body.url) url = body.url;
      } catch {
        // Dev local: giữ data URL để vẫn xem được bìa.
      }
      setCover((previous) => ({
        ...(previous ?? { template: "split" as const }),
        imageUrl: url,
      }));
      setMessage("Đã cập nhật ảnh bìa.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh bìa thất bại.");
      setMessage(null);
    } finally {
      setCoverUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = JSON.stringify({ canvas_json: { ...content, pages } });
      await opsRequest(`/api/ops/designer/templates/${templateId}`, {
        method: "PATCH",
        body: payload,
      });
      lastSavedRef.current = payload;
      setAutoSaveStatus("saved");
      setMessage("Đã lưu layout.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const exportBackground = async () => {
    setExporting(true);
    setError(null);
    setMessage("Đang xuất ảnh nền webp…");
    try {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = content.width * scale;
      canvas.height = content.height * scale;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Trình duyệt không hỗ trợ canvas.");

      context.fillStyle = content.background;
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (content.backgroundUrl) {
        const background = new Image();
        background.src = content.backgroundUrl;
        await new Promise<void>((resolve) => {
          background.onload = () => resolve();
          background.onerror = () => resolve();
        });
        if (background.width > 0) {
          const ratio = Math.max(
            canvas.width / background.width,
            canvas.height / background.height,
          );
          const drawWidth = background.width * ratio;
          const drawHeight = background.height * ratio;
          context.drawImage(
            background,
            (canvas.width - drawWidth) / 2,
            (canvas.height - drawHeight) / 2,
            drawWidth,
            drawHeight,
          );
        }
      }

      for (const element of content.elements) {
        const x = (element.xPct / 100) * canvas.width;
        const y = (element.yPct / 100) * canvas.height;
        const width = (element.wPct / 100) * canvas.width;

        if (element.type === "image" || (element.type === "photo" && "url" in element && element.url)) {
          const image = new Image();
          image.src = ("url" in element && typeof element.url === "string") ? element.url : "";
          if (image.src) {
            await new Promise<void>((resolve, reject) => {
              image.onload = () => resolve();
              image.onerror = () => reject(new Error("Không tải được ảnh để xuất."));
            });
            const drawHeight = (width * image.height) / image.width;
            if (element.rotation) {
              const cx = x + width / 2;
              const cy = y + drawHeight / 2;
              context.save();
              context.translate(cx, cy);
              context.rotate((element.rotation * Math.PI) / 180);
              context.drawImage(image, -width / 2, -drawHeight / 2, width, drawHeight);
              context.restore();
            } else {
              context.drawImage(image, x, y, width, drawHeight);
            }
          }
        } else if (element.type === "text") {
          const text =
            element.placeholder
              ? PLACEHOLDER_OPTIONS.find((option) => option.id === element.placeholder)?.sample ??
              element.text
              : element.text;
          const fontHeight = element.fontSize * scale * (element.lineHeight ?? 1.25);
          const drawText = element.textTransform === "uppercase" ? text.toUpperCase() : text;

          context.fillStyle = element.color;
          context.textBaseline = "top";
          context.textAlign = element.align ?? "left";
          context.font = `${element.fontStyle === "italic" ? "italic " : ""}${element.fontWeight ?? 400} ${element.fontSize * scale}px ${resolveCanvasFont(element.fontFamily)}`;
          const spacing = (element.letterSpacing ?? 0) * element.fontSize * scale;
          const spacingContext = context as CanvasRenderingContext2D & {
            letterSpacing?: string;
          };
          if ("letterSpacing" in spacingContext) {
            spacingContext.letterSpacing = `${spacing}px`;
          }

          if (element.rotation) {
            const cx = x + width / 2;
            const cy = y + fontHeight / 2;
            context.save();
            context.translate(cx, cy);
            context.rotate((element.rotation * Math.PI) / 180);
            const relX =
              element.align === "center"
                ? 0
                : element.align === "right"
                  ? width / 2
                  : -width / 2;
            context.fillText(drawText, relX, -fontHeight / 2, width);
            context.restore();
          } else {
            const textX =
              element.align === "center"
                ? x + width / 2
                : element.align === "right"
                  ? x + width
                  : x;
            context.fillText(drawText, textX, y, width);
          }
        }
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9),
      );
      if (!blob) throw new Error("Không xuất được webp.");

      const uploaded = await opsRequest<{ key?: string }>(
        "/api/ops/designer/assets",
        {
          method: "POST",
          body: JSON.stringify({ kind: "background", dataUrl: await blobToDataUrl(blob) }),
        },
      );
      if (!uploaded.key) {
        throw new Error("Tải ảnh nền thất bại.");
      }

      await opsRequest(`/api/ops/designer/templates/${templateId}`, {
        method: "PATCH",
        body: JSON.stringify({
          canvas_json: { ...content, pages },
          background_key: uploaded.key,
        }),
      });
      setMessage(`Đã xuất webp và lưu layout (${Math.round(blob.size / 1024)}KB).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xuất ảnh thất bại.");
      setMessage(null);
    } finally {
      setExporting(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const result = await opsRequest<{ version?: number }>(
        `/api/ops/designer/templates/${templateId}/publish`,
        { method: "POST" },
      );
      setMessage(`Đã xuất bản phiên bản v${result.version ?? "?"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xuất bản thất bại.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/ops/designer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text"
            aria-label="Quay lại danh sách mẫu"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-semibold text-text">{name}</h1>
            <p className="text-xs text-text-muted">
              Canvas 390×844 · xuất nền 2x webp{backgroundKey ? " · đã có ảnh nền" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addText(null)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            <Type className="h-3.5 w-3.5" aria-hidden="true" />
            Văn bản
          </button>
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text">
            <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
            Ảnh PNG
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={addPhoto}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Khung ảnh
          </button>
          <button
            type="button"
            onClick={addBox}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Khung
          </button>
          <button
            type="button"
            onClick={addIcon}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Icon
          </button>
          <button
            type="button"
            onClick={addFallingEffect}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            <Snowflake className="h-3.5 w-3.5" aria-hidden="true" />
            Hiệu ứng rơi
          </button>
          <button
            type="button"
            onClick={applyAutoAnimations}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            Tự động áp dụng
          </button>
          <button
            type="button"
            onClick={addButton}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Nút
          </button>
          <button
            type="button"
            onClick={() => addBlock("calendar")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Lịch
          </button>
          <button
            type="button"
            onClick={() => addBlock("map")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => addBlock("rsvp")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            RSVP
          </button>

          {/* Nút Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo(history)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text hover:border-accent hover:text-accent-text disabled:opacity-40 transition-colors cursor-pointer"
              title="Hoàn tác (Ctrl+Z / Cmd+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo(history)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text hover:border-accent hover:text-accent-text disabled:opacity-40 transition-colors cursor-pointer"
              title="Làm lại (Ctrl+Y / Shift+Cmd+Z)"
            >
              <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Trạng thái Autosave */}
          <span className="flex items-center gap-1.5 text-[11px] text-text-muted px-1.5 select-none">
            {autoSaveStatus === "saving" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                <span>Đang lưu...</span>
              </>
            ) : autoSaveStatus === "saved" ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span>Đã lưu</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Chưa lưu</span>
              </>
            )}
          </span>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text disabled:opacity-60 cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Lưu layout
          </button>
          <button
            type="button"
            onClick={exportBackground}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-accent-fg disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Xuất nền webp
          </button>
          <button
            type="button"
            onClick={handlePlayAll}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text hover:border-accent hover:text-accent-text"
            title="Chạy thử tất cả hoạt ảnh trên canvas bằng engine public"
          >
            <Play className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Phát tất cả
          </button>
          <Link
            href={`/ops/designer/${templateId}/preview`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Xem trước
          </Link>
          <button
            type="button"
            onClick={publish}
            disabled={publishing || content.elements.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-accent/50 bg-accent-soft px-3 text-xs font-semibold text-accent-text disabled:opacity-60"
          >
            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Xuất bản
          </button>
        </div>
      </div>

      {message && <p className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-muted">{message}</p>}
      {error && (
        <p role="alert" className="rounded-xl border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-fg">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            onClick={() => setActiveId(page.id)}
            className={cn(
              "h-9 rounded-full border px-3 text-xs font-medium transition-colors",
              page.id === activeId
                ? "border-accent bg-accent-soft text-accent-text"
                : "border-border bg-surface text-text-muted hover:bg-surface-alt",
            )}
          >
            {page.name}
          </button>
        ))}
        <button
          type="button"
          onClick={addPage}
          className="h-9 rounded-full border border-dashed border-border px-3 text-xs font-medium text-text"
        >
          + Trang
        </button>
        {pages.length > 1 && (
          <button
            type="button"
            onClick={() => removePage(activeId)}
            className="h-9 rounded-full border border-danger-border px-3 text-xs font-medium text-danger-fg"
          >
            Xoá trang
          </button>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex items-start justify-center rounded-2xl border border-border bg-surface-alt p-4">
          <div
            ref={boardRef}
            className="relative w-[390px] max-w-full touch-manipulation self-start overflow-hidden rounded-xl border border-border shadow-lg"
            style={{
              aspectRatio: `${content.width} / ${content.height}`,
              background: content.background,
              containerType: "inline-size",
            }}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setSelectedId(null);
              if (event.target === event.currentTarget) setSelectedIds([]);
            }}
          >
            {content.backgroundUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.backgroundUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
            )}
            {/* Các ref bên dưới chỉ được đọc/ghi trong pointer handler; React Compiler
                báo nhầm cả khối JSX là truy cập ref khi render. */}
            {/* eslint-disable-next-line react-hooks/refs */}
            {orderedElements.map((element, elementIndex) => {
              const isSelected = selectedIds.includes(element.id);
              const isPlayingThis =
                playingIds !== null &&
                playingIds.has(element.id) &&
                Boolean(element.animation);
              const fixedHeight =
                "hPct" in element && typeof element.hPct === "number";
              return (
                <div
                  key={element.id}
                  role="button"
                  tabIndex={0}
                  aria-label={element.type === "text" ? "Văn bản" : "Ảnh"}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    isInteractingRef.current = true;
                    const isMulti =
                      event.shiftKey || event.metaKey || event.ctrlKey;
                    if (isMulti) {
                      setSelectedIds((prev) =>
                        prev.includes(element.id)
                          ? prev.filter((id) => id !== element.id)
                          : [...prev, element.id],
                      );
                    } else {
                      if (!selectedIds.includes(element.id)) {
                        setSelectedIds([element.id]);
                      }
                    }
                    const rect = boardRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    dragRef.current = {
                      id: element.id,
                      startX: event.clientX,
                      startY: event.clientY,
                      xPct: element.xPct,
                      yPct: element.yPct,
                      width: rect.width,
                      height: rect.height,
                    };
                  }}
                  onPointerMove={(event) => {
                    const drag = dragRef.current;
                    if (!drag || drag.id !== element.id) return;
                    const dx = ((event.clientX - drag.startX) / drag.width) * 100;
                    const dy = ((event.clientY - drag.startY) / drag.height) * 100;
                    updateElement(element.id, {
                      xPct: Math.max(0, Math.min(100 - element.wPct, drag.xPct + dx)),
                      yPct: Math.max(0, Math.min(96, drag.yPct + dy)),
                    });
                  }}
                  onPointerUp={() => {
                    dragRef.current = null;
                    if (isInteractingRef.current) {
                      isInteractingRef.current = false;
                      setHistory((prev) =>
                        pushHistory(prev, { pages, cover, accentColor }),
                      );
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Delete" || event.key === "Backspace") {
                      event.preventDefault();
                      const toDelete = selectedIds.includes(element.id)
                        ? selectedIds
                        : [element.id];
                      setContent((previous) => ({
                        ...previous,
                        elements: previous.elements.filter(
                          (item) => !toDelete.includes(item.id),
                        ),
                      }));
                      setSelectedIds([]);
                    }
                  }}
                  className={cn(
                    "absolute cursor-move touch-none select-none",
                    isSelected && "outline outline-2 outline-accent",
                  )}
                  style={{
                    left: `${element.xPct}%`,
                    top: `${element.yPct}%`,
                    width: `${element.wPct}%`,
                    height:
                      "hPct" in element && typeof element.hPct === "number"
                        ? `${element.hPct}%`
                        : undefined,
                    overflow:
                      "hPct" in element && typeof element.hPct === "number" ? "hidden" : undefined,
                    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                  }}
                >
                  {(() => {
                    const innerContent =
                      element.type === "text" ? (
                        <span
                          style={{
                            display: "block",
                            fontFamily: element.fontFamily,
                            fontSize: `calc(${element.fontSize} * 100cqw / ${content.width})`,
                            color: element.color,
                            lineHeight: element.lineHeight ?? 1.25,
                            letterSpacing: `${element.letterSpacing ?? 0}em`,
                            fontWeight: element.fontWeight ?? 400,
                            fontStyle: element.fontStyle ?? "normal",
                            textTransform: element.textTransform ?? "none",
                            textAlign: element.align ?? "left",
                            ...getTextEffectStyles(element.textEffect),
                          }}
                        >
                          {element.placeholder
                            ? PLACEHOLDER_OPTIONS.find((option) => option.id === element.placeholder)?.sample ??
                              element.text
                            : element.text}
                        </span>
                      ) : element.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={element.url} alt="" className="block h-auto w-full" />
                      ) : element.type === "photo" ? (
                        <span
                          className="flex h-full w-full items-center justify-center overflow-hidden text-[10px] opacity-70"
                          style={{ borderRadius: element.radius, background: "rgba(0,0,0,0.06)" }}
                        >
                          {element.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={element.url}
                              alt=""
                              className="h-full w-full"
                              style={{ objectFit: element.fit }}
                            />
                          ) : (
                            `Ảnh: ${element.slot}`
                          )}
                        </span>
                      ) : element.type === "box" ? (
                        <span
                          className="block"
                          style={{
                            height: `${element.hPct}%`,
                            minHeight: 20,
                            background: element.fill,
                            border:
                              element.border === "none" ? undefined : `1px solid ${element.border}`,
                            borderRadius: element.radius,
                          }}
                        />
                      ) : element.type === "icon" ? (
                        <span className="block" style={{ color: element.color }}>
                          <Flower2 className="h-10 w-10" aria-hidden="true" />
                        </span>
                      ) : element.type === "fallingEffect" ? (
                        <FallingEffectCanvas
                          effect={element}
                          mode={liveFallingPreview ? "live" : "static"}
                          forceBox
                        />
                      ) : element.type === "button" ? (
                        <span
                          className="flex h-10 items-center justify-center rounded-full px-3 text-xs font-semibold"
                          style={{ background: element.fill, color: element.textColor }}
                        >
                          {element.label}
                        </span>
                      ) : (
                        <span
                          className="flex h-16 items-center justify-center rounded-lg border border-dashed text-[10px]"
                          style={{ borderColor: element.color, color: element.color }}
                        >
                          {element.block}
                        </span>
                      );

                    if (isPlayingThis) {
                      return (
                        <ElementAnimator
                          key={`${element.id}-${playingAnimKey}`}
                          animation={element.animation}
                          order={elementIndex}
                          autoPlay={true}
                          fill={fixedHeight}
                          className={fixedHeight ? "h-full w-full" : "w-full"}
                          shimmerMaskUrl={
                            element.type === "image" || element.type === "photo"
                              ? element.url
                              : undefined
                          }
                          text={element.type === "text" ? element.text : undefined}
                        >
                          {innerContent}
                        </ElementAnimator>
                      );
                    }
                    return innerContent;
                  })()}
                  {(element.animation?.in ||
                    element.animation?.loop ||
                    element.animation?.out ||
                    element.animation?.parallax) && (
                    <span
                      className={cn(
                        "pointer-events-none absolute -top-2 left-0 z-10 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold shadow-xs",
                        isSelected
                          ? "bg-accent text-accent-fg"
                          : "border border-accent/40 bg-surface/90 text-accent-text",
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                      {isSelected ? "Hiệu ứng" : "Anim"}
                    </span>
                  )}
                  {isSelected && (
                    <span
                      role="button"
                      aria-label="Xoay phần tử"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        isInteractingRef.current = true;
                        const wrapper = event.currentTarget.parentElement;
                        if (!wrapper) return;
                        const rect = wrapper.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        rotateRef.current = {
                          id: element.id,
                          centerX,
                          centerY,
                          startAngle:
                            (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
                            Math.PI,
                          startRotation: element.rotation ?? 0,
                        };
                      }}
                      onPointerMove={(event) => {
                        const rotate = rotateRef.current;
                        if (!rotate || rotate.id !== element.id) return;
                        const angle =
                          (Math.atan2(event.clientY - rotate.centerY, event.clientX - rotate.centerX) *
                            180) /
                          Math.PI;
                        let next = rotate.startRotation + (angle - rotate.startAngle);
                        next = (((next + 180) % 360) + 360) % 360 - 180;
                        updateElement(element.id, { rotation: Math.round(next) });
                      }}
                      onPointerUp={() => {
                        rotateRef.current = null;
                        if (isInteractingRef.current) {
                          isInteractingRef.current = false;
                          setHistory((prev) =>
                            pushHistory(prev, { pages, cover, accentColor }),
                          );
                        }
                      }}
                      className="absolute -top-7 left-1/2 z-30 flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-accent bg-surface text-accent-text shadow"
                    >
                      <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  )}
                  {isSelected &&
                    (["nw", "ne", "sw", "se"] as const).map((corner) => (
                      <span
                        key={corner}
                        role="button"
                        aria-label={`Kéo để đổi kích thước (${corner})`}
                        onPointerDown={(event) => startResize(event, element, corner)}
                        onPointerMove={(event) => moveResize(event, element)}
                        onPointerUp={() => {
                          resizeRef.current = null;
                          if (isInteractingRef.current) {
                            isInteractingRef.current = false;
                            setHistory((prev) =>
                              pushHistory(prev, { pages, cover, accentColor }),
                            );
                          }
                        }}
                        className={cn(
                          "absolute z-30 h-2.5 w-2.5 rounded-sm border border-accent bg-surface shadow",
                          corner === "nw" && "-top-1 -left-1 cursor-nwse-resize",
                          corner === "ne" && "-top-1 -right-1 cursor-nesw-resize",
                          corner === "sw" && "-bottom-1 -left-1 cursor-nesw-resize",
                          corner === "se" && "-right-1 -bottom-1 cursor-nwse-resize",
                        )}
                      />
                    ))}
                </div>
              );
            })}
        </div>
      </div>

      <aside className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <div role="tablist" aria-label="Bảng điều khiển thiết kế" className="flex gap-1 rounded-lg bg-surface">
          {(["element", "layer", "cover"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                activeTab === tab
                  ? "bg-accent text-accent-fg"
                  : "border border-border bg-bg text-text hover:bg-surface-alt",
              )}
            >
              {tab === "element" ? "Element" : tab === "layer" ? "Layer" : "Bìa"}
            </button>
          ))}
        </div>

        <div className={cn("space-y-3", activeTab !== "element" && "hidden")}>
        <h2 className="text-sm font-semibold text-text">Thuộc tính</h2>

        {selectedIds.length > 1 ? (
          <div className="space-y-3 rounded-xl border border-accent/40 bg-accent-soft/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-accent-text">
                Đã chọn {selectedIds.length} phần tử
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-text-muted underline hover:text-text"
              >
                Bỏ chọn
              </button>
            </div>
            <button
              type="button"
              onClick={deleteBatchSelected}
              className="w-full rounded-lg border border-danger-border bg-danger-bg/20 py-1.5 text-xs font-semibold text-danger-fg hover:bg-danger-bg/40"
            >
              Xoá {selectedIds.length} phần tử đã chọn
            </button>
          </div>
        ) : !selected ? (
          <div className="space-y-2 text-xs text-text-muted">
            <p>
              Chọn một phần tử trên canvas để sửa. Chéo để di chuyển; nhấn Delete để xoá.
            </p>
            {content.backgroundUrl && (
              <button
                type="button"
                onClick={() => setContent((previous) => ({ ...previous, backgroundUrl: undefined }))}
                className="inline-flex h-8 w-full items-center justify-center rounded-full border border-border text-[11px] text-text"
              >
                Bỏ ảnh nền (để tự dựng lại bằng element)
              </button>
            )}
          </div>
        ) : selected.type === "text" ? (
              <div className="space-y-3">
                <label className="block text-xs text-text">
                  Nội dung
                  <textarea
                    value={selected.text}
                    onChange={(event) => updateElement(selected.id, { text: event.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-xs"
                  />
                </label>
                <label className="block text-xs text-text">
                  Placeholder
                  <select
                    value={selected.placeholder ?? ""}
                    onChange={(event) => updateElement(selected.id, { placeholder: event.target.value || null })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  >
                    <option value="">Văn bản cố định</option>
                    {PLACEHOLDER_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-start gap-2 rounded-lg border border-border bg-bg p-2 text-xs text-text">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.guestField)}
                    onChange={(event) =>
                      updateElement(selected.id, {
                        guestField: event.target.checked
                          ? { label: "Nội dung tùy chỉnh", kind: "text" }
                          : undefined,
                      })
                    }
                    className="mt-0.5"
                  />
                  <span>
                    Khách điền chữ
                    <span className="mt-0.5 block text-[10px] text-text-muted">
                      Hiện ô nhập trong dashboard của cô dâu/chú rể.
                    </span>
                  </span>
                </label>
                {selected.guestField && (
                  <div className="space-y-2 rounded-lg border border-border/80 bg-surface-alt/40 p-2.5">
                    <label className="block text-xs text-text">
                      Nhãn ô nhập
                      <input
                        value={selected.guestField.label}
                        onChange={(event) =>
                          updateElement(selected.id, {
                            guestField: {
                              ...selected.guestField,
                              label: event.target.value,
                            },
                          })
                        }
                        className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block text-xs text-text">
                        Kiểu ô
                        <select
                          value={selected.guestField.kind ?? "text"}
                          onChange={(event) =>
                            updateElement(selected.id, {
                              guestField: {
                                ...selected.guestField,
                                label:
                                  selected.guestField?.label ||
                                  "Nội dung tùy chỉnh",
                                kind: event.target.value as "text" | "textarea",
                              },
                            })
                          }
                          className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                        >
                          <option value="text">Một dòng</option>
                          <option value="textarea">Nhiều dòng</option>
                        </select>
                      </label>
                      <label className="block text-xs text-text">
                        Tối đa ký tự
                        <input
                          type="number"
                          min={10}
                          max={1000}
                          step={10}
                          value={selected.guestField.maxLength ?? ""}
                          onChange={(event) => {
                            const value = event.target.value
                              ? Number(event.target.value)
                              : undefined;
                            updateElement(selected.id, {
                              guestField: {
                                ...selected.guestField,
                                label:
                                  selected.guestField?.label ||
                                  "Nội dung tùy chỉnh",
                                maxLength: value && value > 0 ? value : undefined,
                              },
                            });
                          }}
                          placeholder="Không giới hạn"
                          className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                        />
                      </label>
                    </div>
                  </div>
                )}
                <label className="block text-xs text-text">
                  Font
                  <select
                    value={selected.fontFamily}
                    onChange={(event) =>
                      updateElement(selected.id, {
                        fontFamily: event.target.value,
                      })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  >
                    {DESIGNER_FONT_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.fonts.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <p
                  className="rounded-lg border border-border bg-surface-alt px-2 py-1.5 text-[11px] leading-relaxed text-text"
                  style={{ fontFamily: selected.fontFamily }}
                >
                  Nguyễn Thị Ánh Tuyết · Ấ Ầ Ẩ Ẫ Ậ Ế Ề Ể Ễ Ệ Ố Ồ Ổ Ỗ Ộ Ớ Ờ Ở Ỡ Ợ Ứ Ừ Ử Ữ Ự Ỳ Ỷ Ỹ Ỵ Đ đ
                </p>

                <div>
                  <p className="text-xs text-text">Kiểu chữ có sẵn</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {DESIGNER_TEXT_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() =>
                          updateElement(
                            selected.id,
                            style.apply as Partial<DesignerElement>,
                          )
                        }
                        className="rounded-full border border-border bg-bg px-2 py-1 text-[10px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent-text"
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-text">Căn chữ</p>
                  <div className="mt-1 grid grid-cols-3 gap-1">
                    {DESIGNER_TEXT_ALIGNS.map((align) => {
                      const active = (selected.align ?? "left") === align;
                      return (
                        <button
                          key={align}
                          type="button"
                          onClick={() => updateElement(selected.id, { align })}
                          aria-pressed={active}
                          className={cn(
                            "h-8 rounded-lg border text-[11px] font-medium transition-colors",
                            active
                              ? "border-accent bg-accent-soft text-accent-text"
                              : "border-border bg-bg text-text-muted hover:bg-surface-alt",
                          )}
                        >
                          {align === "left" ? "Trái" : align === "center" ? "Giữa" : "Phải"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block text-xs text-text">
                  Hiệu ứng chữ
                  <select
                    value={selected.textEffect ?? "none"}
                    onChange={(event) =>
                      updateElement(selected.id, {
                        textEffect: (event.target.value || "none") as DesignerTextEffect,
                      })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  >
                    {DESIGNER_TEXT_EFFECT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-text">
                    Giãn dòng
                    <input
                      type="number"
                      min={0.8}
                      max={2.5}
                      step={0.05}
                      value={selected.lineHeight ?? 1.25}
                      onChange={(event) =>
                        updateElement(selected.id, {
                          lineHeight: Number(event.target.value) || 1.25,
                        })
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    />
                  </label>
                  <label className="block text-xs text-text">
                    Khoảng chữ (em)
                    <input
                      type="number"
                      min={-0.05}
                      max={0.5}
                      step={0.01}
                      value={selected.letterSpacing ?? 0}
                      onChange={(event) =>
                        updateElement(selected.id, {
                          letterSpacing: Number(event.target.value) || 0,
                        })
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-text">
                    Cỡ chữ
                    <input
                      type="number"
                      min={8}
                      max={96}
                      value={selected.fontSize}
                      onChange={(event) => updateElement(selected.id, { fontSize: Number(event.target.value) || 12 })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    />
                  </label>
                  <label className="block text-xs text-text">
                    Màu
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(event) => updateElement(selected.id, { color: event.target.value })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setContent((previous) => ({
                      ...previous,
                      elements: previous.elements.filter((item) => item.id !== selected.id),
                    }));
                    setSelectedId(null);
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
                >
                  Xoá phần tử
                </button>
              </div>
            ) : selected.type === "image" ? (
              <div className="space-y-3">
                <label className="flex items-start gap-2 rounded-lg border border-border bg-bg p-2 text-xs text-text">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.guestField)}
                    onChange={(event) =>
                      updateElement(selected.id, {
                        guestField: event.target.checked
                          ? { label: "Ảnh của bạn", kind: "image" }
                          : undefined,
                      })
                    }
                    className="mt-0.5"
                  />
                  <span>
                    Khách thay ảnh
                    <span className="mt-0.5 block text-[10px] text-text-muted">
                      Hiện ô upload trong tab Ảnh cưới của dashboard.
                    </span>
                  </span>
                </label>
                {selected.guestField && (
                  <label className="block text-xs text-text">
                    Nhãn ô ảnh
                    <input
                      value={selected.guestField.label}
                      onChange={(event) =>
                        updateElement(selected.id, {
                          guestField: {
                            ...selected.guestField,
                            label: event.target.value,
                          },
                        })
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    />
                  </label>
                )}
                <label className="block text-xs text-text">
                  Xoay (độ)
                  <input
                    type="number"
                    min={-180}
                    max={180}
                    value={selected.rotation ?? 0}
                    onChange={(event) =>
                      updateElement(selected.id, {
                        rotation: Number(event.target.value) || 0,
                      })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setContent((previous) => ({
                      ...previous,
                      elements: previous.elements.filter(
                        (item) => item.id !== selected.id,
                      ),
                    }));
                    setSelectedId(null);
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
                >
                  Xoá ảnh
                </button>
              </div>
            ) : selected.type === "photo" ? (
              <div className="space-y-3">
                <label className="block text-xs text-text">
                  Ảnh cưới (slot)
                  <select
                    value={selected.slot}
                    onChange={(event) => updateElement(selected.id, { slot: event.target.value as (typeof PHOTO_SLOTS)[number] })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  >
                    {PHOTO_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-text">
                    Bo góc
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={selected.radius}
                      onChange={(event) => updateElement(selected.id, { radius: Number(event.target.value) || 0 })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    />
                  </label>
                  <label className="block text-xs text-text">
                    Fit
                    <select
                      value={selected.fit}
                      onChange={(event) => updateElement(selected.id, { fit: event.target.value as "cover" | "contain" })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    >
                      <option value="cover">cover</option>
                      <option value="contain">contain</option>
                    </select>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={loadAssets}
                  disabled={loadingAssets}
                  className="inline-flex h-9 w-full items-center justify-center rounded-full border border-border text-xs font-medium text-text disabled:opacity-60"
                >
                  {loadingAssets ? "Đang tải…" : "Chọn ảnh từ thư viện"}
                </button>

                {assets && assets.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {assets.slice(0, 12).map((asset) => (
                      <button
                        key={asset.key}
                        type="button"
                        onClick={() => updateElement(selected.id, { url: asset.url })}
                        className="overflow-hidden rounded-md border border-border focus-visible:ring-2 focus-visible:ring-focus-ring"
                        aria-label="Dùng ảnh này"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset.url} alt="" className="aspect-square h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setContent((previous) => ({
                      ...previous,
                      elements: previous.elements.filter((item) => item.id !== selected.id),
                    }));
                    setSelectedId(null);
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
                >
                  Xoá khung ảnh
                </button>
              </div>
            ) : selected.type === "box" ? (
              <div className="space-y-3">
                <label className="block text-xs text-text">
                  Màu nền
                  <input
                    type="color"
                    value={selected.fill}
                    onChange={(event) => updateElement(selected.id, { fill: event.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                  />
                </label>
                <label className="block text-xs text-text">
                  Màu viền
                  <input
                    type="color"
                    value={selected.border === "none" ? "#E6E0D6" : selected.border}
                    onChange={(event) => updateElement(selected.id, { border: event.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-text">
                    Bo góc
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={selected.radius}
                      onChange={(event) => updateElement(selected.id, { radius: Number(event.target.value) || 0 })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    />
                  </label>
                  <label className="block text-xs text-text">
                    Cao (%)
                    <input
                      type="number"
                      min={4}
                      max={100}
                      value={selected.hPct}
                      onChange={(event) => updateElement(selected.id, { hPct: Number(event.target.value) || 10 })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setContent((previous) => ({
                      ...previous,
                      elements: previous.elements.filter((item) => item.id !== selected.id),
                    }));
                    setSelectedId(null);
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
                >
                  Xoá khung
                </button>
              </div>
            ) : selected.type === "icon" ? (
              <div className="space-y-3">
                <label className="block text-xs text-text">
                  Icon
                  <select
                    value={selected.icon}
                    onChange={(event) => updateElement(selected.id, { icon: event.target.value as (typeof DESIGNER_ICONS)[number] })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  >
                    {DESIGNER_ICONS.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-text">
                    Màu
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(event) => updateElement(selected.id, { color: event.target.value })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                    />
                  </label>
                  <label className="block text-xs text-text">
                    Rộng (%)
                    <input
                      type="number"
                      min={4}
                      max={100}
                      value={selected.wPct}
                      onChange={(event) => updateElement(selected.id, { wPct: Number(event.target.value) || 10 })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setContent((previous) => ({
                      ...previous,
                      elements: previous.elements.filter((item) => item.id !== selected.id),
                    }));
                    setSelectedId(null);
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
                >
                  Xoá icon
                </button>
              </div>
            ) : selected.type === "button" ? (
              <div className="space-y-3">
                <label className="block text-xs text-text">
                  Nhãn nút
                  <input
                    value={selected.label}
                    onChange={(event) => updateElement(selected.id, { label: event.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                <label className="block text-xs text-text">
                  Hành động
                  <select
                    value={selected.action}
                    onChange={(event) => updateElement(selected.id, { action: event.target.value as (typeof DESIGNER_ACTIONS)[number] })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  >
                    {DESIGNER_ACTIONS.map((action) => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-text">
                    Nền
                    <input
                      type="color"
                      value={selected.fill}
                      onChange={(event) => updateElement(selected.id, { fill: event.target.value })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                    />
                  </label>
                  <label className="block text-xs text-text">
                    Chữ
                    <input
                      type="color"
                      value={selected.textColor}
                      onChange={(event) => updateElement(selected.id, { textColor: event.target.value })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setContent((previous) => ({
                      ...previous,
                      elements: previous.elements.filter((item) => item.id !== selected.id),
                    }));
                    setSelectedId(null);
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
                >
                  Xoá nút
                </button>
              </div>
            ) : selected.type === "block" ? (
              <div className="space-y-3">
                <label className="block text-xs text-text">
                  Loại khối
                  <select
                    value={selected.block}
                    onChange={(event) => updateElement(selected.id, { block: event.target.value as (typeof DESIGNER_BLOCKS)[number] })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  >
                    {DESIGNER_BLOCKS.map((block) => (
                      <option key={block} value={block}>{block}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-text">
                    Màu chữ / viền
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(event) => updateElement(selected.id, { color: event.target.value })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                    />
                  </label>
                  <label className="block text-xs text-text">
                    Màu nền khối
                    <input
                      type="color"
                      value={selected.fill ?? "#ffffff"}
                      onChange={(event) => updateElement(selected.id, { fill: event.target.value })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-text">
                    Màu nút
                    <input
                      type="color"
                      value={selected.buttonColor ?? accentColor}
                      onChange={(event) => updateElement(selected.id, { buttonColor: event.target.value })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                    />
                  </label>
                  <label className="block text-xs text-text">
                    Cao (%)
                    <input
                      type="number"
                      min={6}
                      max={60}
                      value={selected.hPct}
                      onChange={(event) => updateElement(selected.id, { hPct: Number(event.target.value) || 18 })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setContent((previous) => ({
                      ...previous,
                      elements: previous.elements.filter((item) => item.id !== selected.id),
                    }));
                    setSelectedId(null);
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
                >
                  Xoá khối
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-text-muted">
                <p>Ảnh đã tải lên R2. Kéo trên canvas để đặt vị trí.</p>
                <button
                  type="button"
                  onClick={() => {
                    setContent((previous) => ({
                      ...previous,
                      elements: previous.elements.filter((item) => item.id !== selected.id),
                    }));
                    setSelectedId(null);
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
                >
                  Xoá ảnh
                </button>
              </div>
            )}

          {selected?.type === "fallingEffect" && (
          <DesignerFallingPanel
            element={selected}
            onChange={(patch) => updateElement(selected.id, patch)}
            livePreview={liveFallingPreview}
            onLivePreviewChange={setLiveFallingPreview}
          />
        )}

        {selected && selected.type !== "fallingEffect" && (
          <DesignerAnimationPanel
            element={selected}
            onChange={(animation) =>
              updateElement(selected.id, { animation })
            }
            onPreview={() => handlePlayElement(selected.id)}
          />
        )}

        {selected && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-text">Vị trí &amp; kích thước</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-text">
                X (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(selected.xPct)}
                  onChange={(event) => updateElement(selected.id, { xPct: Number(event.target.value) || 0 })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                />
              </label>
              <label className="block text-xs text-text">
                Y (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(selected.yPct)}
                  onChange={(event) => updateElement(selected.id, { yPct: Number(event.target.value) || 0 })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                />
              </label>
              <label className="block text-xs text-text">
                Rộng (%)
                <input
                  type="number"
                  min={4}
                  max={100}
                  value={Math.round(selected.wPct)}
                  onChange={(event) => updateElement(selected.id, { wPct: Number(event.target.value) || 10 })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                />
              </label>
              <label className="block text-xs text-text">
                Xoay (độ)
                <input
                  type="number"
                  min={-180}
                  max={180}
                  value={selected.rotation ?? 0}
                  onChange={(event) => updateElement(selected.id, { rotation: Number(event.target.value) || 0 })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                />
              </label>
              {"hPct" in selected && typeof selected.hPct === "number" && (
                <label className="block text-xs text-text">
                  Cao (%)
                  <input
                    type="number"
                    min={4}
                    max={100}
                    value={Math.round(selected.hPct)}
                    onChange={(event) => updateElement(selected.id, { hPct: Number(event.target.value) || 10 })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        </div>

        <div className={cn("space-y-3", activeTab !== "cover" && "hidden")}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Bìa thiệp</h2>
            {cover && (
              <button
                type="button"
                onClick={() => setCover(undefined)}
                className="text-[10px] text-text-muted underline hover:text-danger-fg"
              >
                Bỏ bìa
              </button>
            )}
          </div>
          <p className="text-[10px] text-text-muted">
            Bìa chỉ hiện ở thiệp khách; preview catalog ẩn bìa.
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {DESIGNER_COVER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => updateCover({ template: option.id })}
                className={cn(
                  "rounded-lg border p-2 text-left text-[10px] font-semibold",
                  cover?.template === option.id
                    ? "border-accent bg-accent-soft/60"
                    : "border-border bg-bg",
                )}
              >
                {option.name}
              </button>
            ))}
          </div>
          <label className="block text-xs font-medium text-text">
            Ảnh bìa
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={coverUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadCover(file);
                event.target.value = "";
              }}
              className="mt-1 block w-full text-xs text-text-muted file:mr-2 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-accent-fg"
            />
          </label>
          {cover?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.imageUrl}
              alt="Ảnh bìa"
              className="h-20 w-full rounded-lg border border-border object-cover"
            />
          )}
          <label className="block text-xs text-text">
            Icon bìa
            <select
              value={cover?.icon ?? "Heart"}
              onChange={(event) =>
                updateCover({
                  icon: event.target.value as (typeof DESIGNER_ICONS)[number],
                })
              }
              className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
            >
              {DESIGNER_ICONS.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-text">
            Màu nhấn nút / RSVP
            <input
              type="color"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
            />
          </label>
          {(["title", "subtitle", "buttonLabel"] as const).map((key) => (
            <label key={key} className="block text-xs text-text">
              {key === "title" ? "Tiêu đề" : key === "subtitle" ? "Dòng phụ" : "Nút mở thiệp"}
              <input
                value={cover?.[key] ?? ""}
                onChange={(event) => updateCover({ [key]: event.target.value })}
                placeholder={DEFAULT_DESIGNER_COVER[key]}
                className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
              />
            </label>
          ))}
        </div>

        {/* Layer/order panel */}
        <div className={cn("space-y-3 border-t border-border pt-3", activeTab !== "layer" && "hidden")}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-text">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                Thứ tự element ({content.elements.length})
              </span>
              <span className="text-[10px] text-text-muted">Dưới → trên</span>
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
              {orderedElements.map((element, index) => {
                const isElSelected = selectedIds.includes(element.id);
                return (
                  <div
                    key={element.id}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      if (event.shiftKey || event.metaKey || event.ctrlKey) {
                        setSelectedIds((prev) =>
                          prev.includes(element.id)
                            ? prev.filter((id) => id !== element.id)
                            : [...prev, element.id],
                        );
                      } else {
                        setSelectedIds([element.id]);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between gap-1 rounded-lg border px-2 py-1.5 text-xs",
                      isElSelected
                        ? "border-accent bg-accent-soft font-semibold text-accent-text"
                        : "border-border bg-bg text-text",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="w-5 text-center text-[10px] text-text-muted">{index + 1}</span>
                      <span className="truncate">{elementLabel(element)}</span>
                      <span className="shrink-0 rounded-full bg-surface-alt px-1.5 py-0.5 text-[9px] text-text-muted">
                        L{elementLayer(element)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center">
                      {(["down", "up", "back", "front"] as const).map((direction) => (
                        <button
                          key={direction}
                          type="button"
                          aria-label={`Di chuyển ${direction}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            moveLayer(element.id, direction);
                          }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-text-muted hover:bg-surface hover:text-text"
                        >
                          {direction === "down" ? "↓" : direction === "up" ? "↑" : direction === "back" ? "⇊" : "⇈"}
                        </button>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-surface-alt/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text">Layer ({layerCount})</span>
              <button
                type="button"
                onClick={() => {
                  const nextLayer = layerCount + 1;
                  if (selectedId) updateElement(selectedId, { layer: nextLayer });
                }}
                className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-text hover:border-accent"
              >
                + Thêm layer
              </button>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {Array.from({ length: layerCount }, (_, index) => index + 1).map((layer) => {
                const items = orderedElements.filter(
                  (element) => elementLayer(element) === layer,
                );
                return (
                  <div key={layer} className="rounded-lg border border-border bg-bg">
                    <div className="flex items-center justify-between border-b border-border px-2 py-1">
                      <span className="text-[11px] font-semibold text-text">
                        Layer {layer}{layer === 1 ? " · dưới" : ""}
                      </span>
                      <span className="text-[10px] text-text-muted">{items.length} element</span>
                    </div>
                    {items.length === 0 ? (
                      <p className="px-2 py-1.5 text-[10px] text-text-muted">Chưa có element</p>
                    ) : (
                      items.map((element) => (
                        <div
                          key={element.id}
                          className={cn(
                            "flex items-center justify-between gap-2 px-2 py-1.5 text-xs",
                            selectedIds.includes(element.id) ? "bg-accent-soft text-accent-text" : "text-text",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedIds([element.id])}
                            className="min-w-0 flex-1 truncate text-left hover:underline"
                          >
                            {elementLabel(element)}
                          </button>
                          <select
                            aria-label={`Layer cho ${elementLabel(element)}`}
                            value={elementLayer(element)}
                            onChange={(event) =>
                              updateElement(element.id, {
                                layer: Number(event.target.value),
                              })
                            }
                            className="h-6 rounded border border-border bg-surface px-1 text-[10px]"
                          >
                            {Array.from({ length: layerCount }, (_, i) => i + 1).map((option) => (
                              <option key={option} value={option}>L{option}</option>
                            ))}
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <button
            type="button"
            onClick={() => addText(PLACEHOLDER_OPTIONS[0].id)}
            className="inline-flex h-8 w-full items-center justify-center rounded-full border border-border text-[11px] text-text"
          >
            + Text box placeholder
          </button>
        </div>
      </aside>
    </div>
    </div >
  );
}
