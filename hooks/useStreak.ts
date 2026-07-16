import { useMemo } from 'react';
import { Expense } from '@/types';

interface StreakResult {
  currentStreak: number;   // consecutive days logged
  longestStreak: number;
  loggedDays: Set<string>; // "YYYY-MM-DD" set for rendering week dots
}

export function useStreak(expenses: Expense[]): StreakResult {
  return useMemo(() => {
    if (expenses.length === 0) {
      return { currentStreak: 0, longestStreak: 0, loggedDays: new Set() };
    }

    const loggedDays = new Set(expenses.map((e) => e.date));
    const sorted = Array.from(loggedDays).sort().reverse(); // most recent first

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;

    const today = toDateString(new Date());
    const yesterday = toDateString(addDays(new Date(), -1));

    // Current streak — must start from today or yesterday
    if (sorted[0] === today || sorted[0] === yesterday) {
      let cursor = new Date(sorted[0]);
      for (const day of sorted) {
        if (day === toDateString(cursor)) {
          streak++;
          cursor = addDays(cursor, -1);
        } else {
          break;
        }
      }
      currentStreak = streak;
    }

    // Longest streak — scan all logged days
    streak = 0;
    const ascending = Array.from(loggedDays).sort();
    let prev: string | null = null;
    for (const day of ascending) {
      if (prev && dayDiff(day, prev) === 1) {
        streak++;
      } else {
        streak = 1;
      }
      longestStreak = Math.max(longestStreak, streak);
      prev = day;
    }

    return { currentStreak, longestStreak, loggedDays };
  }, [expenses]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function dayDiff(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}