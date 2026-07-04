"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export function HoursToday({ userId }: { userId: string }) {
  const [hours, setHours] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateHours();
    const interval = setInterval(calculateHours, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  const calculateHours = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const response = await fetch(`/api/timesheet/hours-today?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setHours(data.hours);
      }
    } catch (error) {
      console.error("Error fetching hours:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (totalHours: number) => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horas de Hoy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
            Tiempo trabajado
          </p>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
            {formatHours(hours)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {loading ? "Cargando..." : "Se actualiza en tiempo real"}
        </p>
      </CardContent>
    </Card>
  );
}
