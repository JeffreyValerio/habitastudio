import Link from "next/link";
import { Eyebrow } from "./eyebrow";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  linkLabel?: string;
  linkHref?: string;
  className?: string;
  as?: "h1" | "h2";
}

export function SectionHeader({
  eyebrow,
  title,
  linkLabel,
  linkHref,
  className,
  as: Heading = "h2",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-8 gap-y-4",
        className
      )}
    >
      <div className="flex flex-col gap-3">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading className="font-display text-[32px] font-medium leading-[1.1] text-hs-text md:text-[46px]">
          {title}
        </Heading>
      </div>
      {linkLabel && linkHref && (
        <Link
          href={linkHref}
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-hs-accent underline underline-offset-4 hover:text-hs-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent"
        >
          {linkLabel} <span aria-hidden="true">&nbsp;→</span>
        </Link>
      )}
    </div>
  );
}
