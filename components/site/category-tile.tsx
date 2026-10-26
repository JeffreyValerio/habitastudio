import Link from "next/link";
import Image from "next/image";
import { ImagePlaceholder } from "./image-placeholder";

export function CategoryTile({
  name,
  href,
  image,
  alt = "",
  tone = "default",
}: {
  name: string;
  href: string;
  image?: string | null;
  alt?: string;
  tone?: "default" | "alt";
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3.5 text-hs-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hs-accent"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-hs-placeholder md:aspect-[3/4]">
        {image ? (
          <Image
            src={image}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <ImagePlaceholder
            alt={false}
            className={tone === "alt" ? "bg-hs-placeholderAlt" : undefined}
          />
        )}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-medium md:text-lg">{name}</span>
        <span className="text-sm text-hs-muted" aria-hidden="true">
          Ver →
        </span>
      </div>
    </Link>
  );
}
