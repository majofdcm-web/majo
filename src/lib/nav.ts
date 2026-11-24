import { can } from "@/lib/store";
import type { User } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  test: (u: User) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/mesas", label: "Mesas", test: (u) => can(u, "mesas") || can(u, "cobrar") },
  { href: "/personal", label: "Comida de personal", test: (u) => can(u, "personal") },
  { href: "/gastos", label: "Gastos", test: (u) => can(u, "gastos") },
  { href: "/corte", label: "Corte de caja", test: (u) => can(u, "corte") },
  { href: "/clientes", label: "Clientes frecuentes", test: (u) => can(u, "ventasHoy") },
  { href: "/usuarios", label: "Usuarios y permisos", test: (u) => can(u, "usuarios") },
];

export function allowedNav(user: User): NavItem[] {
  return NAV_ITEMS.filter((n) => n.test(user));
}

export function firstAllowedPath(user: User): string {
  return allowedNav(user)[0]?.href ?? "/sin-permisos";
}
