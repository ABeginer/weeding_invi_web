export const INVITE_SHARE_TEMPLATE =
  "Thân mời [tên khách] đến chung vui cùng vợ chồng mình. Xem thiệp mời và địa điểm tại đây: [link]";

export function buildInviteShareMessage(guestName: string, link: string): string {
  const safeName = guestName.trim() || "bạn";
  return INVITE_SHARE_TEMPLATE.replace("[tên khách]", safeName).replace(
    "[link]",
    link,
  );
}

