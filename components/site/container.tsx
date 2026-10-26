import { cn } from "@/lib/utils";

export function Container({
  className,
  as: Tag = "div",
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return (
    <Tag
      className={cn("mx-auto w-full max-w-[1280px] px-4 md:px-8", className)}
      {...props}
    />
  );
}
