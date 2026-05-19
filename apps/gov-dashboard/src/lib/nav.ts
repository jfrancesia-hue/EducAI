import {
  BarChart3,
  BookOpen,
  Database,
  FileText,
  Inbox,
  LayoutDashboard,
  School,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";

export type GovRole = "SUPER_ADMIN" | "MINISTRY";

export interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
  roles: GovRole[];
  status?: "live" | "placeholder";
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Inicio",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "MINISTRY"],
    status: "live",
  },
  {
    href: "/handoffs",
    label: "Handoffs",
    icon: Inbox,
    roles: ["SUPER_ADMIN", "MINISTRY"],
    status: "live",
  },
  {
    href: "/indicadores",
    label: "Indicadores",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "MINISTRY"],
    status: "live",
  },
  {
    href: "/colegios",
    label: "Colegios",
    icon: School,
    roles: ["SUPER_ADMIN", "MINISTRY"],
    status: "live",
  },
  {
    href: "/curriculo",
    label: "Curriculo",
    icon: BookOpen,
    roles: ["SUPER_ADMIN", "MINISTRY"],
    status: "live",
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: FileText,
    roles: ["SUPER_ADMIN", "MINISTRY"],
    status: "live",
  },
  {
    href: "/auditoria",
    label: "Auditoria",
    icon: Shield,
    roles: ["SUPER_ADMIN", "MINISTRY"],
    status: "live",
  },
  {
    href: "/datos",
    label: "Datos abiertos",
    icon: Database,
    roles: ["SUPER_ADMIN", "MINISTRY"],
    status: "live",
  },
  {
    href: "/configuracion",
    label: "Configuracion",
    icon: Settings,
    roles: ["SUPER_ADMIN"],
    status: "placeholder",
  },
];
