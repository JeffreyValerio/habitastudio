import { cn } from "@/lib/utils";

export function TestimonialCard({
  quote,
  name,
  role,
  className,
}: {
  quote: string;
  name: string;
  role?: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "m-0 flex flex-col justify-between gap-4 border border-hs-border bg-white p-6 md:gap-7 md:p-9",
        className
      )}
    >
      <blockquote className="font-display text-xl leading-[1.35] text-hs-text md:text-[23px]">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="flex flex-col text-sm">
        <span className="font-semibold">{name}</span>
        {role && <span className="text-hs-muted">{role}</span>}
      </figcaption>
    </figure>
  );
}
