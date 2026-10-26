"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface FilterChip {
  value: string;
  label: string;
}

export function FilterChips({
  chips,
  value,
  onChange,
  label = "Filtrar por categoría",
  className,
}: {
  chips: FilterChip[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = ref.current;
    const el = box?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!box || !el || box.scrollWidth <= box.clientWidth) return;
    // Scroll only the chips strip horizontally (never the page).
    const left = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
    box.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [value]);

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cn(
        "flex snap-x flex-nowrap gap-2 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:snap-none md:flex-wrap md:gap-3 md:overflow-visible md:whitespace-normal",
        className
      )}
    >
      {chips.map((chip) => {
        const active = chip.value === value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip.value)}
            className={cn(
              "inline-flex min-h-[44px] shrink-0 snap-start items-center justify-center border px-3.5 font-sans text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent md:shrink md:px-5",
              active
                ? "border-hs-text bg-hs-text text-white"
                : "border-hs-input bg-white text-hs-text hover:border-hs-text"
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
