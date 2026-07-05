import Link from "next/link";
import { getQuote } from "@/app/actions/quotes";
import { QuoteFormImproved } from "@/components/admin/quote-form-improved";
import { QuoteDownloadButton } from "@/components/admin/quote-download-button";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuote(id);

  if (!quote) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Editar Cotización: {quote.quoteNumber}
        </h1>
        <div className="flex gap-2">
          {quote.workOrder && (
            <Button variant="outline" asChild>
              <Link href={`/admin/work-orders/${quote.workOrder.id}`}>
                <ClipboardList className="mr-2 h-4 w-4" />
                {quote.workOrder.workOrderNumber}
              </Link>
            </Button>
          )}
          <QuoteDownloadButton quote={quote} />
        </div>
      </div>
      <QuoteFormImproved quote={quote} />
    </div>
  );
}

