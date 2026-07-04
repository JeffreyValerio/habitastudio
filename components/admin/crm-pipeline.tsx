import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export async function CRMPipeline() {
  const customers = await prisma.customer.findMany({
    select: { status: true },
  });

  const pipeline = {
    prospect: customers.filter((c) => c.status === "prospect").length,
    qualified: customers.filter((c) => c.status === "qualified").length,
    negotiation: customers.filter((c) => c.status === "negotiation").length,
    customer: customers.filter((c) => c.status === "customer").length,
    inactive: customers.filter((c) => c.status === "inactive").length,
  };

  const stages = [
    { label: "Prospecto", key: "prospect", color: "bg-gray-100 dark:bg-gray-800", textColor: "text-gray-700 dark:text-gray-300", icon: "🎯" },
    { label: "Calificado", key: "qualified", color: "bg-blue-100 dark:bg-blue-900", textColor: "text-blue-700 dark:text-blue-300", icon: "✓" },
    { label: "Negociación", key: "negotiation", color: "bg-amber-100 dark:bg-amber-900", textColor: "text-amber-700 dark:text-amber-300", icon: "🤝" },
    { label: "Cliente", key: "customer", color: "bg-green-100 dark:bg-green-900", textColor: "text-green-700 dark:text-green-300", icon: "👥" },
    { label: "Inactivo", key: "inactive", color: "bg-red-100 dark:bg-red-900", textColor: "text-red-700 dark:text-red-300", icon: "⏸" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Pipeline de Ventas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stages.map((stage) => (
            <div
              key={stage.key}
              className={`${stage.color} rounded-lg p-4 text-center transition-all hover:shadow-md`}
            >
              <p className="text-3xl mb-2">{stage.icon}</p>
              <p className={`text-3xl font-bold ${stage.textColor}`}>
                {pipeline[stage.key as keyof typeof pipeline]}
              </p>
              <p className="text-sm text-muted-foreground mt-2">{stage.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
