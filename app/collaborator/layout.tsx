import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CollaboratorMobileNav } from "@/components/collaborator/collaborator-mobile-nav";
import CollaboratorLayoutClient from "@/components/collaborator/collaborator-layout-client";

export default async function CollaboratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "collaborator") {
    redirect("/admin/login");
  }

  return (
    <>
      <CollaboratorMobileNav />
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block md:w-64 border-r border-border bg-muted/40 flex-shrink-0">
          <CollaboratorLayoutClient user={user} isSidebar>
            <div />
          </CollaboratorLayoutClient>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
    </>
  );
}
