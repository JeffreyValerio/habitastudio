"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ADMIN_NAV_GROUPS, isNavItemVisible, isItemActive } from "@/lib/admin-navigation";

export function AdminMobileNav({ role, permissions = {} }: { role?: string | null; permissions?: Record<string, boolean> }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const visibleNavigation = ADMIN_NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => isNavItemVisible(item, role, permissions)),
  })).filter((g) => g.items.length > 0);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <>
      {/* Mobile Navbar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-40 flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center justify-center">
          <Image
            src="/images/logo.svg"
            alt="Habita Studio"
            width={40}
            height={40}
            className="h-8 w-auto"
          />
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile Menu Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 top-16"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "lg:hidden fixed left-0 top-16 w-72 h-[calc(100vh-4rem)] bg-background border-r border-border z-30 overflow-y-auto shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 space-y-4">
          {visibleNavigation.map((group) => (
            <div key={group.group}>
              <div className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {group.group}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(pathname, item);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Logout */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
