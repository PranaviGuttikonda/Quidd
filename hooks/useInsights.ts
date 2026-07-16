import { useMemo } from 'react';
import { Expense, Category, CategoryBreakdown, MonthlyInsight } from '@/types';

export function useInsights(expenses: Expense[]): MonthlyInsight {
  return useMemo(() => {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Tally by category
    const tally: Partial<Record<Category, number>> = {};
    for (const e of expenses) {
      tally[e.category] = (tally[e.category] ?? 0) + e.amount;
    }

    const breakdown: CategoryBreakdown[] = Object.entries(tally).map(
      ([cat, amount]) => ({
        category: cat as Category,
        amount: amount as number,
        percentage: totalSpent > 0 ? ((amount as number) / totalSpent) * 100 : 0,
      })
    ).sort((a, b) => b.amount - a.amount);

    const topCategory = breakdown[0]?.category ?? null;

    const month = expenses[0]?.date?.slice(0, 7) ?? '';

    return { month, totalSpent, breakdown, topCategory };
  }, [expenses]);
}

// ─── Monthly trend (for bar chart) ───────────────────────────────────────────

export function useMonthlyTrend(
  expenses: Expense[],
  numMonths = 6
): { month: string; total: number }[] {
  return useMemo(() => {
    const now = new Date();
    const months: { month: string; total: number }[] = [];

    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const total = expenses
        .filter((e) => e.date.startsWith(month))
        .reduce((sum, e) => sum + e.amount, 0);
      months.push({ month, total });
    }

    return months;
  }, [expenses, numMonths]);
}