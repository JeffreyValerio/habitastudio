"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: "📊" },
  { name: "Clientes", href: "/admin/customers", icon: "👥" },
  { name: "Cotizaciones", href: "/admin/quotes", icon: "📄" },
  { name: "Recibos", href: "/admin/receipts", icon: "🧾" },
  { name: "Productos", href: "/admin/products", icon: "📦" },
  { name: "Servicios", href: "/admin/services", icon: "🔧" },
  { name: "Proyectos", href: "/admin/projects", icon: "🏗️" },
  { name: "Tiempo", href: "/admin/time-management", icon: "⏱️" },
];

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <>
      {/* Mobile Navbar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-40 flex items-center justify-between px-4">
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
          className="md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile Menu Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 top-16"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "md:hidden fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-muted/40 border-r border-border z-30 overflow-y-auto transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
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
                <span className="text-base">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}

          {/* Settings Section */}
          <div className="my-4 border-t pt-4">
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
              Configuración
            </div>
            <Link
              href="/admin/settings/users"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ml-0",
                pathname.startsWith("/admin/settings/users")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span>👤</span>
              Usuarios
            </Link>
          </div>

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
              <span className="mr-2">🚪</span>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
