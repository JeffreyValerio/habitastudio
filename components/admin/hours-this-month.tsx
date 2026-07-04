"use client";

import { useEffect, useState } from "react";
import { getCollaboratorHours } from "@/app/actions/timesheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export function HoursThisMonth({ userId }: { userId: string }) {
  const [hours, setHours] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("");

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    try {
      const now = new Date();
      const data = await getCollaboratorHours(userId, now.getFullYear(), now.getMonth() + 1);
      setHours(data.totalHours);
      setPeriod(data.period);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (totalHours: number) => {
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Horas del Mes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
          <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
            {period}
          </p>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
            {loading ? "..." : formatHours(hours)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Horas acumuladas
        </p>
      </CardContent>
    </Card>
  );
}
