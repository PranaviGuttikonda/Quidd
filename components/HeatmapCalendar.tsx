import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Expense } from '@/types';
import { useIsDark } from '@/hooks/useTheme';

interface DayData {
  date: string;
  amount: number;
  count: number;
}

function buildMonthGrid(year: number, month: number, expenses: Expense[]): DayData[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const tally: Record<string, { amount: number; count: number }> = {};

  for (const e of expenses) {
    if (!e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) continue;
    if (!tally[e.date]) tally[e.date] = { amount: 0, count: 0 };
    tally[e.date].amount += e.amount;
    tally[e.date].count += 1;
  }

  const days: DayData[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date, amount: tally[date]?.amount ?? 0, count: tally[date]?.count ?? 0 });
  }
  return days;
}

function getIntensity(amount: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (amount === 0 || max === 0) return 0;
  const ratio = amount / max;
  if (ratio < 0.2) return 1;
  if (ratio < 0.45) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

function DayCell({
  day,
  intensity,
  isDark,
  index,
}: {
  day: DayData;
  intensity: 0 | 1 | 2 | 3 | 4;
  isDark: boolean;
  index: number;
}) {
  const scale = useSharedValue(0.5);
  useEffect(() => {
    scale.value = withDelay(index * 8, withSpring(1, { damping: 18, stiffness: 260 }));
  }, []);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const darkColors = ['rgba(255,255,255,0.04)', 'rgba(255,110,199,0.18)', 'rgba(255,110,199,0.36)', 'rgba(255,110,199,0.60)', '#ff6ec7'];
  const lightColors = ['rgba(180,100,0,0.06)', 'rgba(255,107,107,0.18)', 'rgba(255,107,107,0.38)', 'rgba(255,107,107,0.62)', '#ff6b6b'];
  const palette = isDark ? darkColors : lightColors;

  const isToday = day.date === new Date().toISOString().split('T')[0];

  return (
    <Animated.View
      style={[
        styles.cell,
        animStyle,
        {
          backgroundColor: palette[intensity],
          borderColor: isToday
            ? isDark ? '#ff6ec7' : '#ff6b6b'
            : 'transparent',
          borderWidth: isToday ? 1.5 : 0,
        },
      ]}
    />
  );
}

interface HeatmapCalendarProps {
  expenses: Expense[];
  year?: number;
  month?: number; // 0-indexed
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function HeatmapCalendar({ expenses, year, month }: HeatmapCalendarProps) {
  const isDark = useIsDark();
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();

  const days = buildMonthGrid(y, m, expenses);
  const max = Math.max(...days.map((d) => d.amount), 1);

  // First day of month — 0=Sun,1=Mon... convert to Mon-start
  const firstDayRaw = new Date(y, m, 1).getDay();
  const firstDay = (firstDayRaw + 6) % 7; // Mon=0

  const totalSpent = days.reduce((s, d) => s + d.amount, 0);
  const activeDays = days.filter((d) => d.amount > 0).length;

  // Pad start
  const paddedDays: (DayData | null)[] = [
    ...Array(firstDay).fill(null),
    ...days,
  ];

  // Group into weeks
  const weeks: (DayData | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  const monthName = new Date(y, m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#13132b' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#f0f0ff' : '#1a0800' }]}>{monthName}</Text>
        <View style={styles.stats}>
          <Text style={[styles.statText, { color: isDark ? '#55557a' : '#c09070' }]}>
            {activeDays} days · ₹{totalSpent.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((l, i) => (
          <Text key={i} style={[styles.weekLabel, { color: isDark ? '#55557a' : '#c09070' }]}>{l}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) =>
              day ? (
                <DayCell
                  key={day.date}
                  day={day}
                  intensity={getIntensity(day.amount, max)}
                  isDark={isDark}
                  index={wi * 7 + di}
                />
              ) : (
                <View key={`pad-${wi}-${di}`} style={styles.cell} />
              )
            )}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendLabel, { color: isDark ? '#55557a' : '#c09070' }]}>Less</Text>
        {([0, 1, 2, 3, 4] as const).map((level) => {
          const darkPalette = ['rgba(255,255,255,0.04)', 'rgba(255,110,199,0.18)', 'rgba(255,110,199,0.36)', 'rgba(255,110,199,0.60)', '#ff6ec7'];
          const lightPalette = ['rgba(180,100,0,0.06)', 'rgba(255,107,107,0.18)', 'rgba(255,107,107,0.38)', 'rgba(255,107,107,0.62)', '#ff6b6b'];
          return (
            <View key={level} style={[styles.legendCell, { backgroundColor: (isDark ? darkPalette : lightPalette)[level] }]} />
          );
        })}
        <Text style={[styles.legendLabel, { color: isDark ? '#55557a' : '#c09070' }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 14, fontWeight: '600' },
  stats: {},
  statText: { fontSize: 11, fontWeight: '500' },
  weekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  weekLabel: {
    width: 32,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '500',
  },
  grid: { gap: 4 },
  cell: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  legendLabel: { fontSize: 10 },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});