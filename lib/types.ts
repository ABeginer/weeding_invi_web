export type GuestStatus = "pending" | "accepted" | "declined";

export type WeddingPlan = "free" | "pro" | "vip";

export interface WeddingPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface WeddingEvent {
  title: string;
  time: string;
  date: string;
  lunarDate: string;
  venue: string;
  address: string;
  mapEmbedUrl?: string;
  mapDirectionsUrl?: string;
}

export interface GiftItem {
  label: string;
  qrImage: string;
  qrAlt?: string;
  note?: string;
  downloadFileName?: string;
}

export interface WeddingContent {
  groom: {
    name: string;
    label: string;
    shortName: string;
    fullName: string;
    parents: string;
    photo: string;
  };
  bride: {
    name: string;
    label: string;
    shortName: string;
    fullName: string;
    parents: string;
    photo: string;
  };
  families: {
    groom: {
      label: string;
      parents: string;
      address: string;
    };
    bride: {
      label: string;
      parents: string;
      address: string;
    };
  };
  date: string;
  quote: string;
  invitationNote: string;
  hero: {
    eyebrow: string;
    subtitle: string;
    coverImage: string;
    coverAlt: string;
  };
  envelope: {
    sealLabel: string;
    invitePrefix: string;
    defaultGuestName: string;
    tapHint: string;
    subtitle: string;
  };
  events: WeddingEvent[];
  photos: WeddingPhoto[];
  music: {
    src: string;
    title: string;
  };
  autoScroll: {
    enabled: boolean;
    speedPxPerSec: number;
    startDelayMs: number;
  };
  gift: {
    eyebrow: string;
    title: string;
    subtitle: string;
    openButtonLabel: string;
    downloadLabel: string;
    items: GiftItem[];
  };
  sections: {
    familiesEyebrow: string;
    coupleEyebrow: string;
    invitationPrefix: string;
    defaultGuestName: string;
    eventsEyebrow: string;
    eventsTitle: string;
    directionsButtonLabel: string;
    gallery: {
      eyebrow: string;
      headingPrefix: string;
      headingItalic: string;
      headingSuffix: string;
      subtitle: string;
    };
    rsvpWish: {
      eyebrow: string;
      titlePersonal: string;
      subtitlePersonal: string;
      titlePublic: string;
      subtitlePublic: string;
      nameLabel: string;
      namePlaceholder: string;
      lockedNameHint: string;
      messageLabel: string;
      messageLabelPublic: string;
      messagePlaceholder: string;
      acceptLabel: string;
      declineLabel: string;
      submitWishLabel: string;
      retryWishLabel: string;
      acceptedMessage: string;
      declinedMessage: string;
      wishAlsoSavedNote: string;
      wishOnlySuccessMessage: string;
      changeMindLabel: string;
      sendAnotherWishLabel: string;
      keepPreviousLabel: string;
      currentAcceptedBadge: string;
      currentDeclinedBadge: string;
    };
    countdownEyebrow: string;
    countdownTitle: string;
    countdownFinished: string;
    footer: {
      bannerImage: string;
      bannerAlt: string;
      showBannerNames: boolean;
      heading: string;
      thankYouTitle: string;
      thankYouBody: string;
      signature: string;
    };
    invalidInvite: {
      title: string;
      description: string;
      backHomeLabel: string;
    };
  };
  seo: {
    title: string;
    description: string;
    ogImage: string;
  };
}

export interface UserProfile {
  id: string;
  email: string | null;
  createdAt?: string;
}

export interface Wedding {
  id: string;
  ownerId: string;
  slug: string;
  templateId: string;
  plan: WeddingPlan;
  content: WeddingContent;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  weddingId?: string;
  name: string;
  slug: string; // chuỗi ngẫu nhiên, dùng trong link /m/[slug]
  status: GuestStatus;
  respondedAt: string | null; // ISO
  createdAt: string; // ISO
}

export interface Wish {
  id: string;
  weddingId?: string;
  guestId: string | null; // null nếu gửi từ trang chung
  name: string;
  message: string;
  createdAt: string;
}

export interface Stats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  wishes: number;
}
