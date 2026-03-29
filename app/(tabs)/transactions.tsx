import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import FloatingBlobs from '@/components/FloatingBlobs';
import ExpenseCard from '@/components/ExpenseCard';
import CategoryPill from '@/components/CategoryPill';
import { useIsDark } from '@/hooks/useTheme';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CATEGORIES, Category, CATEGORY_LABELS, Expense } from '@/types';
import { warningHaptic } from '@/lib/haptics';

type FilterCategory = Category | 'all';

function groupByMonth(expenses: Expense[]): { month: string; items: Expense[] }[] {
  const groups: Record<string, Expense[]> = {};
  for (const e of expenses) {
    const month = e.date.slice(0, 7);
    if (!groups[month]) groups[month] = [];
    groups[month].push(e);
  }
  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, items]) => ({ month, items }));
}

function formatMonthLabel(ym: string): string {
  return new Date(ym + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function TransactionsScreen() {
  const isDark = useIsDark();
  const { session } = useAuthStore();
  const { expenses, loading, deleteExpense } = useExpenseStore();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchCat = activeCategory === 'all' || e.category === activeCategory;
      const matchQuery = query.trim() === '' || e.description.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [expenses, query, activeCategory]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);

  const handleDelete = (id: string, description: string) => {
    Alert.alert(
      'Delete expense',
      `Remove "${description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            warningHaptic();
            await deleteExpense(id);
          },
        },
      ]
    );
  };

  // ─── Theme ────────────────────────────────────────────────────────────────
  const bg = isDark ? '#0a0a1a' : '#fff8f0';
  const cardBg = isDark ? '#13132b' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)';
  const textPrimary = isDark ? '#f0f0ff' : '#1a0800';
  const textMuted = isDark ? '#55557a' : '#c09070';
  const inputBg = isDark ? '#1e1e40' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.12)';
  const accent = isDark ? '#ff6ec7' : '#ff6b6b';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <FloatingBlobs variant={isDark ? 'dark' : 'light'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textPrimary }]}>History</Text>
          <Text style={[styles.count, { color: textMuted }]}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
          <Ionicons name="search" size={16} color={textMuted} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search transactions..."
            placeholderTextColor={textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={textMuted} />
            </Pressable>
          )}
        </View>

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {/* All chip */}
          <Pressable
            onPress={() => setActiveCategory('all')}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeCategory === 'all' ? accent : inputBg,
                borderColor: activeCategory === 'all' ? accent : inputBorder,
              },
            ]}
          >
            <Text style={[styles.filterChipText, { color: activeCategory === 'all' ? '#fff' : textMuted }]}>
              All
            </Text>
          </Pressable>

          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(isActive ? 'all' : cat)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? accent : inputBg,
                    borderColor: isActive ? accent : inputBorder,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: isActive ? '#fff' : textMuted }]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Results */}
        {loading ? (
          <ActivityIndicator color={accent} style={{ marginTop: 40 }} />
        ) : grouped.length === 0 ? (
          <View style={[styles.empty, { borderColor: cardBorder }]}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyText, { color: textMuted }]}>
              {query || activeCategory !== 'all' ? 'No matches found' : 'No transactions yet'}
            </Text>
            {!query && activeCategory === 'all' && (
              <Pressable onPress={() => router.push('/(tabs)/add')}>
                <Text style={[styles.emptyAction, { color: accent }]}>Log your first expense →</Text>
              </Pressable>
            )}
          </View>
        ) : (
          grouped.map(({ month, items }) => (
            <View key={month} style={styles.monthGroup}>
              <View style={styles.monthHeader}>
                <Text style={[styles.monthLabel, { color: textPrimary }]}>
                  {formatMonthLabel(month)}
                </Text>
                <Text style={[styles.monthTotal, { color: accent }]}>
                  ₹{items.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
                </Text>
              </View>
              {items.map((expense, i) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  index={i}
                  currency="₹"
                  onPress={() =>
                    Alert.alert(
                      expense.description,
                      `Amount: ₹${expense.amount}\nDate: ${expense.date}${expense.note ? `\nNote: ${expense.note}` : ''}`,
                      [
                        { text: 'Close', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(expense.id, expense.description) },
                      ]
                    )
                  }
                />
              ))}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  count: { fontSize: 13, fontWeight: '500' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterScroll: { marginBottom: 20 },
  filterRow: { gap: 8, paddingRight: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '500' },
  monthGroup: { marginBottom: 24 },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthLabel: { fontSize: 16, fontWeight: '600' },
  monthTotal: { fontSize: 14, fontWeight: '700' },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 4 },
  emptyText: { fontSize: 14, fontWeight: '500' },
  emptyAction: { fontSize: 13, fontWeight: '600' },
});