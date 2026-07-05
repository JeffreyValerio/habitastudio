"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { deleteUser } from "@/app/actions/users";
import { Pagination } from "@/components/ui/pagination";
import { Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 15;

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  hourlyRate: number | null;
  createdAt: Date;
}

const roleConfig: Record<string, { label: string; color: string }> = {
  admin: { label: "Administrador", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  moderator: { label: "Moderador", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  collaborator: { label: "Colaborador", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  "taller-manager": { label: "Jefe de Taller", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
};

export function UsersTable({ users }: { users: User[] }) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [users]);

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const confirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteUser(id);
      toast({ title: "Éxito", description: "Usuario eliminado" });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (id: string) => {
    toast({
      title: "¿Eliminar este usuario?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar eliminación" onClick={() => confirmDelete(id)}>
          Eliminar
        </ToastAction>
      ),
    });
  };

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No hay usuarios registrados
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
              <th className="text-left py-3 px-4 font-semibold">Rol</th>
              <th className="text-right py-3 px-4 font-semibold">Tarifa/Hora</th>
              <th className="text-right py-3 px-4 font-semibold">Desde</th>
              <th className="text-right py-3 px-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((u) => {
              const role = roleConfig[u.role] || { label: u.role, color: "bg-gray-100 text-gray-800" };
              return (
                <tr key={u.id} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4 font-medium">{u.name || "Sin nombre"}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{u.email}</td>
                  <td className="py-3 px-4">
                    <Badge className={role.color}>{role.label}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {u.hourlyRate ? `₡${u.hourlyRate.toFixed(0)}/h` : "—"}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("es-CR")}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/settings/users/${u.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </Card>
  );
}
