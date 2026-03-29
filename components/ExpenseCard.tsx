import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Expense } from '@/types';
import { useIsDark } from '@/hooks/useTheme';
import CategoryPill, { DARK_COLORS, LIGHT_COLORS } from './CategoryPill';
import { CATEGORY_EMOJI } from '@/types';

interface ExpenseCardProps {
  expense: Expense;
  index?: number;
  onPress?: () => void;
  currency?: string;
}

export default function ExpenseCard({
  expense,
  index = 0,
  onPress,
  currency = '₹',
}: ExpenseCardProps) {
  const isDark = useIsDark();
  const colors = isDark ? DARK_COLORS[expense.category] : LIGHT_COLORS[expense.category];

  // Slide in from bottom on mount
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 60;
    translateY.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 200 }));
    opacity.value = withDelay(delay, withSpring(1, { damping: 20, stiffness: 200 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const formattedDate = new Date(expense.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isDark ? '#13132b' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)',
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        {/* Category emoji circle */}
        <View style={[styles.iconCircle, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={styles.emoji}>{CATEGORY_EMOJI[expense.category]}</Text>
        </View>

        {/* Description + category */}
        <View style={styles.middle}>
          <Text
            style={[styles.description, { color: isDark ? '#f0f0ff' : '#1a0800' }]}
            numberOfLines={1}
          >
            {expense.description}
          </Text>
          <View style={styles.metaRow}>
            <CategoryPill category={expense.category} size="sm" />
            <Text style={[styles.date, { color: isDark ? '#55557a' : '#c09070' }]}>
              {formattedDate}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text style={[styles.amount, { color: colors.dot }]}>
          {currency}{expense.amount.toLocaleString('en-IN')}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: {
    fontSize: 20,
  },
  middle: {
    flex: 1,
    gap: 5,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 11,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 0,
  },
});