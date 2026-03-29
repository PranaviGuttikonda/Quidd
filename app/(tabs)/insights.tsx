import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, CartesianChart, Bar } from 'victory-native';

import FloatingBlobs from '@/components/FloatingBlobs';
import DonutChart from '@/components/DonutChart';
import HeatmapCalendar from '@/components/HeatmapCalendar';
import StreakBar from '@/components/StreakBar';
import CategoryPill from '@/components/CategoryPill';
import { useIsDark } from '@/hooks/useTheme';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useInsights, useMonthlyTrend } from '@/hooks/useInsights';
import { useStreak } from '@/hooks/useStreak';
import { getMonthlySummary } from '@/lib/gemini';

type Period = 'week' | 'month' | 'year';

const SCREEN_WIDTH = Dimensions.get('window').width;

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function InsightsScreen() {
  const isDark = useIsDark();
  const { session } = useAuthStore();
  const { expenses, loading, fetchForMonth } = useExpenseStore();

  const [period, setPeriod] = useState<Period>('month');
  const [aiSummary, setAiSummary] = useState<{ summary: string; savingsTip: string; topInsight: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) fetchForMonth(userId, currentMonth());
  }, [userId]);

  const insights = useInsights(expenses);
  const trend = useMonthlyTrend(expenses, 6);
  const streak = useStreak(expenses);

  const maxTrend = Math.max(...trend.map((t) => t.total), 1);

  useEffect(() => {
    if (expenses.length === 0 || aiLoading) return;
    setAiLoading(true);
    const breakdown: Record<string, number> = {};
    for (const b of insights.breakdown) breakdown[b.category] = b.amount;
    getMonthlySummary(insights.month, insights.totalSpent, breakdown)
      .then(setAiSummary)
      .catch(() => setAiSummary(null))
      .finally(() => setAiLoading(false));
  }, [expenses.length]);

  // ─── Theme ─────────────────────────────────────────────────────────────────
  const bg = isDark ? '#0a0a1a' : '#fff8f0';
  const cardBg = isDark ? '#13132b' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)';
  const textPrimary = isDark ? '#f0f0ff' : '#1a0800';
  const textMuted = isDark ? '#55557a' : '#c09070';
  const textSecondary = isDark ? '#9090bb' : '#7a4a2a';
  const accent = isDark ? '#ff6ec7' : '#ff6b6b';
  const purple = isDark ? '#c77dff' : '#cc5de8';
  const barColor = isDark ? '#ff6ec7' : '#ff6b6b';

  const periods: { key: Period; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

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
          <Text style={[styles.title, { color: textPrimary }]}>Insights</Text>
          <View style={[styles.periodToggle, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {periods.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[styles.periodBtn, period === p.key && { backgroundColor: accent }]}
              >
                <Text style={[styles.periodBtnText, { color: period === p.key ? '#fff' : textMuted }]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={accent} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Donut chart + breakdown */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Spending breakdown</Text>
              <DonutChart
                breakdown={insights.breakdown}
                totalSpent={insights.totalSpent}
                currency="₹"
              />

              {/* Category legend */}
              {insights.breakdown.length > 0 && (
                <View style={styles.legend}>
                  {insights.breakdown.map((item) => (
                    <View key={item.category} style={styles.legendRow}>
                      <CategoryPill category={item.category} size="sm" />
                      <View style={styles.legendRight}>
                        <Text style={[styles.legendAmt, { color: textPrimary }]}>
                          ₹{item.amount.toLocaleString('en-IN')}
                        </Text>
                        <Text style={[styles.legendPct, { color: textMuted }]}>
                          {Math.round(item.percentage)}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {insights.breakdown.length === 0 && (
                <Text style={[styles.emptyText, { color: textMuted }]}>
                  No expenses logged this month yet.
                </Text>
              )}
            </View>

            {/* Monthly trend bar chart */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>6-month trend</Text>
              <View style={styles.barChart}>
                {trend.map((t, i) => {
                  const pct = t.total / maxTrend;
                  const barH = Math.max(4, pct * 100);
                  const monthShort = new Date(t.month + '-01').toLocaleDateString('en-IN', { month: 'short' });
                  return (
                    <View key={t.month} style={styles.barCol}>
                      <Text style={[styles.barAmt, { color: textMuted, opacity: pct > 0.05 ? 1 : 0 }]}>
                        {t.total > 0 ? `₹${(t.total / 1000).toFixed(1)}k` : ''}
                      </Text>
                      <View style={[styles.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(180,100,0,0.07)' }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${barH}%`,
                              backgroundColor: i === trend.length - 1 ? barColor : isDark ? 'rgba(255,110,199,0.4)' : 'rgba(255,107,107,0.35)',
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, { color: textMuted }]}>{monthShort}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Streak */}
            <StreakBar
              loggedDays={streak.loggedDays}
              currentStreak={streak.currentStreak}
              longestStreak={streak.longestStreak}
            />

            {/* Heatmap */}
            <HeatmapCalendar expenses={expenses} />

            {/* AI Summary card */}
            {(aiLoading || aiSummary) && (
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: isDark ? 'rgba(199,125,255,0.25)' : 'rgba(204,93,232,0.2)' }]}>
                <View style={styles.aiHeader}>
                  <Ionicons name="sparkles" size={14} color={purple} />
                  <Text style={[styles.aiLabel, { color: purple }]}>Quiddy's monthly read</Text>
                </View>

                {aiLoading ? (
                  <ActivityIndicator color={purple} />
                ) : aiSummary ? (
                  <View style={styles.aiContent}>
                    <Text style={[styles.aiText, { color: textSecondary }]}>{aiSummary.summary}</Text>

                    <View style={[styles.aiTipBox, { backgroundColor: isDark ? 'rgba(107,255,158,0.08)' : '#eaffef', borderColor: isDark ? 'rgba(107,255,158,0.25)' : '#86efac' }]}>
                      <Text style={[styles.aiTipLabel, { color: isDark ? '#6bff9e' : '#166534' }]}>💡 Savings tip</Text>
                      <Text style={[styles.aiTipText, { color: isDark ? '#9090bb' : '#7a4a2a' }]}>{aiSummary.savingsTip}</Text>
                    </View>

                    <View style={[styles.aiTipBox, { backgroundColor: isDark ? 'rgba(255,202,58,0.08)' : '#fff8e0', borderColor: isDark ? 'rgba(255,202,58,0.25)' : '#fcd34d' }]}>
                      <Text style={[styles.aiTipLabel, { color: isDark ? '#ffca3a' : '#92400e' }]}>🔍 Top insight</Text>
                      <Text style={[styles.aiTipText, { color: isDark ? '#9090bb' : '#7a4a2a' }]}>{aiSummary.topInsight}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, gap: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  periodToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  periodBtnText: { fontSize: 12, fontWeight: '600' },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  legend: { gap: 10 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendAmt: { fontSize: 14, fontWeight: '600' },
  legendPct: { fontSize: 12, fontWeight: '500', width: 36, textAlign: 'right' },
  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 6,
    paddingTop: 24,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barAmt: { fontSize: 9, fontWeight: '500' },
  barTrack: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: { fontSize: 10, fontWeight: '500' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  aiContent: { gap: 12 },
  aiText: { fontSize: 13, lineHeight: 20 },
  aiTipBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  aiTipLabel: { fontSize: 12, fontWeight: '600' },
  aiTipText: { fontSize: 12, lineHeight: 18 },
});