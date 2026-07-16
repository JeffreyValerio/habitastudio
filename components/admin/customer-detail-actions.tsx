"use client";

import { useState } from "react";
import { addInteraction, addNote, getInteractions, getNotes } from "@/app/actions/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, FileText, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Interaction {
  id: string;
  type: string;
  subject: string;
  notes?: string | null;
  outcome?: string | null;
  duration?: number | null;
  createdAt: Date;
}

interface Note {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: Date;
}

export function CustomerDetailActions({ customerId }: { customerId: string }) {
  const { toast } = useToast();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tab, setTab] = useState<"interactions" | "notes">("interactions");
  const [loading, setLoading] = useState(false);

  // Form states
  const [interactionForm, setInteractionForm] = useState({
    type: "email",
    subject: "",
    notes: "",
    outcome: "",
  });

  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    priority: "normal",
  });

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionForm.subject) {
      toast({ title: "Error", description: "El asunto es requerido", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await addInteraction(customerId, {
        type: interactionForm.type,
        subject: interactionForm.subject,
        notes: interactionForm.notes || undefined,
        outcome: interactionForm.outcome || undefined,
      });
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }

      toast({ title: "Éxito", description: "Interacción agregada" });
      setInteractionForm({ type: "email", subject: "", notes: "", outcome: "" });

      // Reload interactions
      const updated = await getInteractions(customerId);
      setInteractions(updated as Interaction[]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title || !noteForm.content) {
      toast({ title: "Error", description: "Título y contenido son requeridos", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await addNote(customerId, {
        title: noteForm.title,
        content: noteForm.content,
        priority: noteForm.priority,
      });
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }

      toast({ title: "Éxito", description: "Nota agregada" });
      setNoteForm({ title: "", content: "", priority: "normal" });

      // Reload notes
      const updated = await getNotes(customerId);
      setNotes(updated as Note[]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={tab === "interactions" ? "default" : "outline"}
          onClick={() => setTab("interactions")}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Interacciones
        </Button>
        <Button
          variant={tab === "notes" ? "default" : "outline"}
          onClick={() => setTab("notes")}
        >
          <FileText className="mr-2 h-4 w-4" />
          Notas
        </Button>
      </div>

      {/* Interactions Tab */}
      {tab === "interactions" && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Interacción</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddInteraction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={interactionForm.type} onValueChange={(value) => setInteractionForm({ ...interactionForm, type: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="call">Llamada</SelectItem>
                      <SelectItem value="meeting">Reunión</SelectItem>
                      <SelectItem value="proposal">Propuesta</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="follow-up">Seguimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Resultado</label>
                  <Select value={interactionForm.outcome} onValueChange={(value) => setInteractionForm({ ...interactionForm, outcome: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interested">Interesado</SelectItem>
                      <SelectItem value="not-interested">No interesado</SelectItem>
                      <SelectItem value="follow-up-needed">Seguimiento necesario</SelectItem>
                      <SelectItem value="closed">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Asunto</label>
                <Input
                  placeholder="Descripción de la interacción"
                  value={interactionForm.subject}
                  onChange={(e) => setInteractionForm({ ...interactionForm, subject: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notas</label>
                <Textarea
                  placeholder="Detalles adicionales..."
                  value={interactionForm.notes}
                  onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                {loading ? "Guardando..." : "Agregar Interacción"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notes Tab */}
      {tab === "notes" && (
        <Card>
          <CardHeader>
            <CardTitle>Agregar Nota</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    placeholder="Título de la nota"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridad</label>
                  <Select value={noteForm.priority} onValueChange={(value) => setNoteForm({ ...noteForm, priority: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Contenido</label>
                <Textarea
                  placeholder="Contenido de la nota..."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className="mt-2"
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                {loading ? "Guardando..." : "Agregar Nota"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
