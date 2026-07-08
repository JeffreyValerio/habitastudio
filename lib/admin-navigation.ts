import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  Receipt,
  FileSpreadsheet,
  Boxes,
  FolderKanban,
  Wrench,
  Package,
  Clock,
  Shield,
  Home,
  User,
  type LucideIcon,
} from "lucide-react";

// Registro único de navegación para los 3 portales (admin, taller-manager,
// colaborador). Cada item con `section` es configurable por el admin desde
// /admin/settings/permissions; `core` siempre es visible; `adminOnly` nunca
// se muestra a otros roles, sin importar la configuración.
export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  section?: string;
  core?: boolean;
  adminOnly?: boolean;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  { group: "Principal", items: [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true, core: true },
  ]},

  { group: "CRM", items: [
    { name: "Clientes", href: "/admin/crm/customers", icon: Users, section: "admin.crm.customers" },
  ]},

  { group: "Ventas", items: [
    { name: "Cotizaciones", href: "/admin/quotes", icon: FileText, section: "admin.quotes" },
  ]},

  { group: "Producción", items: [
    { name: "Órdenes de Trabajo", href: "/admin/work-orders", icon: ClipboardList, section: "admin.work-orders" },
  ]},

  { group: "Facturación", items: [
    { name: "Recibos", href: "/admin/receipts", icon: Receipt, section: "admin.receipts" },
    { name: "Facturas", href: "/admin/invoices", icon: FileSpreadsheet, section: "admin.invoices" },
  ]},

  { group: "Inventario", items: [
    { name: "Materiales", href: "/admin/inventory", icon: Boxes, section: "admin.inventory" },
  ]},

  { group: "Página Web", items: [
    { name: "Proyectos", href: "/admin/projects", icon: FolderKanban, section: "admin.projects" },
    { name: "Servicios", href: "/admin/services", icon: Wrench, section: "admin.services" },
    { name: "Productos", href: "/admin/products", icon: Package, section: "admin.products" },
  ]},

  { group: "Recursos Humanos", items: [
    { name: "Tiempo & Asistencia", href: "/admin/time-management", icon: Clock, section: "admin.time-management" },
  ]},

  { group: "Configuración", items: [
    { name: "Usuarios", href: "/admin/settings/users", icon: Users, section: "admin.settings.users" },
    { name: "Permisos", href: "/admin/settings/permissions", icon: Shield, adminOnly: true },
  ]},
];

export const TALLER_MANAGER_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/taller-manager", icon: Home, exact: true, core: true },
  { name: "Órdenes de Trabajo", href: "/taller-manager/work-orders", icon: ClipboardList, section: "taller-manager.work-orders" },
  { name: "Registrar Horas", href: "/taller-manager/time-management/new", icon: Clock, section: "taller-manager.time-entry" },
  { name: "Mi Perfil", href: "/taller-manager/profile", icon: User, core: true },
];

export const COLLABORATOR_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/collaborator", icon: Home, exact: true, core: true },
  { name: "Órdenes de Trabajo", href: "/collaborator/work-orders", icon: ClipboardList, section: "collaborator.work-orders" },
  { name: "Mi Perfil", href: "/collaborator/profile", icon: User, core: true },
];

export function isNavItemVisible(
  item: Pick<NavItem, "core" | "adminOnly" | "section">,
  role: string | null | undefined,
  permissions: Record<string, boolean>
): boolean {
  if (role === "admin") return true;
  if (item.adminOnly) return false;
  if (item.core) return true;
  if (!item.section) return true;
  return permissions[item.section] ?? true;
}

export function isItemActive(pathname: string, item: { href: string; exact?: boolean }) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");
}
