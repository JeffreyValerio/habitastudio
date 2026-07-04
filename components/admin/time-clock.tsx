"use client";

import { useState } from "react";
import { clockIn, clockOut, getMyCurrentEntry } from "@/app/actions/timesheet";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { useEffect } from "react";

export function TimeClock({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [entryTime, setEntryTime] = useState<string>("");

  useEffect(() => {
    loadCurrentEntry();
  }, []);

  const loadCurrentEntry = async () => {
    try {
      const entry = await getMyCurrentEntry();
      if (entry) {
        setCurrentEntry(entry);
        setEntryTime(new Date(entry.entryTime).toLocaleTimeString());
      }
    } catch (error) {
      // No hay entrada activa
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const entry = await clockIn();
      setCurrentEntry(entry);
      setEntryTime(new Date(entry.entryTime).toLocaleTimeString());
      toast({
        title: "Entrada registrada",
        description: `Entrada a las ${new Date(entry.entryTime).toLocaleTimeString()}`,
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

  const handleClockOut = async () => {
    if (!currentEntry) return;

    setLoading(true);
    try {
      await clockOut(currentEntry.id);
      setCurrentEntry(null);
      setEntryTime("");
      toast({
        title: "Salida registrada",
        description: `Salida a las ${new Date().toLocaleTimeString()}`,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${currentEntry ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
          {currentEntry ? "En el Taller" : "Fuera del Taller"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentEntry && (
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
            <p className="text-sm text-green-600 dark:text-green-400 mb-2">
              Entrada registrada
            </p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {entryTime}
            </p>
            {currentEntry.project && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Proyecto: {currentEntry.project.title}
              </p>
            )}
          </div>
        )}

        {!currentEntry ? (
          <Button
            onClick={handleClockIn}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Registrar Entrada
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleClockOut}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Registrar Salida
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
