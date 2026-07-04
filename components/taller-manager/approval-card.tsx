"use client";

import { useState } from "react";
import { approveTimeEntry } from "@/app/actions/timesheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface ApprovalCardProps {
  approval: any;
}

export function ApprovalCard({ approval }: ApprovalCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const user = approval.timeEntry.user;
  const entry = approval.timeEntry;
  const isEntry = approval.type === "entry";

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveTimeEntry(approval.id, true);
      toast({
        title: "Éxito",
        description: `${isEntry ? "Entrada" : "Salida"} aprobada`,
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

  const handleReject = async () => {
    setLoading(true);
    try {
      await approveTimeEntry(approval.id, false, rejectionReason);
      toast({
        title: "Éxito",
        description: `${isEntry ? "Entrada" : "Salida"} rechazada`,
      });
      setRejecting(false);
      setRejectionReason("");
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

  const time = new Date(
    isEntry ? entry.entryTime : entry.exitTime
  ).toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const date = new Date(entry.entryDate).toLocaleDateString("es-CR");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {user.name || user.email}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg">{time}</p>
            <p className="text-sm text-muted-foreground">{date}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info */}
        <div className="p-3 rounded-lg bg-muted space-y-2">
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Tipo:</p>
            <p className="font-medium">
              {isEntry ? "Entrada" : "Salida"}
            </p>
          </div>
          {entry.project && (
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Proyecto:</p>
              <p className="font-medium">{entry.project.title}</p>
            </div>
          )}
          {entry.description && (
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Descripción:</p>
              <p className="font-medium text-right max-w-xs">{entry.description}</p>
            </div>
          )}
        </div>

        {/* Rejection Reason */}
        {rejecting && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Motivo del rechazo (opcional)</label>
            <Input
              placeholder="Ej: Hora inconsistente"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!rejecting ? (
            <>
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
              <Button
                onClick={() => setRejecting(true)}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Confirmar Rechazo
              </Button>
              <Button
                onClick={() => {
                  setRejecting(false);
                  setRejectionReason("");
                }}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
