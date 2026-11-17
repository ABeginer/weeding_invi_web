"use client";

import * as React from "react";
import type { OpsMe } from "@/lib/ops-api";

const OpsRoleContext = React.createContext<OpsMe | null>(null);

export function OpsRoleProvider({
  me,
  children,
}: {
  me: OpsMe;
  children: React.ReactNode;
}) {
  return (
    <OpsRoleContext.Provider value={me}>{children}</OpsRoleContext.Provider>
  );
}

/** Role hiện tại cho các trang client trong /ops (admin/designer). */
export function useOpsMe(): OpsMe {
  const me = React.useContext(OpsRoleContext);
  if (!me) {
    throw new Error("useOpsMe phải dùng bên trong OpsRoleProvider.");
  }
  return me;
}
