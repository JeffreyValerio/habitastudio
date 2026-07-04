"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, ChevronDown } from "lucide-react";
import { formatCRC } from "@/lib/utils";

interface QuoteTemplate {
  id: string;
  quoteNumber: string;
  clientName: string;
  projectName: string;
  total: number;
  items: any[];
  tax: number;
  discount: number;
  notes?: string | null;
}

interface QuoteTemplateSelectorProps {
  templates: QuoteTemplate[];
  onSelectTemplate: (template: QuoteTemplate) => void;
}

export function QuoteTemplateSelector({
  templates,
  onSelectTemplate,
}: QuoteTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (templates.length === 0) return null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <Copy className="h-4 w-4" />
          Copiar desde cotización anterior
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 border rounded-md bg-background shadow-md p-2 space-y-2 max-h-80 overflow-y-auto">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="p-3 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => {
                onSelectTemplate(template);
                setIsOpen(false);
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">
                    #{template.quoteNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {template.clientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {template.projectName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">
                    {formatCRC(template.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {template.items.length} items
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
