"use client";

import { useState } from "react";
import { deleteInvitation } from "@/app/actions/invitations";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Trash2, Clock } from "lucide-react";

interface UserInvitation {
  id: string;
  email: string;
  role: string;
  accepted: boolean;
  createdAt: string | Date;
  expiresAt: string | Date;
}

export function PendingInvitationsList({
  invitations,
}: {
  invitations: UserInvitation[];
}) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);

  const confirmDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteInvitation(id);
      toast({
        title: "Éxito",
        description: "Invitación eliminada",
      });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleDelete = (id: string) => {
    toast({
      title: "¿Eliminar invitación?",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar eliminación" onClick={() => confirmDelete(id)}>
          Eliminar
        </ToastAction>
      ),
    });
  };

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitaciones Pendientes</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
          <p className="text-muted-foreground">No hay invitaciones pendientes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Invitaciones Pendientes ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => {
            const expiresAt = new Date(invitation.expiresAt);
            const daysLeft = Math.ceil(
              (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            const isExpired = daysLeft < 0;

            return (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {invitation.role === "admin"
                            ? "Administrador"
                            : "Moderador"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {isExpired ? (
                            <span className="text-red-500">Expirada hace {Math.abs(daysLeft)} días</span>
                          ) : (
                            `Expira en ${daysLeft} días`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(invitation.id)}
                  disabled={deleting === invitation.id}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
