"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createManualTimeEntry } from "@/app/actions/timesheet";
import { Loader2 } from "lucide-react";

interface Collaborator {
  id: string;
  name: string | null;
  email: string;
}

interface ProjectOption {
  id: string;
  title: string;
}

interface ManualTimeEntryFormProps {
  collaborators: Collaborator[];
  projects: ProjectOption[];
  defaultUserId?: string;
}

export function ManualTimeEntryForm({ collaborators, projects, defaultUserId }: ManualTimeEntryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [userId, setUserId] = useState(defaultUserId || "");
  const [projectId, setProjectId] = useState("");
  const [entryDate, setEntryDate] = useState(today);
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({ title: "Error", description: "Selecciona un colaborador", variant: "destructive" });
      return;
    }
    if (!entryTime) {
      toast({ title: "Error", description: "Ingresa la hora de entrada", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createManualTimeEntry({
        userId,
        projectId: projectId || undefined,
        entryDate,
        entryTime,
        exitTime: exitTime || undefined,
        description: description || undefined,
      });

      toast({ title: "Éxito", description: "Horas registradas correctamente" });
      router.push(`/admin/time-management/${userId}`);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al registrar las horas",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="collaborator">Colaborador *</Label>
            <select
              id="collaborator"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              required
            >
              <option value="">Selecciona un colaborador</option>
              {collaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Fecha *</Label>
              <Input
                id="entryDate"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryTime">Hora de Entrada *</Label>
              <Input
                id="entryTime"
                type="time"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitTime">Hora de Salida</Label>
              <Input
                id="exitTime"
                type="time"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Proyecto (opcional)</Label>
            <select
              id="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="">Sin proyecto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles del trabajo realizado..."
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Horas
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
