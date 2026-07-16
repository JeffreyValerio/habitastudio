"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

export function AiSuggestButton({
  field,
  body,
  disabled,
  label = "Mejorar con IA",
  onResult,
}: {
  field: "name" | "description" | "features";
  body: Record<string, string | undefined>;
  disabled?: boolean;
  label?: string;
  onResult: (value: string) => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/product-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, ...body }),
      });
      const data = await res.json();
      if (data.result) {
        onResult(data.result);
      } else {
        toast({
          title: "Error",
          description: data.error || "No se pudo generar la sugerencia",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Error al conectar con IA", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={run}
      disabled={loading || disabled}
      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {loading ? "Generando..." : label}
    </Button>
  );
}
