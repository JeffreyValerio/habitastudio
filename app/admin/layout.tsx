import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Si no hay usuario, el middleware redirige a login
  // Si llegamos aquí pero no es admin, también redirige
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Admin - Habita Studio",
  };
}

