import type { Metadata } from "next";
import { CreateWeddingBuilder } from "@/components/create/CreateWeddingBuilder";
import { SITE_NAME } from "@/config/site";
import { AUTH0_EMAIL_CLAIM } from "@/config/site";
import { getAuth0 } from "@/lib/auth0";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Tạo thiệp cưới thử ngay | ${SITE_NAME}`,
  description:
    "Chọn mẫu, nhập tên hai bạn và xem trước thiệp cưới online ngay trên khung điện thoại trước khi đăng nhập.",
};

interface CreateWeddingPageProps {
  searchParams: Promise<{
    template?: string;
    designerTemplate?: string;
    date?: string;
  }>;
}

export default async function CreateWeddingPage({
  searchParams,
}: CreateWeddingPageProps) {
  const { template, designerTemplate, date } = await searchParams;

  let isAuthenticated = false;
  let userEmail: string | null = null;

  try {
    const session = await getAuth0().getSession();
    isAuthenticated = Boolean(session);
    if (session?.user) {
      const userObj = session.user as Record<string, unknown>;
      const rawEmail = userObj.email ?? userObj[AUTH0_EMAIL_CLAIM];
      if (typeof rawEmail === "string" && rawEmail.trim()) {
        userEmail = rawEmail.trim();
      }
    }
  } catch {
    isAuthenticated = false;
    userEmail = null;
  }

  return (
    <CreateWeddingBuilder
      isAuthenticated={isAuthenticated}
      userEmail={userEmail}
      initialTemplateId={template}
      initialDesignerTemplateId={designerTemplate}
      initialDate={date}
    />
  );
}

