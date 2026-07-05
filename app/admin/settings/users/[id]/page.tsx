import { notFound } from "next/navigation";
import { getUser } from "@/app/actions/users";
import { getCurrentUser } from "@/lib/auth";
import { UserEditForm } from "@/components/admin/user-edit-form";
import { RestrictedAccess } from "@/components/admin/restricted-access";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "admin") {
    return <RestrictedAccess message="Solo los administradores pueden gestionar usuarios." />;
  }

  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold mb-6">Editar Usuario</h1>
      <UserEditForm user={user} />
    </div>
  );
}
