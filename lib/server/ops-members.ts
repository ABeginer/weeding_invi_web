import { isMissingOpsMembersTable } from "./ops";
import { db } from "./supabase";
import { isOpsRole, normalizeOpsEmail, type OpsRole } from "../ops-roles";

export interface OpsMemberRow {
  email: string;
  role: OpsRole;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpsMemberList {
  items: OpsMemberRow[];
  /** true khi DB chưa chạy migration_v16. */
  needsMigration: boolean;
}

interface RawOpsMemberRow {
  email: string;
  role: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function listOpsMembers(): Promise<OpsMemberList> {
  const { data, error } = await db()
    .from("ops_members")
    .select("email, role, created_by, created_at, updated_at")
    .order("email", { ascending: true });

  if (error) {
    if (isMissingOpsMembersTable(error)) {
      return { items: [], needsMigration: true };
    }
    throw error;
  }

  const items = ((data ?? []) as RawOpsMemberRow[])
    .filter((row) => isOpsRole(row.role))
    .map((row) => ({
      email: row.email,
      role: row.role as OpsRole,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

  return { items, needsMigration: false };
}

export async function upsertOpsMember(input: {
  email: string;
  role: OpsRole;
  actorEmail: string;
}): Promise<void> {
  const email = normalizeOpsEmail(input.email);
  const { error } = await db()
    .from("ops_members")
    .upsert(
      {
        email,
        role: input.role,
        created_by: input.actorEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

  if (error) {
    if (isMissingOpsMembersTable(error)) {
      throw new MissingOpsMembersError();
    }
    throw error;
  }
}

export async function deleteOpsMember(email: string): Promise<void> {
  const normalized = normalizeOpsEmail(email);
  const { error } = await db()
    .from("ops_members")
    .delete()
    .eq("email", normalized);

  if (error) {
    if (isMissingOpsMembersTable(error)) {
      throw new MissingOpsMembersError();
    }
    throw error;
  }
}

export class MissingOpsMembersError extends Error {
  constructor() {
    super("Bảng ops_members chưa tồn tại. Hãy chạy migration_v16.");
    this.name = "MissingOpsMembersError";
  }
}

export const MISSING_OPS_MEMBERS_MESSAGE =
  "Cơ sở dữ liệu chưa có bảng ops_members. Hãy chạy migration_v16_ops_roles_template_meta.sql.";
