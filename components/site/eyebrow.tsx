import { cn } from "@/lib/utils";

export function Eyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "block font-sans text-xs font-semibold uppercase tracking-[0.14em] text-hs-accent",
        className
      )}
      {...props}
    />
  );
}
