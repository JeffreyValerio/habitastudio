export const WORK_ORDER_TYPES = [
  { value: "corte", label: "Corte" },
  { value: "encintado", label: "Encintado" },
  { value: "instalacion", label: "Instalación" },
  { value: "armado", label: "Armado" },
] as const;

export type WorkOrderType = (typeof WORK_ORDER_TYPES)[number]["value"];

export const WORK_ORDER_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  WORK_ORDER_TYPES.map((t) => [t.value, t.label])
);

export const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En Progreso",
  completed: "Completada",
};

export const EXPENSE_CATEGORIES = [
  { value: "materiales", label: "Materiales" },
  { value: "transporte", label: "Transporte / Envío" },
  { value: "viaticos", label: "Viáticos" },
  { value: "mano_obra_externa", label: "Mano de Obra Externa" },
  { value: "otros", label: "Otros" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label])
);
