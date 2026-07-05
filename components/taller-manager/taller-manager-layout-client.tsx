"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, CheckSquare, Home, User, ClipboardList } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/taller-manager", icon: Home },
  { name: "Órdenes de Trabajo", href: "/taller-manager/work-orders", icon: ClipboardList },
  { name: "Aprobaciones Pendientes", href: "/taller-manager/approvals", icon: CheckSquare },
  { name: "Mi Perfil", href: "/taller-manager/profile", icon: User },
];

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export default function TallerManagerLayoutClient({
  user,
  children,
  isSidebar,
}: {
  user: User;
  children: React.ReactNode;
  isSidebar?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (isSidebar) {
    return (
      <div className="flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b">
          <h2 className="font-bold text-lg">Habita Studio</h2>
          <p className="text-xs text-muted-foreground mt-1">Jefe de Taller</p>
        </div>

        <nav className="px-3 pt-3 space-y-1 flex-1">
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

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
            disabled={loading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
