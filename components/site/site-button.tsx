import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const siteButtonVariants = cva(
  "inline-flex min-h-[48px] items-center justify-center whitespace-nowrap px-7 font-sans text-[15px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-hs-accent text-white hover:bg-hs-accentHover",
        secondary:
          "border border-hs-text text-hs-text hover:bg-hs-text hover:text-hs-onDark",
        onDark: "bg-hs-onDark text-hs-text hover:bg-white",
        onDarkOutline:
          "border border-hs-onDark text-hs-onDark hover:bg-hs-onDark hover:text-hs-text focus-visible:outline-hs-onDark",
      },
    },
    defaultVariants: { variant: "primary" },
  }
);

type Variants = VariantProps<typeof siteButtonVariants>;

export function SiteButton({
  className,
  variant,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & Variants) {
  return (
    <button
      type={type}
      className={cn(siteButtonVariants({ variant }), className)}
      {...props}
    />
  );
}

export function SiteButtonLink({
  className,
  variant,
  href,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> & Variants & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(siteButtonVariants({ variant }), className)}
      {...props}
    />
  );
}
