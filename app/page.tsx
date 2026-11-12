import { InvitationShell } from "@/components/invitation/InvitationShell";
import { WeddingInvitationContent } from "@/components/invitation/WeddingInvitationContent";

export default function HomePage() {
  return (
    <InvitationShell>
      <WeddingInvitationContent />
    </InvitationShell>
  );
}
