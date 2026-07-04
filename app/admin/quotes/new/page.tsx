import { QuoteFormImproved } from "@/components/admin/quote-form-improved";
import { getRecentCustomers, getRecentQuotes } from "@/app/actions/crm";

export default async function NewQuotePage() {
  const [recentCustomers, recentQuotes] = await Promise.all([
    getRecentCustomers(10),
    getRecentQuotes(5),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Nueva Cotización</h1>
      <p className="text-muted-foreground mb-6">Formulario mejorado con vista previa en tiempo real</p>
      <QuoteFormImproved
        recentCustomersData={recentCustomers}
        recentQuotesData={recentQuotes}
      />
    </div>
  );
}

