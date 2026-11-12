import { permanentRedirect } from "next/navigation";
import { SITE_LINKS } from "@/config/site";

export default function LegacyBudgetRedirectPage() {
  permanentRedirect(SITE_LINKS.toolWeddingCalc);
}
