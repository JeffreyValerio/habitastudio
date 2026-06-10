import { getProducts } from "@/app/actions/products";
import { getServices } from "@/app/actions/services";
import { getProjects } from "@/app/actions/projects";
import { getQuotes } from "@/app/actions/quotes";
import { getReceipts } from "@/app/actions/receipts";
import { DashboardContent } from "@/components/admin/dashboard-content";

export default async function AdminDashboard() {
  const [products, services, projects, quotes, receipts] = await Promise.all([
    getProducts(),
    getServices(),
    getProjects(),
    getQuotes(),
    getReceipts(),
  ]);

  return (
    <DashboardContent
      products={products}
      services={services}
      projects={projects}
      quotes={quotes}
      receipts={receipts}
    />
  );
}

