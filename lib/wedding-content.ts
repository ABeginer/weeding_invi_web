import { wedding as baseTemplate } from "@/content/wedding";
import type { WeddingContent } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function createDefaultWeddingContent(): WeddingContent {
  return {
    groom: {
      name: "Chú rể",
      label: "CHÚ RỂ",
      shortName: "Văn A",
      fullName: "Nguyễn Văn A",
      parents: "Ông Nguyễn Văn B & Bà Lê Thị C",
      photo: "/photos/portrait_cr.jpg",
    },
    bride: {
      name: "Cô dâu",
      label: "CÔ DÂU",
      shortName: "Thị B",
      fullName: "Trần Thị B",
      parents: "Ông Trần Văn D & Bà Phạm Thị E",
      photo: "/photos/portrait_cd.jpg",
    },
    families: {
      groom: {
        label: "NHÀ TRAI",
        parents: "Ông Nguyễn Văn B & Bà Lê Thị C",
        address: "123 Đường Nguyễn Văn Trỗi, Phú Nhuận, TP. Hồ Chí Minh",
      },
      bride: {
        label: "NHÀ GÁI",
        parents: "Ông Trần Văn D & Bà Phạm Thị E",
        address: "456 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh",
      },
    },
    date: "2027-01-01T10:00:00+07:00",
    quote: baseTemplate.quote,
    invitationNote: baseTemplate.invitationNote,
    hero: {
      eyebrow: "Wedding",
      subtitle: "Hân hạnh đón tiếp trong ngày chung đôi",
      coverImage: "/photos/hero2.jpg",
      coverAlt: "Ảnh cưới",
    },
    envelope: {
      ...baseTemplate.envelope,
      sealLabel: "A & B",
    },
    events: baseTemplate.events.map((event) => ({ ...event })),
    photos: baseTemplate.photos.map((photo) => ({ ...photo })),
    music: { ...baseTemplate.music },
    autoScroll: { ...baseTemplate.autoScroll },
    gift: {
      ...baseTemplate.gift,
      items: [
        {
          label: "Mừng cưới Chú rể",
          qrImage: "/images/gift-qr.png",
          qrAlt: "Mã QR mừng cưới Chú rể",
          note: "Ngân hàng · Số tài khoản · Chủ tài khoản",
          downloadFileName: "qr-mung-cuoi-chu-re.png",
        },
        {
          label: "Mừng cưới Cô dâu",
          qrImage: "/images/gift-qr.png",
          qrAlt: "Mã QR mừng cưới Cô dâu",
          note: "Ngân hàng · Số tài khoản · Chủ tài khoản",
          downloadFileName: "qr-mung-cuoi-co-dau.png",
        },
      ],
    },
    sections: {
      ...baseTemplate.sections,
      gallery: { ...baseTemplate.sections.gallery },
      rsvpWish: { ...baseTemplate.sections.rsvpWish },
      footer: {
        ...baseTemplate.sections.footer,
        thankYouBody:
          "Cảm ơn sự yêu thương, hiện diện và chúc phúc của bạn dành cho chúng mình.",
        signature: "Văn A ♥ Thị B · 01.01.2027",
      },
      invalidInvite: { ...baseTemplate.sections.invalidInvite },
    },
    seo: {
      title: "Thiệp Cưới Văn A & Thị B",
      description:
        "Trân trọng kính mời bạn đến chung vui trong ngày lễ thành hôn của chúng mình.",
      ogImage: "/images/og-cover.png",
    },
  };
}

