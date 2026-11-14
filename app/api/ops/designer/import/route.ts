import { json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { db } from "@/lib/server/supabase";
import { TEMPLATE_REGISTRY } from "@/templates/registry";

const DEFAULT_CANVAS = {
  width: 390,
  height: 844,
  background: "#FAF8F5",
  elements: [],
};

export const POST = opsRoute(async (_req, admin) => {
  const client = db();
  const { data: existing, error: existingError } = await client
    .from("designer_templates")
    .select("name");
  if (existingError) throw existingError;

  const taken = new Set((existing ?? []).map((row) => String(row.name)));
  let imported = 0;

  for (const template of TEMPLATE_REGISTRY) {
    if (template.isPlaceholder || taken.has(template.name)) continue;

    const { error } = await client.from("designer_templates").insert({
      name: template.name,
      plan: template.plan,
      ritual: template.ritualLabel ?? null,
      status: "draft",
      created_by: admin.email ?? "ops",
      canvas_json: {
        ...DEFAULT_CANVAS,
        backgroundUrl: template.coverImage,
      },
    });

    if (error) throw error;
    imported += 1;
  }

  return json({ imported });
});
