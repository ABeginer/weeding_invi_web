import type { Metadata } from "next";
import { GiftBookView } from "@/components/dashboard/GiftBookView";

export const metadata: Metadata = {
  title: "Sổ mừng cưới | Quản lý thiệp cưới",
  robots: { index: false, follow: false },
};

export default function SoMungPage() {
  return <GiftBookView />;
}
