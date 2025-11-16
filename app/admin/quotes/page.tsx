import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getQuotes } from "@/app/actions/quotes";
import { QuotesTable } from "@/components/admin/quotes-table";

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Cotizaciones</h1>
        <Button asChild>
          <Link href="/admin/quotes/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cotización
          </Link>
        </Button>
      </div>
      <QuotesTable quotes={quotes} />
    </div>
  );
}

