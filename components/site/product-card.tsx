import Link from "next/link";
import Image from "next/image";
import { ImagePlaceholder } from "./image-placeholder";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  slug: string;
  name: string;
  category?: string;
  image?: string | null;
  dimensions?: string;
  material?: string;
  price?: string | null;
  featured?: boolean;
  className?: string;
  sizes?: string;
}

export function ProductCard({
  slug,
  name,
  category,
  image,
  dimensions,
  material,
  price,
  featured = false,
  className,
  sizes = "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw",
}: ProductCardProps) {
  const meta = [dimensions, material].filter(Boolean).join(" · ");
  const hasPrice = !!price && price.trim() !== "" && !/^\D*0+\D*$/.test(price);

  return (
    <Link
      href={`/catalogo/${slug}`}
      className={cn(
        "group flex flex-col gap-4 text-hs-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hs-accent",
        featured && "border border-hs-border bg-white",
        className
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-hs-placeholder">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <ImagePlaceholder alt={false} />
        )}
      </div>
      <div
        className={cn(
          "flex flex-col gap-1",
          featured && "px-5 pb-[22px]"
        )}
      >
        {category && (
          <span className="text-xs uppercase tracking-[0.1em] text-hs-muted">
            {category}
          </span>
        )}
        <span className="text-lg font-medium group-hover:underline underline-offset-4">
          {name}
        </span>
        {meta && <span className="text-sm text-hs-muted">{meta}</span>}
        {hasPrice && (
          <span className="pt-2 text-base font-semibold text-hs-accent">
            Desde {price}
          </span>
        )}
      </div>
    </Link>
  );
}
