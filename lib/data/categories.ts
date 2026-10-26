import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { buildCategories, type CatalogCategory } from "@/lib/catalog-categories";

// Products have no visibility flag: every product is public, so a category
// is shown iff it has at least one product.
const fetchCategories = unstable_cache(
  async (): Promise<CatalogCategory[]> => {
    const rows = await prisma.category.findMany({
      where: { products: { some: {} } },
      select: { name: true },
    });
    return buildCategories(rows.map((r) => r.name));
  },
  ["public-product-categories"],
  { revalidate: 300 },
);

/** Categories that have at least one product. Never throws (empty on failure). */
export async function getPublicCategories(): Promise<CatalogCategory[]> {
  try {
    return await fetchCategories();
  } catch {
    return [];
  }
}
