"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Product } from "@/lib/data/products";
import { ProductCard } from "@/components/site/product-card";
import { FilterChips } from "@/components/site/filter-chips";
import { SiteButton } from "@/components/site/site-button";
import { buildCategories, normalizeCategory } from "@/lib/catalog-categories";

type Sort = "destacados" | "precio-asc" | "precio-desc";

function priceValue(price: string | null | undefined): number | null {
  if (!price) return null;
  const digits = price.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return n > 0 ? n : null;
}

export function CatalogContent({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = (searchParams.get("categoria") || "todos").trim().toLowerCase();
  const categories = useMemo(
    () => buildCategories(initialProducts.map((p) => p.category)),
    [initialProducts],
  );
  const chips = useMemo(() => [{ value: "todos", label: "Todos" }, ...categories], [categories]);
  const category = categories.some((c) => c.value === raw) ? raw : "todos";
  const [sort, setSort] = useState<Sort>("destacados");

  const products = useMemo(() => {
    let list =
      category === "todos"
        ? [...initialProducts]
        : initialProducts.filter((p) => normalizeCategory(p.category) === category);

    if (sort !== "destacados") {
      const dir = sort === "precio-asc" ? 1 : -1;
      list = list
        .map((p, i) => ({ p, i, v: priceValue(p.price) }))
        .sort((a, b) => {
          if (a.v === null && b.v === null) return a.i - b.i;
          if (a.v === null) return 1;
          if (b.v === null) return -1;
          return (a.v - b.v) * dir || a.i - b.i;
        })
        .map((x) => x.p);
    }
    return list;
  }, [initialProducts, category, sort]);

  const handleCategory = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "todos") params.delete("categoria");
    else params.set("categoria", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const count = products.length;

  return (
    <>
      <div className="mt-5 flex flex-col md:mt-8 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-6 md:gap-y-4 md:border-y md:border-hs-border md:py-4">
        {categories.length > 1 && (
          <FilterChips
            chips={chips}
            value={category}
            onChange={handleCategory}
            className="-mx-4 scroll-px-4 border-y border-hs-border px-4 py-2 md:mx-0 md:border-0 md:p-0"
          />
        )}
        <div className="flex items-center justify-between gap-3 py-2 md:justify-start md:gap-4 md:py-0">
          <span className="text-[13px] text-hs-muted md:text-sm" aria-live="polite">
            {count} {count === 1 ? "producto" : "productos"}
          </span>
          <label htmlFor="catalog-sort" className="sr-only md:not-sr-only md:text-sm md:text-hs-muted">
            Ordenar
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="min-h-[44px] border border-hs-input bg-white px-3 font-sans text-sm text-hs-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent"
          >
            <option value="destacados">Destacados</option>
            <option value="precio-asc">Precio ↑</option>
            <option value="precio-desc">Precio ↓</option>
          </select>
        </div>
      </div>

      {count > 0 ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 md:mt-8 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-x-6 md:gap-y-10">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                category={p.category}
                image={p.image}
                dimensions={p.specifications?.dimensions}
                material={p.specifications?.material}
                price={p.price}
              />
            ))}
          </div>
          <p className="mt-8 text-[13px] text-hs-muted">
            Precios de referencia. Confirma el precio final en tu cotización.
          </p>
        </>
      ) : (
        <div className="flex flex-col items-start gap-4 py-16">
          <p className="text-base text-hs-text2">
            No hay productos en esta categoría por ahora.
          </p>
          <SiteButton variant="secondary" onClick={() => handleCategory("todos")}>
            Ver todos
          </SiteButton>
        </div>
      )}
    </>
  );
}
