import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissionsMap } from "@/app/actions/role-permissions";
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const permissions = user ? await getRolePermissionsMap(user.role) : {};

  return (
    <AdminLayoutClient role={user?.role ?? null} permissions={permissions}>
      {children}
    </AdminLayoutClient>
  );
}
