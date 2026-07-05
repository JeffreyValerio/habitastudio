import { getEffectiveRatesBatch } from "@/app/actions/collaborator-rates";

interface CostTimeEntry {
  entryDate: Date;
  entryTime: Date;
  exitTime: Date | null;
  user: { id: string; hourlyRate: number | null };
}

// La tarifa puede variar mes a mes, así que cada hora se costea con la tarifa
// vigente en el mes de esa entrada, no con la tarifa actual del colaborador.
export async function calculateLaborCost(timeEntries: CostTimeEntry[]): Promise<number> {
  const completed = timeEntries.filter((e) => e.exitTime);
  if (completed.length === 0) return 0;

  const periods = new Map<string, { userId: string; year: number; month: number }>();
  completed.forEach((entry) => {
    const d = new Date(entry.entryDate);
    const key = `${entry.user.id}-${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!periods.has(key)) {
      periods.set(key, { userId: entry.user.id, year: d.getFullYear(), month: d.getMonth() + 1 });
    }
  });

  const rates = await getEffectiveRatesBatch(Array.from(periods.values()));

  return completed.reduce((sum, entry) => {
    const hours =
      (new Date(entry.exitTime!).getTime() - new Date(entry.entryTime).getTime()) / (1000 * 60 * 60);
    const d = new Date(entry.entryDate);
    const key = `${entry.user.id}-${d.getFullYear()}-${d.getMonth() + 1}`;
    const rate = rates[key] ?? entry.user.hourlyRate ?? 0;
    return sum + hours * rate;
  }, 0);
}

export function calculateExpensesCost(expenses: { amount: number }[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}
