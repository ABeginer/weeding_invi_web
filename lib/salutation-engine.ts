import type { GuestDiet } from "./types";

export type RelationshipGroup = "elder" | "peer_formal" | "close_friend" | "family";

export interface SalutationInput {
  guestName: string;
  relationshipGroup?: RelationshipGroup | null;
  customPronounHost?: string | null;
  customPronounGuest?: string | null;
}

export interface Salutation {
  relationshipGroup: RelationshipGroup;
  /** Tiền tố in trước tên khách trên thiệp: "Trân trọng kính mời", "Thân mời"… */
  invitePrefix: string;
  /** Tên khách đã bổ sung vai vế: "Bác Tuấn cùng Gia đình". */
  guestLabel: string;
  /** Đại từ của cô dâu chú rể khi nói về mình: "Gia đình chúng tôi". */
  hostPronoun: string;
  /** Đại từ dùng để gọi khách trong lời nhắn. */
  guestPronoun: string;
  /** Câu mời đầy đủ dùng trên thiệp. */
  invitationLine: string;
  /** Lời nhắn Zalo/Messenger gợi ý. */
  zaloMessage: string;
}

const DEFAULT_GROUP: RelationshipGroup = "peer_formal";

const GROUP_LABELS: Record<RelationshipGroup, string> = {
  elder: "Bề trên / Họ hàng",
  peer_formal: "Bạn bè / Đồng nghiệp",
  close_friend: "Bạn thân",
  family: "Gia đình",
};

export function getRelationshipLabel(group: RelationshipGroup): string {
  return GROUP_LABELS[group] ?? GROUP_LABELS[DEFAULT_GROUP];
}

function baseSalutation(group: RelationshipGroup): Omit<Salutation, "guestLabel" | "invitationLine" | "zaloMessage"> {
  switch (group) {
    case "elder":
      return {
        relationshipGroup: group,
        invitePrefix: "Trân trọng kính mời",
        hostPronoun: "Gia đình chúng tôi",
        guestPronoun: "Bác cùng Gia đình",
      };
    case "family":
      return {
        relationshipGroup: group,
        invitePrefix: "Trân trọng kính mời",
        hostPronoun: "Gia đình chúng tôi",
        guestPronoun: "Gia đình",
      };
    case "close_friend":
      return {
        relationshipGroup: group,
        invitePrefix: "Thân mời",
        hostPronoun: "Tụi mình",
        guestPronoun: "Bạn",
      };
    case "peer_formal":
    default:
      return {
        relationshipGroup: group,
        invitePrefix: "Trân trọng mời",
        hostPronoun: "Vợ chồng chúng tôi",
        guestPronoun: "Anh/Chị",
      };
  }
}

function inferGuestPronoun(group: RelationshipGroup, guestName: string, fallback: string): string {
  if (group === "elder") {
    const match = guestName.match(/^(chú|cô|bác|dì|dượng|cậu|mợ|thím|ông|bà)(?:\s|$)/i);
    if (match) {
      const title = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      return `${title} cùng Gia đình`;
    }
    return fallback;
  }
  if (group === "peer_formal") {
    const match = guestName.match(/^(anh|chị)(?:\s|$)/i);
    if (match) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    }
    return fallback;
  }
  return fallback;
}

/**
 * Sinh câu mời, cách xưng hô và lời nhắn Zalo theo vai vế văn hóa Việt.
 * Không phụ thuộc DB để dùng được ở cả server và client.
 */
export function buildSalutation(input: SalutationInput): Salutation {
  const group = input.relationshipGroup ?? DEFAULT_GROUP;
  const base = baseSalutation(group);
  const guestName = input.guestName.trim();
  const guestPronoun =
    input.customPronounGuest?.trim() ||
    inferGuestPronoun(group, guestName, base.guestPronoun);
  const hostPronoun = input.customPronounHost?.trim() || base.hostPronoun;

  const suffixForGroup: Record<RelationshipGroup, string> = {
    elder: "cùng Gia đình",
    family: "",
    close_friend: "",
    peer_formal: "",
  };
  const suffix = suffixForGroup[group];
  const guestLabel = suffix ? `${guestName} ${suffix}` : guestName;

  const invitationLine =
    group === "close_friend"
      ? `${base.invitePrefix}: ${guestLabel} — ${hostPronoun} rất mong bạn có mặt chung vui.`
      : group === "elder"
        ? `${base.invitePrefix}: ${guestLabel}. ${hostPronoun} kính mong ${guestPronoun.toLowerCase()} sắp xếp thời gian đến chung vui.`
        : `${base.invitePrefix}: ${guestLabel}. ${hostPronoun} rất mong được đón tiếp ${guestPronoun.toLowerCase()}.`;

  const zaloMessage =
    group === "close_friend"
      ? `${guestName} ơi, ${hostPronoun} sắp cưới rồi! Gửi bạn thiệp mời online, nhớ bấm xác nhận giúp tụi mình nhé. Hẹn gặp bạn trong ngày vui 💌`
      : group === "elder"
        ? `Kính gửi ${guestPronoun}, ${hostPronoun} trân trọng kính mời ${guestPronoun.toLowerCase()} đến dự lễ cưới. Thiệp mời online gửi kèm trong tin nhắn này, mong ${guestPronoun.toLowerCase()} nhận lời.`
        : group === "family"
          ? `Kính mời ${guestLabel} đến chung vui cùng ${hostPronoun}. Thiệp cưới online gửi kèm trong tin nhắn này ạ.`
          : `${guestPronoun} thân mến, ${hostPronoun} trân trọng mời ${guestPronoun.toLowerCase()} đến dự lễ cưới. Thiệp online gửi kèm trong tin nhắn này, mong nhận được phản hồi của ${guestPronoun.toLowerCase()}.`;

  return {
    ...base,
    guestLabel,
    guestPronoun,
    hostPronoun,
    invitationLine,
    zaloMessage,
  };
}

export function dietToPreference(diet?: GuestDiet | null): "standard" | "vegetarian" {
  return diet === "veg" ? "vegetarian" : "standard";
}

export function preferenceLabel(preference?: "standard" | "vegetarian" | null): string {
  return preference === "vegetarian" ? "Thực đơn chay" : "Thực đơn mặn";
}
