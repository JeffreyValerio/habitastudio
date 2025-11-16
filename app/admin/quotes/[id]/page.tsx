import { getQuote } from "@/app/actions/quotes";
import { QuoteForm } from "@/components/admin/quote-form";
import { QuoteDownloadButton } from "@/components/admin/quote-download-button";
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
        <QuoteDownloadButton quote={quote} />
      </div>
      <QuoteForm quote={quote} />
    </div>
  );
}