export function mergeWeddingContent(raw: unknown): WeddingContent {
  const defaults = createDefaultWeddingContent();
  if (!isRecord(raw)) return defaults;

  const groom = isRecord(raw.groom) ? raw.groom : {};
  const bride = isRecord(raw.bride) ? raw.bride : {};
  const families = isRecord(raw.families) ? raw.families : {};
  const famGroom = isRecord(families.groom) ? families.groom : {};
  const famBride = isRecord(families.bride) ? families.bride : {};
  const hero = isRecord(raw.hero) ? raw.hero : {};
  const envelope = isRecord(raw.envelope) ? raw.envelope : {};
  const music = isRecord(raw.music) ? raw.music : {};
  const autoScroll = isRecord(raw.autoScroll) ? raw.autoScroll : {};
  const gift = isRecord(raw.gift) ? raw.gift : {};
  const sections = isRecord(raw.sections) ? raw.sections : {};
  const gallery = isRecord(sections.gallery) ? sections.gallery : {};
  const rsvpWish = isRecord(sections.rsvpWish) ? sections.rsvpWish : {};
  const footer = isRecord(sections.footer) ? sections.footer : {};
  const invalidInvite = isRecord(sections.invalidInvite) ? sections.invalidInvite : {};
  const seo = isRecord(raw.seo) ? raw.seo : {};

  const events = Array.isArray(raw.events)
    ? raw.events.filter(isRecord).map((e, i) => {
        const fallback = defaults.events[i] ?? defaults.events[0];
        return {
          title: str(e.title, fallback?.title ?? "Lễ Thành Hôn"),
          time: str(e.time, fallback?.time ?? "10:00"),
          date: str(e.date, fallback?.date ?? defaults.date),
          lunarDate: str(e.lunarDate, fallback?.lunarDate ?? ""),
          venue: str(e.venue, fallback?.venue ?? ""),
          address: str(e.address, fallback?.address ?? ""),
          mapEmbedUrl: typeof e.mapEmbedUrl === "string" ? e.mapEmbedUrl : fallback?.mapEmbedUrl,
          mapDirectionsUrl:
            typeof e.mapDirectionsUrl === "string"
              ? e.mapDirectionsUrl
              : fallback?.mapDirectionsUrl,
        };
      })
    : defaults.events;

  const photos = Array.isArray(raw.photos)
    ? raw.photos.filter(isRecord).map((p, i) => {
        const fallback = defaults.photos[i] ?? defaults.photos[0];
        return {
          src: str(p.src, fallback?.src ?? "/photos/1.jpg"),
          alt: str(p.alt, fallback?.alt ?? "Ảnh cưới"),
          width: num(p.width, fallback?.width ?? 600),
          height: num(p.height, fallback?.height ?? 900),
        };
      })
    : defaults.photos;

  const giftItems = Array.isArray(gift.items)
    ? gift.items.filter(isRecord).map((item, i) => {
        const fallback = defaults.gift.items[i] ?? defaults.gift.items[0];
        return {
          label: str(item.label, fallback?.label ?? "Mừng cưới"),
          qrImage: str(item.qrImage, fallback?.qrImage ?? "/images/gift-qr.png"),
          qrAlt: typeof item.qrAlt === "string" ? item.qrAlt : fallback?.qrAlt,
          note: typeof item.note === "string" ? item.note : fallback?.note,
          downloadFileName:
            typeof item.downloadFileName === "string"
              ? item.downloadFileName
              : fallback?.downloadFileName,
        };
      })
    : defaults.gift.items;

  return {
    groom: {
      name: str(groom.name, defaults.groom.name),
      label: str(groom.label, defaults.groom.label),
      shortName: str(groom.shortName, defaults.groom.shortName),
      fullName: str(groom.fullName, defaults.groom.fullName),
      parents: str(groom.parents, defaults.groom.parents),
      photo: str(groom.photo, defaults.groom.photo),
    },
    bride: {
      name: str(bride.name, defaults.bride.name),
      label: str(bride.label, defaults.bride.label),
      shortName: str(bride.shortName, defaults.bride.shortName),
      fullName: str(bride.fullName, defaults.bride.fullName),
      parents: str(bride.parents, defaults.bride.parents),
      photo: str(bride.photo, defaults.bride.photo),
    },
    families: {
      groom: {
        label: str(famGroom.label, defaults.families.groom.label),
        parents: str(famGroom.parents, defaults.families.groom.parents),
        address: str(famGroom.address, defaults.families.groom.address),
      },
      bride: {
        label: str(famBride.label, defaults.families.bride.label),
        parents: str(famBride.parents, defaults.families.bride.parents),
        address: str(famBride.address, defaults.families.bride.address),
      },
    },
    date: str(raw.date, defaults.date),
    quote: str(raw.quote, defaults.quote),
    invitationNote: str(raw.invitationNote, defaults.invitationNote),
    hero: {
      eyebrow: str(hero.eyebrow, defaults.hero.eyebrow),
      subtitle: str(hero.subtitle, defaults.hero.subtitle),
      coverImage: str(hero.coverImage, defaults.hero.coverImage),
      coverAlt: str(hero.coverAlt, defaults.hero.coverAlt),
    },
    envelope: {
      sealLabel: str(envelope.sealLabel, defaults.envelope.sealLabel),
      invitePrefix: str(envelope.invitePrefix, defaults.envelope.invitePrefix),
      defaultGuestName: str(envelope.defaultGuestName, defaults.envelope.defaultGuestName),
      tapHint: str(envelope.tapHint, defaults.envelope.tapHint),
      subtitle: str(envelope.subtitle, defaults.envelope.subtitle),
    },
    events,
    photos,
    music: {
      src: str(music.src, defaults.music.src),
      title: str(music.title, defaults.music.title),
    },
    autoScroll: {
      enabled: bool(autoScroll.enabled, defaults.autoScroll.enabled),
      speedPxPerSec: num(autoScroll.speedPxPerSec, defaults.autoScroll.speedPxPerSec),
      startDelayMs: num(autoScroll.startDelayMs, defaults.autoScroll.startDelayMs),
    },
    gift: {
      eyebrow: str(gift.eyebrow, defaults.gift.eyebrow),
      title: str(gift.title, defaults.gift.title),
      subtitle: str(gift.subtitle, defaults.gift.subtitle),
      openButtonLabel: str(gift.openButtonLabel, defaults.gift.openButtonLabel),
      downloadLabel: str(gift.downloadLabel, defaults.gift.downloadLabel),
      items: giftItems,
    },
    sections: {
      familiesEyebrow: str(sections.familiesEyebrow, defaults.sections.familiesEyebrow),
      coupleEyebrow: str(sections.coupleEyebrow, defaults.sections.coupleEyebrow),
      invitationPrefix: str(sections.invitationPrefix, defaults.sections.invitationPrefix),
      defaultGuestName: str(sections.defaultGuestName, defaults.sections.defaultGuestName),
      eventsEyebrow: str(sections.eventsEyebrow, defaults.sections.eventsEyebrow),
      eventsTitle: str(sections.eventsTitle, defaults.sections.eventsTitle),
      directionsButtonLabel: str(
        sections.directionsButtonLabel,
        defaults.sections.directionsButtonLabel,
      ),
      gallery: {
        eyebrow: str(gallery.eyebrow, defaults.sections.gallery.eyebrow),
        headingPrefix: str(gallery.headingPrefix, defaults.sections.gallery.headingPrefix),
        headingItalic: str(gallery.headingItalic, defaults.sections.gallery.headingItalic),
        headingSuffix: str(gallery.headingSuffix, defaults.sections.gallery.headingSuffix),
        subtitle: str(gallery.subtitle, defaults.sections.gallery.subtitle),
      },
      rsvpWish: {
        eyebrow: str(rsvpWish.eyebrow, defaults.sections.rsvpWish.eyebrow),
        titlePersonal: str(rsvpWish.titlePersonal, defaults.sections.rsvpWish.titlePersonal),
        subtitlePersonal: str(
          rsvpWish.subtitlePersonal,
          defaults.sections.rsvpWish.subtitlePersonal,
        ),
        titlePublic: str(rsvpWish.titlePublic, defaults.sections.rsvpWish.titlePublic),
        subtitlePublic: str(rsvpWish.subtitlePublic, defaults.sections.rsvpWish.subtitlePublic),
        nameLabel: str(rsvpWish.nameLabel, defaults.sections.rsvpWish.nameLabel),
        namePlaceholder: str(
          rsvpWish.namePlaceholder,
          defaults.sections.rsvpWish.namePlaceholder,
        ),
        lockedNameHint: str(rsvpWish.lockedNameHint, defaults.sections.rsvpWish.lockedNameHint),
        messageLabel: str(rsvpWish.messageLabel, defaults.sections.rsvpWish.messageLabel),
        messageLabelPublic: str(
          rsvpWish.messageLabelPublic,
          defaults.sections.rsvpWish.messageLabelPublic,
        ),
        messagePlaceholder: str(
          rsvpWish.messagePlaceholder,
          defaults.sections.rsvpWish.messagePlaceholder,
        ),
        acceptLabel: str(rsvpWish.acceptLabel, defaults.sections.rsvpWish.acceptLabel),
        declineLabel: str(rsvpWish.declineLabel, defaults.sections.rsvpWish.declineLabel),
        submitWishLabel: str(
          rsvpWish.submitWishLabel,
          defaults.sections.rsvpWish.submitWishLabel,
        ),
        retryWishLabel: str(rsvpWish.retryWishLabel, defaults.sections.rsvpWish.retryWishLabel),
        acceptedMessage: str(
          rsvpWish.acceptedMessage,
          defaults.sections.rsvpWish.acceptedMessage,
        ),
        declinedMessage: str(
          rsvpWish.declinedMessage,
          defaults.sections.rsvpWish.declinedMessage,
        ),
        wishAlsoSavedNote: str(
          rsvpWish.wishAlsoSavedNote,
          defaults.sections.rsvpWish.wishAlsoSavedNote,
        ),
        wishOnlySuccessMessage: str(
          rsvpWish.wishOnlySuccessMessage,
          defaults.sections.rsvpWish.wishOnlySuccessMessage,
        ),
        changeMindLabel: str(
          rsvpWish.changeMindLabel,
          defaults.sections.rsvpWish.changeMindLabel,
        ),
        sendAnotherWishLabel: str(
          rsvpWish.sendAnotherWishLabel,
          defaults.sections.rsvpWish.sendAnotherWishLabel,
        ),
        keepPreviousLabel: str(
          rsvpWish.keepPreviousLabel,
          defaults.sections.rsvpWish.keepPreviousLabel,
        ),
        currentAcceptedBadge: str(
          rsvpWish.currentAcceptedBadge,
          defaults.sections.rsvpWish.currentAcceptedBadge,
        ),
        currentDeclinedBadge: str(
          rsvpWish.currentDeclinedBadge,
          defaults.sections.rsvpWish.currentDeclinedBadge,
        ),
      },
      countdownEyebrow: str(sections.countdownEyebrow, defaults.sections.countdownEyebrow),
      countdownTitle: str(sections.countdownTitle, defaults.sections.countdownTitle),
      countdownFinished: str(sections.countdownFinished, defaults.sections.countdownFinished),
      footer: {
        bannerImage: str(footer.bannerImage, defaults.sections.footer.bannerImage),
        bannerAlt: str(footer.bannerAlt, defaults.sections.footer.bannerAlt),
        showBannerNames: bool(footer.showBannerNames, defaults.sections.footer.showBannerNames),
        heading: str(footer.heading, defaults.sections.footer.heading),
        thankYouTitle: str(footer.thankYouTitle, defaults.sections.footer.thankYouTitle),
        thankYouBody: str(footer.thankYouBody, defaults.sections.footer.thankYouBody),
        signature: str(footer.signature, defaults.sections.footer.signature),
      },
      invalidInvite: {
        title: str(invalidInvite.title, defaults.sections.invalidInvite.title),
        description: str(invalidInvite.description, defaults.sections.invalidInvite.description),
        backHomeLabel: str(
          invalidInvite.backHomeLabel,
          defaults.sections.invalidInvite.backHomeLabel,
        ),
      },
    },
    seo: {
      title: str(seo.title, defaults.seo.title),
      description: str(seo.description, defaults.seo.description),
      ogImage: str(seo.ogImage, defaults.seo.ogImage),
    },
  };
}

