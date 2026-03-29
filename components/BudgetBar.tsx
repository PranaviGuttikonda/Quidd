import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { BudgetWithSpend } from '@/types';
import { useIsDark } from '@/hooks/useTheme';
import { DARK_COLORS, LIGHT_COLORS } from './CategoryPill';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/types';

interface BudgetBarProps {
  budget: BudgetWithSpend;
  index?: number;
  currency?: string;
  onPress?: () => void;
}

export default function BudgetBar({
  budget,
  index = 0,
  currency = '₹',
  onPress,
}: BudgetBarProps) {
  const isDark = useIsDark();
  const colors = isDark ? DARK_COLORS[budget.category] : LIGHT_COLORS[budget.category];

  const pct = Math.min(budget.percentage, 100);
  const isOver = budget.isOverBudget;

  // Animated bar width
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withDelay(index * 100, withSpring(pct, { damping: 20, stiffness: 140 }));
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  // Slide in
  const translateX = useSharedValue(-20);
  const opacity = useSharedValue(0);
  useEffect(() => {
    translateX.value = withDelay(index * 80, withSpring(0, { damping: 20, stiffness: 200 }));
    opacity.value = withDelay(index * 80, withSpring(1, { damping: 20, stiffness: 200 }));
  }, []);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const overColor = isDark ? '#ff5c7a' : '#ff4d4d';
  const barColor = isOver ? overColor : colors.dot;
  const trackColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,100,0,0.08)';

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#13132b' : '#ffffff',
            borderColor: isOver
              ? isDark ? 'rgba(255,92,122,0.35)' : 'rgba(255,77,77,0.25)'
              : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)',
          },
        ]}
      >
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.labelGroup}>
            <View style={[styles.iconCircle, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={styles.emoji}>{CATEGORY_EMOJI[budget.category]}</Text>
            </View>
            <View>
              <Text style={[styles.catName, { color: isDark ? '#f0f0ff' : '#1a0800' }]}>
                {CATEGORY_LABELS[budget.category]}
              </Text>
              <Text style={[styles.sub, { color: isDark ? '#55557a' : '#c09070' }]}>
                {currency}{budget.spent.toLocaleString('en-IN')} of {currency}{budget.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <View style={styles.rightGroup}>
            <Text style={[styles.pctText, { color: isOver ? overColor : colors.dot }]}>
              {isOver ? '⚠️ Over' : `${Math.round(pct)}%`}
            </Text>
            <Text style={[styles.remaining, { color: isDark ? '#55557a' : '#c09070' }]}>
              {isOver
                ? `${currency}${Math.abs(budget.remaining).toLocaleString('en-IN')} over`
                : `${currency}${budget.remaining.toLocaleString('en-IN')} left`}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={[styles.track, { backgroundColor: trackColor }]}>
          <Animated.View
            style={[
              styles.fill,
              barStyle,
              { backgroundColor: barColor },
            ]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: { fontSize: 18 },
  catName: { fontSize: 14, fontWeight: '600' },
  sub: { fontSize: 11, marginTop: 1 },
  rightGroup: { alignItems: 'flex-end' },
  pctText: { fontSize: 13, fontWeight: '700' },
  remaining: { fontSize: 11, marginTop: 1 },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});