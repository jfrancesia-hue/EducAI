"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { EducAiRole } from "../../../lib/supabase/roles";

const RoleContext = createContext<EducAiRole | null>(null);

/** Provee el rol del usuario al árbol del panel para gatear UI sensible (ej. Seguridad). */
export function RoleProvider({ role, children }: { role: EducAiRole | null; children: ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRole(): EducAiRole | null {
  return useContext(RoleContext);
}

export function isSecurityAdmin(role: EducAiRole | null): boolean {
  return role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN";
}

/** Dueño de la plataforma: ve métricas de negocio (ingresos, MRR). */
export function isOwner(role: EducAiRole | null): boolean {
  return role === "SUPER_ADMIN";
}
