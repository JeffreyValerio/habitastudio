import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function WorkOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
        <p className="text-muted-foreground mt-2">
          Crea y da seguimiento a las órdenes de trabajo de los proyectos
        </p>
      </div>

      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="font-medium">Próximamente</p>
          <p className="text-sm text-muted-foreground mt-1">
            Esta sección está en construcción
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
