export const MATERIAL_UNITS = [
  { value: "unidad", label: "Unidad" },
  { value: "m2", label: "Metro cuadrado (m²)" },
  { value: "ml", label: "Metro lineal (ml)" },
  { value: "kg", label: "Kilogramo (kg)" },
] as const;

export const MATERIAL_UNIT_LABELS: Record<string, string> = Object.fromEntries(
  MATERIAL_UNITS.map((u) => [u.value, u.label])
);
