"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_GROUPS, isNavItemVisible, isItemActive } from "@/lib/admin-navigation";

interface AdminSidebarProps {
  role?: string | null;
  permissions?: Record<string, boolean>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({ role, permissions = {}, collapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const visibleNavigation = ADMIN_NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => isNavItemVisible(item, role, permissions)),
  })).filter((g) => g.items.length > 0);

  useEffect(() => {
    const activeGroup = visibleNavigation.find((g) =>
      g.items.some((item) => isItemActive(pathname, item))
    );
    if (activeGroup) setExpandedGroup(activeGroup.group);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="flex flex-col sticky top-0 flex-1">
      {/* Logo with Collapse Button */}
      <div className={`border-b transition-all flex-shrink-0 relative ${collapsed ? "p-3" : "p-6"}`}>
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
      <nav className={`${collapsed ? "px-2" : "px-3"} space-y-1 flex-1 overflow-y-auto py-2`}>
        {visibleNavigation.map((group) => {
          const isMultiItem = group.items.length > 1;
          const isExpanded = collapsed || !isMultiItem || expandedGroup === group.group;

          return (
            <div key={group.group}>
              {!collapsed && (
                isMultiItem ? (
                  <button
                    type="button"
                    onClick={() => setExpandedGroup(isExpanded ? null : group.group)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                  >
                    {group.group}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
                  </button>
                ) : (
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.group}
                  </div>
                )
              )}

              {isExpanded && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(pathname, item);
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
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
