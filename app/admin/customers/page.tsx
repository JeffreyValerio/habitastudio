import Link from "next/link";
import { getCRMDashboard, getCustomers } from "@/app/actions/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CRMDashboard } from "@/components/admin/crm-dashboard";
import { CustomersTable } from "@/components/admin/customers-table";
import { formatCRC } from "@/lib/utils";
import { Users, TrendingUp } from "lucide-react";

export default async function CustomersPage() {
  const [dashboard, customers] = await Promise.all([
    getCRMDashboard(),
    getCustomers(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">CRM</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu cartera de clientes
        </p>
      </div>

      <CRMDashboard data={dashboard} />

      {/* Customers Table */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Todos los Clientes</h2>
        <CustomersTable customers={customers} />
      </div>
    </div>
  );
}
