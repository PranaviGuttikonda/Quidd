import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useIsDark } from '@/hooks/useTheme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDayOfWeek(dateStr: string): number {
  // 0 = Mon, 6 = Sun
  const d = new Date(dateStr);
  return (d.getDay() + 6) % 7;
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

interface DayDotProps {
  label: string;
  logged: boolean;
  isToday: boolean;
  index: number;
  isDark: boolean;
}

function DayDot({ label, logged, isToday, index, isDark }: DayDotProps) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 50, withSpring(1, { damping: 16, stiffness: 260 }));
    opacity.value = withDelay(index * 50, withSpring(1));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const loggedBg = isDark ? '#ff6ec7' : '#ff6b6b';
  const todayBorder = isDark ? '#ff6ec7' : '#ff6b6b';
  const emptyBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(180,100,0,0.07)';
  const emptyBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(180,100,0,0.15)';

  return (
    <Animated.View style={[styles.dayCol, animStyle]}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: logged ? loggedBg : emptyBg,
            borderColor: isToday && !logged ? todayBorder : 'transparent',
            borderWidth: isToday && !logged ? 1.5 : 0,
          },
        ]}
      >
        {logged && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.dayLabel, { color: isToday ? (isDark ? '#ff6ec7' : '#ff6b6b') : isDark ? '#55557a' : '#c09070' }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

interface StreakBarProps {
  loggedDays: Set<string>;
  currentStreak: number;
  longestStreak?: number;
}

export default function StreakBar({ loggedDays, currentStreak, longestStreak }: StreakBarProps) {
  const isDark = useIsDark();
  const last7 = getLast7Days();
  const today = new Date().toISOString().split('T')[0];

  // Flame pulse when streak > 0
  const flamePulse = useSharedValue(1);
  useEffect(() => {
    if (currentStreak > 0) {
      flamePulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }
  }, [currentStreak]);
  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flamePulse.value }],
  }));

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#13132b' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.streakInfo}>
          <Animated.Text style={[styles.flame, flameStyle]}>🔥</Animated.Text>
          <View>
            <Text style={[styles.streakCount, { color: isDark ? '#f0f0ff' : '#1a0800' }]}>
              {currentStreak}-day streak
            </Text>
            {longestStreak !== undefined && (
              <Text style={[styles.streakSub, { color: isDark ? '#55557a' : '#c09070' }]}>
                Best: {longestStreak} days
              </Text>
            )}
          </View>
        </View>
        {currentStreak === 0 && (
          <Text style={[styles.nudge, { color: isDark ? '#55557a' : '#c09070' }]}>
            Log today to start! 💪
          </Text>
        )}
      </View>

      {/* 7-day dots */}
      <View style={styles.dotsRow}>
        {last7.map((dateStr, i) => {
          const dayOfWeek = getDayOfWeek(dateStr);
          return (
            <DayDot
              key={dateStr}
              label={DAYS[dayOfWeek]}
              logged={loggedDays.has(dateStr)}
              isToday={dateStr === today}
              index={i}
              isDark={isDark}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flame: { fontSize: 24 },
  streakCount: { fontSize: 15, fontWeight: '600' },
  streakSub: { fontSize: 11, marginTop: 1 },
  nudge: { fontSize: 12, fontWeight: '500' },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});