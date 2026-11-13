import { json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { db } from "@/lib/server/supabase";

export const GET = opsRoute(async (req: Request) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
  const plan = url.searchParams.get("plan")?.trim() || "";
  const suspendedParam = url.searchParams.get("suspended")?.trim() || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = 20;

  const client = db();

  // Query weddings
  let query = client
    .from("weddings")
    .select("id, slug, plan, content, owner_id, created_at")
    .order("created_at", { ascending: false });

  if (plan && plan !== "all") {
    query = query.eq("plan", plan);
  }

  const { data: allWeddings, error } = await query;
  if (error) throw error;

  // Fetch users for ownerEmail
  const ownerIds = Array.from(new Set((allWeddings || []).map((w) => w.owner_id)));
  const emailMap: Record<string, string> = {};

  if (ownerIds.length > 0) {
    const { data: usersData } = await client
      .from("users")
      .select("id, email")
      .in("id", ownerIds);

    for (const u of usersData || []) {
      emailMap[u.id] = u.email || "";
    }
  }

  // Fetch guest counts
  const weddingIds = (allWeddings || []).map((w) => w.id);
  const guestCountMap: Record<string, number> = {};

  if (weddingIds.length > 0) {
    const { data: guestsData } = await client
      .from("guests")
      .select("id, wedding_id")
      .in("wedding_id", weddingIds);

    for (const g of guestsData || []) {
      guestCountMap[g.wedding_id] = (guestCountMap[g.wedding_id] || 0) + 1;
    }
  }

  // Filter in memory for q and suspended to handle content JSON
  let filtered = (allWeddings || []).map((w) => {
    const content = (w.content || {}) as {
      couple?: { groomName?: string; brideName?: string };
      suspended?: boolean;
    };
    const isSuspended =
      Boolean((w as { suspended?: boolean }).suspended) ||
      Boolean(content.suspended);

    const title =
      content.couple?.groomName && content.couple?.brideName
        ? `${content.couple.groomName} & ${content.couple.brideName}`
        : w.slug;

    const ownerEmail = emailMap[w.owner_id] || "";

    return {
      id: w.id,
      slug: w.slug,
      title,
      plan: w.plan,
      suspended: isSuspended,
      ownerEmail,
      guestCount: guestCountMap[w.id] || 0,
      createdAt: w.created_at,
    };
  });

  if (q) {
    filtered = filtered.filter(
      (w) =>
        w.slug.toLowerCase().includes(q) ||
        w.title.toLowerCase().includes(q) ||
        w.ownerEmail.toLowerCase().includes(q),
    );
  }

  if (suspendedParam && suspendedParam !== "all") {
    const isSuspendedTarget = suspendedParam === "suspended";
    filtered = filtered.filter((w) => w.suspended === isSuspendedTarget);
  }

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = (page - 1) * pageSize;
  const sliced = filtered.slice(from, from + pageSize);

  return json({
    items: sliced,
    page,
    totalPages,
  });
});

