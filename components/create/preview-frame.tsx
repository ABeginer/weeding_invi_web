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
  guestName?: string;
  audioMuted?: boolean;
  groomParents?: string;
  brideParents?: string;
  eventLocation?: string;
  eventAddress?: string;
  mapUrl?: string;
  bank?: string;
  accountNumber?: string;
  accountName?: string;
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
    guestName: "",
    audioMuted: false,
    groomParents: "",
    brideParents: "",
    eventLocation: "",
    eventAddress: "",
    mapUrl: "",
    bank: "",
    accountNumber: "",
    accountName: "",
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
        guestName:
          typeof payload.guestName === "string" ? payload.guestName : previous.guestName,
        audioMuted:
          typeof payload.audioMuted === "boolean" ? payload.audioMuted : previous.audioMuted,
        groomParents:
          typeof payload.groomParents === "string" ? payload.groomParents : previous.groomParents,
        brideParents:
          typeof payload.brideParents === "string" ? payload.brideParents : previous.brideParents,
        eventLocation:
          typeof payload.eventLocation === "string" ? payload.eventLocation : previous.eventLocation,
        eventAddress:
          typeof payload.eventAddress === "string" ? payload.eventAddress : previous.eventAddress,
        mapUrl:
          typeof payload.mapUrl === "string" ? payload.mapUrl : previous.mapUrl,
        bank:
          typeof payload.bank === "string" ? payload.bank : previous.bank,
        accountNumber:
          typeof payload.accountNumber === "string" ? payload.accountNumber : previous.accountNumber,
        accountName:
          typeof payload.accountName === "string" ? payload.accountName : previous.accountName,
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
            groomParents: state.groomParents || "",
            brideParents: state.brideParents || "",
          },
          date: state.date,
          quote: state.quote,
          heroPhotoId: null,
          groomPhotoId: null,
          bridePhotoId: null,
          gift: {
            ...emptyGiftInfo(),
            groomBankName: state.bank || "",
            groomAccountNumber: state.accountNumber || "",
            groomAccountName: state.accountName || "",
          },
        },
        events: state.eventLocation
          ? [
              {
                id: "preview-event-1",
                title: "Lễ Thành Hôn & Tiệc Cưới",
                startsAt: state.date,
                lunarDate: "",
                venueName: state.eventLocation,
                venueAddress: state.eventAddress || "",
                mapEmbedUrl: null,
                mapDirectionsUrl: state.mapUrl || null,
                position: 0,
              },
            ]
          : [],
        photos: [],
      }),
    [
      state.accountName,
      state.accountNumber,
      state.bank,
      state.bride,
      state.brideParents,
      state.date,
      state.eventAddress,
      state.eventLocation,
      state.groom,
      state.groomParents,
      state.mapUrl,
      state.quote,
      state.templateId,
    ],
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
      guestName={state.guestName || null}
      invitationMode={state.guestName ? "personal" : "public"}
      isMusicPlaying={!state.audioMuted}
      externalMusicControl={true}
    />
  );
}
