import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
  useAnimatedProps,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import FloatingBlobs from '@/components/FloatingBlobs';
import ExpenseCard from '@/components/ExpenseCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useTheme, useIsDark } from '@/hooks/useTheme';
import { getDailyTip } from '@/lib/gemini';
import { useEffect as useEffectOnce, useState } from 'react';

// Animated text for the ₹ counter
const AnimatedText = Animated.createAnimatedComponent(Text);

function AnimatedAmount({ amount, currency = '₹', isDark }: { amount: number; currency?: string; isDark: boolean }) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withSpring(amount, { damping: 22, stiffness: 180 });
  }, [amount]);

  // We use a JS-driven counter here for simplicity + cross-platform compat
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<any>(null);

  useEffect(() => {
    const start = displayed;
    const end = amount;
    const duration = 600;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [amount]);

  return (
    <Text style={[styles.totalAmount, { color: isDark ? '#f0f0ff' : '#1a0800' }]}>
      {currency}{displayed.toLocaleString('en-IN')}
    </Text>
  );
}

export default function Dashboard() {
  const isDark = useIsDark();
  const theme = useTheme();
  const { session } = useAuthStore();
  const { expenses, loading, fetchForMonth, totalSpent, spentByCategory } = useExpenseStore();
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) fetchForMonth(userId, currentMonth);
  }, [userId, currentMonth]);

  // Fetch AI tip once data loads
  useEffect(() => {
    if (expenses.length === 0) return;
    const breakdown = spentByCategory();
    const topCat = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'food';
    getDailyTip(totalSpent(), topCat)
      .then(setAiTip)
      .catch(() => setAiTip(null));
  }, [expenses.length]);

  const recentExpenses = expenses.slice(0, 5);
  const spent = totalSpent();

  const monthLabel = new Date(currentMonth + '-01').toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const goToPrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const prev = m === 1
      ? `${y - 1}-12`
      : `${y}-${String(m - 1).padStart(2, '0')}`;
    setCurrentMonth(prev);
  };

  const goToNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const now = new Date();
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (currentMonth >= nowStr) return;
    const next = m === 12
      ? `${y + 1}-01`
      : `${y}-${String(m + 1).padStart(2, '0')}`;
    setCurrentMonth(next);
  };

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#0a0a1a' : '#fff8f0' }]}>
      {/* Floating blobs — dashboard only */}
      <FloatingBlobs variant={isDark ? 'dark' : 'light'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: isDark ? '#55557a' : '#c09070' }]}>
              Good {getTimeOfDay()} 👋
            </Text>
            <Text style={[styles.appName, { color: isDark ? '#f0f0ff' : '#1a0800' }]}>
              Quidd
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/settings')}
            style={[styles.avatarBtn, { backgroundColor: isDark ? '#13132b' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.12)' }]}
          >
            <Ionicons name="person" size={18} color={isDark ? '#9090bb' : '#7a4a2a'} />
          </Pressable>
        </View>

        {/* Month selector + total card */}
        <View style={[styles.totalCard, { backgroundColor: isDark ? '#13132b' : '#ffffff', borderColor: isDark ? 'rgba(255,110,199,0.2)' : 'rgba(255,107,107,0.15)' }]}>
          {/* Month nav */}
          <View style={styles.monthRow}>
            <Pressable onPress={goToPrevMonth} style={styles.monthBtn}>
              <Ionicons name="chevron-back" size={16} color={isDark ? '#9090bb' : '#7a4a2a'} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: isDark ? '#9090bb' : '#7a4a2a' }]}>
              {monthLabel}
            </Text>
            <Pressable onPress={goToNextMonth} style={styles.monthBtn}>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#9090bb' : '#7a4a2a'} />
            </Pressable>
          </View>

          <Text style={[styles.totalLabel, { color: isDark ? '#55557a' : '#c09070' }]}>
            Total spent
          </Text>

          {loading ? (
            <ActivityIndicator color={isDark ? '#ff6ec7' : '#ff6b6b'} style={{ marginVertical: 12 }} />
          ) : (
            <AnimatedAmount amount={spent} isDark={isDark} />
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,100,0,0.08)' }]} />

          {/* Quick add button */}
          <Pressable
            onPress={() => router.push('/(tabs)/add')}
            style={[styles.quickAdd, { backgroundColor: isDark ? '#ff6ec7' : '#ff6b6b' }]}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.quickAddText}>Log expense</Text>
          </Pressable>
        </View>

        {/* AI Tip */}
        {aiTip && (
          <View style={[styles.tipCard, { backgroundColor: isDark ? '#13132b' : '#ffffff', borderColor: isDark ? 'rgba(199,125,255,0.25)' : 'rgba(204,93,232,0.2)' }]}>
            <View style={styles.tipHeader}>
              <Ionicons name="sparkles" size={14} color={isDark ? '#c77dff' : '#cc5de8'} />
              <Text style={[styles.tipLabel, { color: isDark ? '#c77dff' : '#cc5de8' }]}>
                Quiddy says
              </Text>
            </View>
            <Text style={[styles.tipText, { color: isDark ? '#9090bb' : '#7a4a2a' }]}>
              {aiTip}
            </Text>
          </View>
        )}

        {/* Recent transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#f0f0ff' : '#1a0800' }]}>
              Recent
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={[styles.seeAll, { color: isDark ? '#ff6ec7' : '#ff6b6b' }]}>
                See all
              </Text>
            </Pressable>
          </View>

          {loading && recentExpenses.length === 0 ? (
            <ActivityIndicator color={isDark ? '#ff6ec7' : '#ff6b6b'} />
          ) : recentExpenses.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,100,0,0.08)' }]}>
              <Text style={styles.emptyEmoji}>💸</Text>
              <Text style={[styles.emptyText, { color: isDark ? '#55557a' : '#c09070' }]}>
                No expenses yet this month
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/add')}>
                <Text style={[styles.emptyAction, { color: isDark ? '#ff6ec7' : '#ff6b6b' }]}>
                  Log your first one →
                </Text>
              </Pressable>
            </View>
          ) : (
            recentExpenses.map((expense, i) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                index={i}
                currency="₹"
              />
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 14,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthBtn: {
    padding: 4,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  quickAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickAddText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tipCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 24,
    gap: 6,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    gap: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyAction: {
    fontSize: 13,
    fontWeight: '600',
  },
});