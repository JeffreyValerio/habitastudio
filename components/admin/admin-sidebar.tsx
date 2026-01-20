"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Wrench, FolderKanban, FileText, Receipt, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Productos", href: "/admin/products", icon: Package },
  { name: "Servicios", href: "/admin/services", icon: Wrench },
  { name: "Proyectos", href: "/admin/projects", icon: FolderKanban },
  { name: "Cotizaciones", href: "/admin/quotes", icon: FileText },
  { name: "Recibos", href: "/admin/receipts", icon: Receipt },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="w-64 border-r bg-muted/40 flex flex-col relative">
      <div className="p-6 border-b">
        <Link href="/admin" className="flex items-center justify-center rounded-lg p-4 border border-border/50">
          <Image
            src="/images/logo.svg"
            alt="Habita Studio"
            width={600}
            height={280}
            className="h-full w-auto object-scale-down"
            priority
          />
        </Link>
        <p className="text-xs text-muted-foreground mt-3 text-center">Admin Panel</p>
      </div>
      <div className="px-3 pt-3 pb-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          asChild
        >
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Volver al Sitio
          </Link>
        </Button>
      </div>
      <nav className="px-3 space-y-1 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}

