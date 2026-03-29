import { create } from 'zustand';
import { Expense, Category } from '@/types';
import {
  fetchExpensesByMonth,
  addExpense as dbAdd,
  updateExpense as dbUpdate,
  deleteExpense as dbDelete,
  currentMonth,
} from '@/lib/supabase';

interface ExpenseState {
  expenses: Expense[];
  month: string;
  loading: boolean;
  error: string | null;

  fetchForMonth: (userId: string, month?: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Derived
  totalSpent: () => number;
  spentByCategory: () => Record<Category, number>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  month: currentMonth(),
  loading: false,
  error: null,

  fetchForMonth: async (userId, month) => {
    const m = month ?? currentMonth();
    set({ loading: true, error: null, month: m });
    try {
      const expenses = await fetchExpensesByMonth(userId, m);
      set({ expenses, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  addExpense: async (expense) => {
    const newExpense = await dbAdd(expense);
    set((s) => ({ expenses: [newExpense, ...s.expenses] }));
    return newExpense;
  },

  updateExpense: async (id, updates) => {
    const updated = await dbUpdate(id, updates);
    set((s) => ({
      expenses: s.expenses.map((e) => (e.id === id ? updated : e)),
    }));
  },

  deleteExpense: async (id) => {
    await dbDelete(id);
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
  },

  totalSpent: () =>
    get().expenses.reduce((sum, e) => sum + e.amount, 0),

  spentByCategory: () => {
    const result = {} as Record<Category, number>;
    for (const e of get().expenses) {
      result[e.category] = (result[e.category] ?? 0) + e.amount;
    }
    return result;
  },
}));