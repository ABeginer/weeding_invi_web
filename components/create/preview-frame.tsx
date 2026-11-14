"use client";

import * as React from "react";
import { emptyGiftInfo } from "@/lib/types";
import { toTemplateData } from "@/lib/wedding-data";
import { TemplatePreviewRenderer } from "@/templates/TemplatePreviewRenderer";

interface PreviewState {
  templateId: string;
  groom: string;
  bride: string;
  date: string;
  quote: string;
  opened: boolean;
}

interface PreviewFrameProps extends Omit<PreviewState, "opened"> {
  initialOpened: boolean;
}

const MESSAGE_TYPE = "inviwedd:preview";
const READY_TYPE = "inviwedd:preview:ready";

function cleanString(value: unknown, max: number, fallback: string): string {
  return typeof value === "string" ? value.slice(0, max) : fallback;
}

/** Bọc renderer trong iframe; nội dung cập nhật qua postMessage, không reload. */
export function PreviewFrame({
  templateId,
  groom,
  bride,
  date,
  quote,
  initialOpened,
}: PreviewFrameProps) {
  const [state, setState] = React.useState<PreviewState>({
    templateId,
    groom,
    bride,
    date,
    quote,
    opened: initialOpened,
  });

  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent =
      "html,body{scrollbar-width:none;-ms-overflow-style:none}html::-webkit-scrollbar,body::-webkit-scrollbar{width:0;height:0;display:none}";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; payload?: Partial<PreviewState> } | null;
      if (!data || data.type !== MESSAGE_TYPE || !data.payload) return;

      const payload = data.payload;
      setState((previous) => ({
        templateId: cleanString(payload.templateId, 40, previous.templateId),
        groom: cleanString(payload.groom, 40, previous.groom),
        bride: cleanString(payload.bride, 40, previous.bride),
        date: cleanString(payload.date, 40, previous.date),
        quote: cleanString(payload.quote, 200, previous.quote),
        opened:
          typeof payload.opened === "boolean" ? payload.opened : previous.opened,
      }));
    };

    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: READY_TYPE }, window.location.origin);

    return () => window.removeEventListener("message", onMessage);
  }, []);

  const data = React.useMemo(
    () =>
      toTemplateData({
        templateId: state.templateId,
        plan: "free",
        weddingSlug: "xem-truoc",
        content: {
          couple: {
            groomName: state.groom || "Chú rể",
            brideName: state.bride || "Cô dâu",
            groomFullName: "",
            brideFullName: "",
            groomParents: "",
            brideParents: "",
          },
          date: state.date,
          quote: state.quote,
          heroPhotoId: null,
          groomPhotoId: null,
          bridePhotoId: null,
          gift: emptyGiftInfo(),
        },
        events: [],
        photos: [],
      }),
    [state.bride, state.date, state.groom, state.quote, state.templateId],
  );

  return (
    <TemplatePreviewRenderer
      key={state.templateId}
      templateId={state.templateId}
      data={data}
      mode="preview"
      contained
      viewport="phone"
      isOpened={state.opened}
      onOpenedChange={(opened) =>
        setState((previous) => ({ ...previous, opened }))
      }
      externalMusicControl={false}
    />
  );
}
