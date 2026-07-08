import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getReceipts } from "@/app/actions/receipts";
import { ReceiptsTable } from "@/components/admin/receipts-table";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { getSectionAccess } from "@/app/actions/role-permissions";

export default async function ReceiptsPage() {
  const { allowed } = await getSectionAccess("admin.receipts");

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Recibos</h1>
        </div>
        <RestrictedAccess message="No tienes permiso para ver los recibos." />
      </div>
    );
  }

  const receipts = await getReceipts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Recibos</h1>
        <Button asChild>
          <Link href="/admin/receipts/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Recibo
          </Link>
        </Button>
      </div>
      <ReceiptsTable receipts={receipts} />
    </div>
  );
}
