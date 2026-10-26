export interface ServiceGroupDef {
  key: "mobiliario" | "remodelaciones" | "diseno";
  title: string;
  intro: string;
  /** Normalized (lowercase, no accents) substrings matched against slug + title. */
  keywords: string[];
}

export const SERVICE_GROUPS: ServiceGroupDef[] = [
  {
    key: "mobiliario",
    title: "Mobiliario a medida",
    intro: "Piezas diseñadas y fabricadas para tu espacio exacto.",
    keywords: ["mueble", "closet", "armario", "vestidor", "ebanist", "carpinter", "mobiliario"],
  },
  {
    key: "remodelaciones",
    title: "Remodelaciones",
    intro: "Transformamos tu hogar o negocio con remodelaciones completas.",
    keywords: [
      "cocina", "bano", "piso", "laminado", "vinil", "cielo", "drywall", "gypsum",
      "pintura", "acabado", "iluminacion", "remodel",
    ],
  },
  {
    key: "diseno",
    title: "Diseño y otros servicios",
    intro: "Asesoría para planear el espacio y servicios complementarios.",
    keywords: [],
  },
];

export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Returns the index in SERVICE_GROUPS; unmatched services fall into the last group. */
export function groupIndexForService(service: { slug: string; title: string }): number {
  const text = ` ${normalizeText(`${service.slug} ${service.title}`).replace(/[^a-z0-9]+/g, " ")} `;
  for (let i = 0; i < SERVICE_GROUPS.length - 1; i++) {
    if (SERVICE_GROUPS[i].keywords.some((k) => text.includes(k))) return i;
    if (i === 1 && /\sled\s/.test(text)) return i;
  }
  return SERVICE_GROUPS.length - 1;
}

export function groupServices<T extends { slug: string; title: string }>(services: T[]) {
  const buckets: T[][] = SERVICE_GROUPS.map(() => []);
  for (const s of services) buckets[groupIndexForService(s)].push(s);
  return SERVICE_GROUPS.map((g, i) => ({ ...g, services: buckets[i] })).filter(
    (g) => g.services.length > 0
  );
}
