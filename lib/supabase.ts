import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { Expense, Budget, UserProfile } from '@/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    };
  }
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function fetchExpensesByMonth(
  userId: string,
  month: string
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .gte('date', `${month}-01`)
    .lte('date', `${month}-31`)
    .order('date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addExpense(
  expense: Omit<Expense, 'id' | 'created_at'>
): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExpense(
  id: string,
  updates: Partial<Expense>
): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export async function fetchBudgets(
  userId: string,
  month: string
): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month);
  if (error) throw error;
  return data ?? [];
}

export async function upsertBudget(
  budget: Omit<Budget, 'id' | 'created_at'>
): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .upsert(budget, { onConflict: 'user_id,category,month' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}