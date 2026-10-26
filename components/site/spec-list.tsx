import { cn } from "@/lib/utils";

export interface SpecRow {
  label: string;
  value?: string | null;
}

export function SpecList({
  rows,
  className,
}: {
  rows: SpecRow[];
  className?: string;
}) {
  const visible = rows.filter((r) => r.value && r.value.trim() !== "");
  if (visible.length === 0) return null;
  return (
    <dl className={cn("flex flex-col border-t border-hs-rule", className)}>
      {visible.map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-4 border-b border-hs-rule py-3 text-[15px]"
        >
          <dt className="text-hs-muted">{row.label}</dt>
          <dd className="text-right text-hs-text">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
