import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getReceipts } from "@/app/actions/receipts";
import { ReceiptsTable } from "@/components/admin/receipts-table";

export default async function ReceiptsPage() {
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
