"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

export function AdminLayoutClient({
  role,
  children,
}: {
  role: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [collapsed, setCollapsed] = useState(false);

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Navigation */}
      <AdminMobileNav role={role} />

      {/* Desktop Sidebar - Hidden on mobile/tablet (they use the hamburger menu) */}
      <div className={`hidden lg:flex flex-col border-r border-border bg-muted/40 transition-all duration-300 ${collapsed ? "w-20" : "w-64"} flex-shrink-0 h-screen`}>
        <AdminSidebar role={role} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
