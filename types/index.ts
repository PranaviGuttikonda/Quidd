// ─── Categories ───────────────────────────────────────────────────────────────

export type Category =
  | 'food'
  | 'travel'
  | 'shopping'
  | 'health'
  | 'entertainment'
  | 'bills'
  | 'savings'
  | 'other';

export const CATEGORIES: Category[] = [
  'food', 'travel', 'shopping', 'health',
  'entertainment', 'bills', 'savings', 'other',
];

export const CATEGORY_LABELS: Record<Category, string> = {
  food:          'Food',
  travel:        'Travel',
  shopping:      'Shopping',
  health:        'Health',
  entertainment: 'Entertainment',
  bills:         'Bills',
  savings:       'Savings',
  other:         'Other',
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  food:          '🍕',
  travel:        '🚌',
  shopping:      '🛍️',
  health:        '💊',
  entertainment: '🎬',
  bills:         '🧾',
  savings:       '💰',
  other:         '📦',
};

// ─── Mood (optional per-expense tag) ─────────────────────────────────────────
// Kept in types for DB compatibility — just not shown in UI per design decision

export type Mood = 'necessary' | 'impulse' | 'regret' | 'happy';

// ─── Core models ──────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: Category;
  description: string;
  note?: string | null;
  date: string;           // "YYYY-MM-DD"
  mood?: Mood | null;
  recurring: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: Category;
  month: string;          // "YYYY-MM"
  amount: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  currency: string;       // default "INR"
  created_at: string;
}

// ─── Derived / computed types ─────────────────────────────────────────────────

export interface CategoryBreakdown {
  category: Category;
  amount: number;
  percentage: number;
}

export interface MonthlyInsight {
  month: string;          // "YYYY-MM"
  totalSpent: number;
  breakdown: CategoryBreakdown[];
  topCategory: Category | null;
}

export interface BudgetWithSpend extends Budget {
  spent: number;          // computed from expenses
  remaining: number;      // budget.amount - spent
  percentage: number;     // spent / amount * 100
  isOverBudget: boolean;
}

// ─── AI response types ────────────────────────────────────────────────────────

export interface ParsedExpenseResult {
  amount: number;
  category: Category;
  description: string;
  note?: string;
}

export interface MonthlySummaryResult {
  summary: string;
  savingsTip: string;
  topInsight: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type TabRoute = 'index' | 'add' | 'transactions' | 'budgets' | 'insights' | 'settings';