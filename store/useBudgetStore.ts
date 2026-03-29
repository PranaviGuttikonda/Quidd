import { create } from 'zustand';
import { Budget, Category, BudgetWithSpend, Expense } from '@/types';
import {
  fetchBudgets,
  upsertBudget as dbUpsert,
  currentMonth,
} from '@/lib/supabase';

interface BudgetState {
  budgets: Budget[];
  month: string;
  loading: boolean;
  error: string | null;

  fetchForMonth: (userId: string, month?: string) => Promise<void>;
  upsertBudget: (budget: Omit<Budget, 'id' | 'created_at'>) => Promise<void>;

  // Derived — pass in expenses to compute spend
  getBudgetsWithSpend: (expenses: Expense[]) => BudgetWithSpend[];
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  month: currentMonth(),
  loading: false,
  error: null,

  fetchForMonth: async (userId, month) => {
    const m = month ?? currentMonth();
    set({ loading: true, error: null, month: m });
    try {
      const budgets = await fetchBudgets(userId, m);
      set({ budgets, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  upsertBudget: async (budget) => {
    const updated = await dbUpsert(budget);
    set((s) => {
      const exists = s.budgets.find(
        (b) => b.category === budget.category && b.month === budget.month
      );
      if (exists) {
        return { budgets: s.budgets.map((b) => (b.id === updated.id ? updated : b)) };
      }
      return { budgets: [...s.budgets, updated] };
    });
  },

  getBudgetsWithSpend: (expenses) => {
    const { budgets } = get();
    return budgets.map((b) => {
      const spent = expenses
        .filter((e) => e.category === b.category)
        .reduce((sum, e) => sum + e.amount, 0);
      const remaining = b.amount - spent;
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return {
        ...b,
        spent,
        remaining,
        percentage,
        isOverBudget: spent > b.amount,
      };
    });
  },
}));