import { getCurrentUser } from "@/lib/auth";
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return <AdminLayoutClient role={user?.role ?? null}>{children}</AdminLayoutClient>;
}
