import { getReceipt } from "@/app/actions/receipts";
import { ReceiptForm } from "@/components/admin/receipt-form";
import { ReceiptDownloadButton } from "@/components/admin/receipt-download-button";
import { notFound } from "next/navigation";

export default async function EditReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const receipt = await getReceipt(id);

  if (!receipt) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Editar Recibo: {receipt.receiptNumber}
        </h1>
        <ReceiptDownloadButton receipt={receipt} />
      </div>
      <ReceiptForm receipt={receipt} />
    </div>
  );
}
