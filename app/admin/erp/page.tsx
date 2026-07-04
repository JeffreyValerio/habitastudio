import { getERPAnalytics } from "@/app/actions/erp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Boxes,
  Truck,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { formatCRC } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function ERPPage() {
  const analytics = await getERPAnalytics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">ERP - Sistema Integrado</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de inventario, compras y proveedores
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/erp/suppliers">
              <Truck className="mr-2 h-4 w-4" />
              Proveedores
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/erp/purchase-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Orden de Compra
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              Proveedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalSuppliers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-amber-600" />
              Órdenes Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {analytics.activePOs}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Valor Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCRC(analytics.totalPOValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Boxes className="h-4 w-4 text-purple-600" />
              Valor Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCRC(analytics.stockValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.totalProducts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {analytics.thisMonthMovements}
            </p>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/erp/purchase-orders">Ver Órdenes</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/erp/inventory">Ver Inventario</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/erp/suppliers">Gestionar Proveedores</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estados de Órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <p>Borradores</p>
                <p className="font-bold">-</p>
              </div>
              <div className="flex justify-between">
                <p>Enviadas</p>
                <p className="font-bold">-</p>
              </div>
              <div className="flex justify-between">
                <p>Recibidas</p>
                <p className="font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Próximamente: Productos con stock bajo</p>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades ERP</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold mb-2">✓ Gestión de Proveedores</p>
            <p className="text-sm text-muted-foreground">
              Crear y mantener registro de proveedores con términos de pago
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">✓ Órdenes de Compra</p>
            <p className="text-sm text-muted-foreground">
              Generar y rastrear órdenes de compra automáticamente
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">✓ Gestión de Inventario</p>
            <p className="text-sm text-muted-foreground">
              Control de stock con movimientos entrada/salida
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">✓ Análisis de Costos</p>
            <p className="text-sm text-muted-foreground">
              Seguimiento de costos y márgenes por producto
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
