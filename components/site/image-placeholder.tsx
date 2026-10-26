import { cn } from "@/lib/utils";

export function ImagePlaceholder({
  label,
  className,
  alt = true,
}: {
  label?: string;
  className?: string;
  alt?: boolean;
}) {
  return (
    <div
      className={cn("relative h-full w-full bg-hs-placeholder", className)}
      role={alt && label ? "img" : undefined}
      aria-label={alt && label ? label : undefined}
      aria-hidden={alt && label ? undefined : true}
    >
      {label && (
        <span className="absolute bottom-3 left-3 bg-hs-bg/95 px-2.5 py-1 text-xs text-hs-text2">
          {label}
        </span>
      )}
    </div>
  );
}
