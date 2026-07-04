"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Wrench, FolderKanban, FileText, Receipt, LogOut, Home, Users, Settings, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const navigation = [
  // Principal
  { group: "Principal", items: [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  ]},

  // CRM
  { group: "CRM", items: [
    { name: "CRM", href: "/admin/crm", icon: Users, exact: true },
    { name: "Clientes", href: "/admin/crm/customers", icon: Users },
  ]},

  // Operaciones
  { group: "Operaciones", items: [
    { name: "Cotizaciones", href: "/admin/quotes", icon: FileText },
    { name: "Recibos", href: "/admin/receipts", icon: Receipt },
    { name: "Proyectos", href: "/admin/projects", icon: FolderKanban },
  ]},

  // Inventario & ERP
  { group: "Inventario", items: [
    { name: "Productos", href: "/admin/products", icon: Package },
    { name: "Servicios", href: "/admin/services", icon: Wrench },
  ]},

  // Recursos Humanos
  { group: "Recursos Humanos", items: [
    { name: "Tiempo & Asistencia", href: "/admin/time-management", icon: Clock },
  ]},
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({ collapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="flex flex-col sticky top-0 flex-1">
      {/* Logo with Collapse Button */}
      <div className={`border-b transition-all flex-shrink-0 relative ${collapsed ? "p-3" : "p-6"}`}>
        {/* Collapse Button - Top Right */}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="absolute right-2 top-2 h-7 w-7"
            title={collapsed ? "Expandir" : "Colapsar"}
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        )}

        <div className="flex items-center justify-center rounded-lg p-4 border border-border/50">
          {!collapsed && (
            <Image
              src="/images/logo.svg"
              alt="Habita Studio"
              width={600}
              height={280}
              className="h-full w-auto object-scale-down"
              priority
            />
          )}
          {collapsed && (
            <div className="text-xl font-bold">HS</div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`${collapsed ? "px-2" : "px-3"} space-y-4 flex-1 overflow-hidden`}>
        {navigation.map((group: any) => (
          <div key={group.group}>
            {!collapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {group.group}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item: any) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : ""}
                    className={cn(
                      "flex items-center gap-3 rounded-lg transition-colors",
                      collapsed ? "p-3 justify-center" : "px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {!collapsed && item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {!collapsed && <div className="my-2 h-px bg-border" />}

        {/* Settings */}
        {!collapsed && (
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
              Configuración
            </div>
            <Link
              href="/admin/settings/users"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ml-2",
                pathname.startsWith("/admin/settings/users")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              Usuarios
            </Link>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className={`border-t border-border ${collapsed ? "p-2" : "p-4"}`}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "lg"}
          className={collapsed ? "w-full" : "w-full justify-start"}
          onClick={handleLogout}
          title={collapsed ? "Cerrar Sesión" : ""}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
        </Button>
      </div>
    </div>
  );
}

