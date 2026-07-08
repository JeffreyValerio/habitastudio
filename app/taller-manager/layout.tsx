import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRolePermissionsMap } from "@/app/actions/role-permissions";
import { TallerManagerMobileNav } from "@/components/taller-manager/taller-manager-mobile-nav";
import TallerManagerLayoutClient from "@/components/taller-manager/taller-manager-layout-client";

export default async function TallerManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "taller-manager") {
    redirect("/admin/login");
  }

  const permissions = await getRolePermissionsMap(user.role);

  return (
    <>
      <TallerManagerMobileNav role={user.role} permissions={permissions} />
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block md:w-64 border-r border-border bg-muted/40 flex-shrink-0">
          <TallerManagerLayoutClient user={user} isSidebar permissions={permissions}>
            <div />
          </TallerManagerLayoutClient>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </>
  );
}
