interface CostTimeEntry {
  entryTime: Date;
  exitTime: Date | null;
  user: { hourlyRate: number | null };
}

export function calculateLaborCost(timeEntries: CostTimeEntry[]): number {
  return timeEntries.reduce((sum, entry) => {
    if (!entry.exitTime) return sum;
    const hours =
      (new Date(entry.exitTime).getTime() - new Date(entry.entryTime).getTime()) / (1000 * 60 * 60);
    return sum + hours * (entry.user.hourlyRate || 0);
  }, 0);
}

export function calculateExpensesCost(expenses: { amount: number }[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}
