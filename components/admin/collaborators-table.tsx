"use client";

import Link from "next/link";
import { formatCRC } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Collaborator {
  id: string;
  name: string | null;
  email: string;
  hourlyRate: number | null;
  createdAt: Date;
}

export function CollaboratorsTable({
  collaborators,
}: {
  collaborators: Collaborator[];
}) {
  if (collaborators.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No hay colaboradores registrados
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold">Nombre</th>
              <th className="text-left py-3 px-4 font-semibold">Email</th>
              <th className="text-right py-3 px-4 font-semibold">Tarifa/Hora</th>
              <th className="text-right py-3 px-4 font-semibold">Unido</th>
              <th className="text-right py-3 px-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {collaborators.map((collab) => (
              <tr key={collab.id} className="border-b hover:bg-accent/50">
                <td className="py-3 px-4">{collab.name || "Sin nombre"}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {collab.email}
                </td>
                <td className="py-3 px-4 text-right">
                  {collab.hourlyRate ? (
                    <span className="font-semibold">
                      ₡{collab.hourlyRate.toFixed(0)}/h
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No asignada</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                  {new Date(collab.createdAt).toLocaleDateString("es-CR")}
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <Link href={`/admin/time-management/${collab.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
