import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useIsDark } from '@/hooks/useTheme';

interface SavingsRocketProps {
  savedAmount: number;
  goalAmount: number;
  currency?: string;
  label?: string;
}

export default function SavingsRocket({
  savedAmount,
  goalAmount,
  currency = '₹',
  label = 'Savings goal',
}: SavingsRocketProps) {
  const isDark = useIsDark();
  const pct = goalAmount > 0 ? Math.min((savedAmount / goalAmount) * 100, 100) : 0;
  const isComplete = pct >= 100;

  // Rocket float
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    if (isComplete) {
      rotate.value = withRepeat(
        withSequence(withTiming(-10, { duration: 200 }), withTiming(10, { duration: 200 })),
        6,
        true
      );
    }
  }, [isComplete]);

  const rocketStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
  }));

  // Progress bar
  const barWidth = useSharedValue(0);
  useEffect(() => {
    barWidth.value = withSpring(pct, { damping: 20, stiffness: 120 });
  }, [pct]);
  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value}%` }));

  const barColor = isComplete
    ? isDark ? '#6bff9e' : '#51cf66'
    : isDark ? '#b8f0ff' : '#74c0fc';

  const trackColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,100,0,0.08)';
  const textPrimary = isDark ? '#f0f0ff' : '#1a0800';
  const textMuted = isDark ? '#55557a' : '#c09070';

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#13132b' : '#ffffff', borderColor: isDark ? 'rgba(184,240,255,0.2)' : 'rgba(116,192,252,0.3)' }]}>
      {/* Rocket + label row */}
      <View style={styles.topRow}>
        <Animated.Text style={[styles.rocket, rocketStyle]}>
          {isComplete ? '🎉' : '🚀'}
        </Animated.Text>
        <View style={styles.labelBlock}>
          <Text style={[styles.label, { color: textMuted }]}>{label}</Text>
          <Text style={[styles.amounts, { color: textPrimary }]}>
            {currency}{savedAmount.toLocaleString('en-IN')}
            <Text style={[styles.goal, { color: textMuted }]}>
              {' '}/ {currency}{goalAmount.toLocaleString('en-IN')}
            </Text>
          </Text>
        </View>
        <View style={[styles.pctBadge, { backgroundColor: isDark ? 'rgba(184,240,255,0.12)' : 'rgba(116,192,252,0.15)', borderColor: isDark ? 'rgba(184,240,255,0.3)' : 'rgba(116,192,252,0.4)' }]}>
          <Text style={[styles.pctText, { color: isDark ? '#b8f0ff' : '#1e40af' }]}>
            {Math.round(pct)}%
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.fill, barStyle, { backgroundColor: barColor }]} />
      </View>

      {isComplete && (
        <Text style={[styles.congrats, { color: isDark ? '#6bff9e' : '#166534' }]}>
          🎉 Goal reached! You're a saving superstar!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rocket: { fontSize: 32 },
  labelBlock: { flex: 1 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  amounts: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginTop: 2 },
  goal: { fontSize: 14, fontWeight: '400' },
  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  pctText: { fontSize: 13, fontWeight: '700' },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  congrats: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});