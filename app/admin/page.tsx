import { getProducts } from "@/app/actions/products";
import { getServices } from "@/app/actions/services";
import { getProjects } from "@/app/actions/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Wrench, FolderKanban } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const [products, services, projects] = await Promise.all([
    getProducts(),
    getServices(),
    getProjects(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Productos</CardTitle>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Productos en catálogo
            </p>
            <Link href="/admin/products" className="text-sm text-primary hover:underline mt-2 inline-block">
              Gestionar productos →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Servicios</CardTitle>
              <Wrench className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Servicios disponibles
            </p>
            <Link href="/admin/services" className="text-sm text-primary hover:underline mt-2 inline-block">
              Gestionar servicios →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Proyectos</CardTitle>
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Proyectos realizados
            </p>
            <Link href="/admin/projects" className="text-sm text-primary hover:underline mt-2 inline-block">
              Gestionar proyectos →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

