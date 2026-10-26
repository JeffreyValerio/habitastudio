// Shared (client-safe) helpers for catalog categories.
// The URL value (?categoria=) is the lowercase, trimmed category name.

const KNOWN_LABELS: Record<string, string> = {
  salas: "Salas",
  comedores: "Comedores",
  dormitorios: "Dormitorios",
};
const KNOWN_ORDER = ["salas", "comedores", "dormitorios"];

export interface CatalogCategory {
  value: string;
  label: string;
}

export function normalizeCategory(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase();
}

export function categoryLabel(value: string): string {
  const v = normalizeCategory(value);
  if (KNOWN_LABELS[v]) return KNOWN_LABELS[v];
  return v.charAt(0).toUpperCase() + v.slice(1);
}

/** Unique categories (case-insensitive) in known order, then alphabetical. */
export function buildCategories(names: Array<string | null | undefined>): CatalogCategory[] {
  const values = Array.from(new Set(names.map(normalizeCategory).filter(Boolean)));
  const rank = (v: string) => {
    const i = KNOWN_ORDER.indexOf(v);
    return i === -1 ? KNOWN_ORDER.length : i;
  };
  values.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "es"));
  return values.map((value) => ({ value, label: categoryLabel(value) }));
}

export function categoryHref(value: string): string {
  return `/catalogo?categoria=${encodeURIComponent(value)}`;
}
