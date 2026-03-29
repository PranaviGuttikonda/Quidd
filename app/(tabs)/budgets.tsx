import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FloatingBlobs from '@/components/FloatingBlobs';
import BudgetBar from '@/components/BudgetBar';
import Quiddy from '@/components/Quiddy';
import { useIsDark } from '@/hooks/useTheme';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CATEGORIES, Category, CATEGORY_EMOJI, CATEGORY_LABELS } from '@/types';
import { suggestBudgets } from '@/lib/gemini';
import { confirmHaptic, tapHaptic } from '@/lib/haptics';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function BudgetsScreen() {
  const isDark = useIsDark();
  const { session } = useAuthStore();
  const { expenses } = useExpenseStore();
  const { budgets, loading, fetchForMonth, upsertBudget, getBudgetsWithSpend } = useBudgetStore();

  const [month] = useState(currentMonth());
  const [modalVisible, setModalVisible] = useState(false);
  const [editCategory, setEditCategory] = useState<Category>('food');
  const [editAmount, setEditAmount] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) fetchForMonth(userId, month);
  }, [userId, month]);

  const budgetsWithSpend = getBudgetsWithSpend(expenses);
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const healthPct = Math.max(0, 100 - overallPct);

  const openEdit = (cat: Category) => {
    const existing = budgets.find((b) => b.category === cat);
    setEditCategory(cat);
    setEditAmount(existing ? String(existing.amount) : '');
    setModalVisible(true);
    tapHaptic();
  };

  const handleSave = async () => {
    if (!userId || !editAmount) return;
    await upsertBudget({
      user_id: userId,
      category: editCategory,
      month,
      amount: parseFloat(editAmount),
    });
    confirmHaptic();
    setModalVisible(false);
  };

  const handleAISuggest = async () => {
    setAiLoading(true);
    try {
      const avgSpending: Record<string, number> = {};
      for (const e of expenses) {
        avgSpending[e.category] = (avgSpending[e.category] ?? 0) + e.amount;
      }
      const suggestions = await suggestBudgets(avgSpending);
      for (const [cat, amount] of Object.entries(suggestions)) {
        if (!userId) continue;
        await upsertBudget({
          user_id: userId,
          category: cat as Category,
          month,
          amount,
        });
      }
      confirmHaptic();
    } catch {
      Alert.alert('Error', 'Could not get AI suggestions. Try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Theme ────────────────────────────────────────────────────────────────
  const bg = isDark ? '#0a0a1a' : '#fff8f0';
  const cardBg = isDark ? '#13132b' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)';
  const textPrimary = isDark ? '#f0f0ff' : '#1a0800';
  const textMuted = isDark ? '#55557a' : '#c09070';
  const inputBg = isDark ? '#1e1e40' : '#fff8f0';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.12)';
  const accent = isDark ? '#ff6ec7' : '#ff6b6b';
  const purple = isDark ? '#c77dff' : '#cc5de8';

  const monthLabel = new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <FloatingBlobs variant={isDark ? 'dark' : 'light'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>Budgets</Text>
            <Text style={[styles.subtitle, { color: textMuted }]}>{monthLabel}</Text>
          </View>
          <Quiddy healthPct={healthPct} size="md" showBar showMessage={false} />
        </View>

        {/* Summary card */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: textMuted }]}>Budgeted</Text>
              <Text style={[styles.summaryValue, { color: textPrimary }]}>
                ₹{totalBudgeted.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,100,0,0.08)' }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: textMuted }]}>Spent</Text>
              <Text style={[styles.summaryValue, { color: overallPct > 100 ? (isDark ? '#ff5c7a' : '#ff4d4d') : accent }]}>
                ₹{totalSpent.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,100,0,0.08)' }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: textMuted }]}>Left</Text>
              <Text style={[styles.summaryValue, { color: isDark ? '#6bff9e' : '#166534' }]}>
                ₹{Math.max(0, totalBudgeted - totalSpent).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* AI suggest button */}
        <Pressable
          onPress={handleAISuggest}
          disabled={aiLoading}
          style={[styles.aiBtn, { backgroundColor: isDark ? 'rgba(199,125,255,0.15)' : '#f5eaff', borderColor: isDark ? 'rgba(199,125,255,0.4)' : '#d4a0ff' }]}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color={purple} />
          ) : (
            <Ionicons name="sparkles" size={15} color={purple} />
          )}
          <Text style={[styles.aiBtnText, { color: purple }]}>
            {aiLoading ? 'Thinking...' : 'Auto-suggest budgets with AI'}
          </Text>
        </Pressable>

        {/* Budget bars */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>By category</Text>

          {loading ? (
            <ActivityIndicator color={accent} style={{ marginTop: 20 }} />
          ) : (
            <>
              {budgetsWithSpend.map((b, i) => (
                <BudgetBar
                  key={b.id}
                  budget={b}
                  index={i}
                  currency="₹"
                  onPress={() => openEdit(b.category)}
                />
              ))}

              {/* Categories not yet budgeted */}
              <Text style={[styles.addLabel, { color: textMuted }]}>Add a budget</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.filter((cat) => !budgets.find((b) => b.category === cat)).map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => openEdit(cat)}
                    style={[styles.catChip, { backgroundColor: cardBg, borderColor: cardBorder }]}
                  >
                    <Text style={styles.catEmoji}>{CATEGORY_EMOJI[cat]}</Text>
                    <Text style={[styles.catLabel, { color: textMuted }]}>{CATEGORY_LABELS[cat]}</Text>
                    <Ionicons name="add" size={14} color={textMuted} />
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit budget modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: isDark ? '#13132b' : '#ffffff', borderColor: cardBorder }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: textPrimary }]}>
            {CATEGORY_EMOJI[editCategory]} {CATEGORY_LABELS[editCategory]} budget
          </Text>
          <Text style={[styles.sheetSub, { color: textMuted }]}>Monthly limit in ₹</Text>
          <TextInput
            style={[styles.sheetInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }]}
            placeholder="e.g. 5000"
            placeholderTextColor={textMuted}
            keyboardType="numeric"
            value={editAmount}
            onChangeText={setEditAmount}
            autoFocus
          />
          <Pressable
            onPress={handleSave}
            style={[styles.sheetSaveBtn, { backgroundColor: accent }]}
          >
            <Text style={styles.sheetSaveBtnText}>Save budget</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.4 },
  summaryValue: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  summaryDivider: { width: 1, height: 36, marginHorizontal: 8 },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  aiBtnText: { fontSize: 13, fontWeight: '600' },
  section: { gap: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  addLabel: { fontSize: 12, fontWeight: '500', marginTop: 8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '500' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  sheetSub: { fontSize: 12, marginBottom: 4 },
  sheetInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
  },
  sheetSaveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  sheetSaveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});