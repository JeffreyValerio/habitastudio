"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { migrateAcceptedQuotesToCustomers } from "@/app/actions/migration";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function MigrationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runMigration = async () => {
    setLoading(true);
    try {
      const res = await migrateAcceptedQuotesToCustomers();
      setResult(res);
      toast({
        title: "Éxito",
        description: res.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateQuotes = () => {
    toast({
      title: "¿Ejecutar migración?",
      description: "Esto convertirá todas las cotizaciones aceptadas en clientes.",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar migración" onClick={runMigration}>
          Ejecutar
        </ToastAction>
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Migraciones</h1>
        <p className="text-muted-foreground mt-1">
          Operaciones de base de datos para sincronizar datos
        </p>
      </div>

      {/* Migration: Quotes to Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Convertir Cotizaciones Aceptadas en Clientes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta migración convertirá todas las cotizaciones con estado "aceptada" en clientes en el sistema CRM.
            Si el cliente ya existe (por email), se actualizará el valor total gastado.
          </p>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              ℹ️ Información importante:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
              <li>• Se crearán nuevos clientes a partir de las cotizaciones aceptadas</li>
              <li>• Si el cliente ya existe por email, se actualizará el valor total</li>
              <li>• La cotización quedará asociada al cliente</li>
              <li>• Esta operación es reversible (se pueden eliminar clientes si es necesario)</li>
            </ul>
          </div>

          <Button
            onClick={handleMigrateQuotes}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {loading ? "Migrando..." : "Ejecutar Migración"}
          </Button>

          {result && (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Migración Completada
              </p>
              <ul className="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1">
                <li>✓ Total procesadas: {result.stats.total}</li>
                <li>✓ Nuevos clientes: {result.stats.created}</li>
                <li>✓ Cotizaciones asociadas: {result.stats.updated}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Automatización Futura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ✅ <strong>Ya está implementado:</strong> Cuando aceptes una cotización, se crea automáticamente un cliente en el CRM.
          </p>
          <p>
            Esta página permite ejecutar la migración retroactiva para todas las cotizaciones aceptadas antes de esta mejora.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
