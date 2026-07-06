"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCRC } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { setCollaboratorRate } from "@/app/actions/collaborator-rates";
import { Eye, Pencil, Check, X, Plus, Loader2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 15;

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

interface Collaborator {
  id: string;
  name: string | null;
  email: string;
  hourlyRate: number | null;
  createdAt: Date;
  hours?: number;
  earned?: number;
}

export function CollaboratorsTable({
  collaborators,
  rateYear,
  rateMonth,
  role,
}: {
  collaborators: Collaborator[];
  rateYear: number;
  rateMonth: number;
  role: string;
}) {
  const canManageRates = role === "admin";
  const canRegisterHours = role === "admin" || role === "moderator";
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rateValue, setRateValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [collaborators]);

  const totalPages = Math.ceil(collaborators.length / ITEMS_PER_PAGE);
  const paginatedCollaborators = collaborators.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const showEarnings = collaborators.some((c) => c.hours !== undefined);

  const startEdit = (collab: Collaborator) => {
    setEditingId(collab.id);
    setRateValue(collab.hourlyRate ? String(collab.hourlyRate) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setRateValue("");
  };

  const saveRate = async (userId: string) => {
    const rate = parseFloat(rateValue);
    if (isNaN(rate) || rate < 0) {
      toast({ title: "Error", description: "Ingresa una tarifa válida", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await setCollaboratorRate(userId, rateYear, rateMonth, rate);
      toast({ title: "Éxito", description: `Tarifa fijada para ${MONTH_NAMES[rateMonth - 1]} ${rateYear} en adelante` });
      setEditingId(null);
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

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
              {showEarnings && (
                <>
                  <th className="text-right py-3 px-4 font-semibold">Horas</th>
                  <th className="text-right py-3 px-4 font-semibold">Ganado</th>
                </>
              )}
              <th className="text-right py-3 px-4 font-semibold">Unido</th>
              <th className="text-right py-3 px-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCollaborators.map((collab) => (
              <tr key={collab.id} className="border-b hover:bg-accent/50">
                <td className="py-3 px-4">{collab.name || "Sin nombre"}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {collab.email}
                </td>
                <td className="py-3 px-4 text-right">
                  {editingId === collab.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-muted-foreground">₡</span>
                      <Input
                        type="number"
                        value={rateValue}
                        onChange={(e) => setRateValue(e.target.value)}
                        className="w-24 h-8 text-right"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => saveRate(collab.id)}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      {collab.hourlyRate ? (
                        <span className="font-semibold">
                          ₡{collab.hourlyRate.toFixed(0)}/h
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No asignada</span>
                      )}
                      {canManageRates && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEdit(collab)}
                          title={`Fijar tarifa desde ${MONTH_NAMES[rateMonth - 1]} ${rateYear}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </td>
                {showEarnings && (
                  <>
                    <td className="py-3 px-4 text-right font-mono">
                      {(collab.hours ?? 0).toFixed(1)}h
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-green-600 dark:text-green-400">
                      {formatCRC(collab.earned ?? 0)}
                    </td>
                  </>
                )}
                <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                  {new Date(collab.createdAt).toLocaleDateString("es-CR")}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canRegisterHours && (
                      <Button variant="ghost" size="sm" asChild title="Registrar horas">
                        <Link href={`/admin/time-management/new?userId=${collab.id}`}>
                          <Plus className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild title="Ver detalle">
                      <Link href={`/admin/time-management/${collab.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </Card>
  );
}
