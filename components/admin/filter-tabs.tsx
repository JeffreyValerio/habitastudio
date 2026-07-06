"use client";

import { cn } from "@/lib/utils";

export interface FilterTab {
  key: string;
  label: string;
  count: number;
}

// Barra de tabs con contador, para filtrar listas por categoría/estado.
// Se usa arriba de las tablas/listas (mobile y desktop comparten el filtro).
export function FilterTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: FilterTab[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b px-1">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "text-xs rounded-full px-1.5 py-0.5 leading-none",
                isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
