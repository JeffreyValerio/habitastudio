import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Obtener la ruta actual del header agregado por el proxy
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  
  // Si estamos en la ruta de login, no aplicar verificación ni sidebar
  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto">{children}</div>
      </div>
    );
  }

  // El proxy ya maneja las redirecciones, pero verificamos el rol aquí
  const user = await getCurrentUser();

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

