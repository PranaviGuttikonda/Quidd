import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { CategoryBreakdown } from '@/types';
import { useIsDark } from '@/hooks/useTheme';
import { DARK_COLORS, LIGHT_COLORS } from './CategoryPill';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 180;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const CENTER = SIZE / 2;

interface SliceProps {
  color: string;
  percentage: number;
  offset: number;
  index: number;
}

function Slice({ color, percentage, offset, index }: SliceProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * 80, withSpring(percentage / 100, { damping: 20, stiffness: 160 }));
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${CIRCUMFERENCE * progress.value} ${CIRCUMFERENCE}`,
    strokeDashoffset: -CIRCUMFERENCE * offset,
  }));

  return (
    <AnimatedCircle
      cx={CENTER}
      cy={CENTER}
      r={R}
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="butt"
      animatedProps={animatedProps}
      rotation={-90}
      origin={`${CENTER}, ${CENTER}`}
    />
  );
}

interface DonutChartProps {
  breakdown: CategoryBreakdown[];
  totalSpent: number;
  currency?: string;
  size?: number;
}

export default function DonutChart({
  breakdown,
  totalSpent,
  currency = '₹',
  size = SIZE,
}: DonutChartProps) {
  const isDark = useIsDark();
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const emptyColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,100,0,0.08)';

  if (breakdown.length === 0) {
    return (
      <View style={[styles.wrapper, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={(size - STROKE) / 2}
            fill="none"
            stroke={emptyColor}
            strokeWidth={STROKE}
          />
        </Svg>
        <View style={styles.center}>
          <Text style={[styles.totalLabel, { color: isDark ? '#55557a' : '#c09070' }]}>No data</Text>
        </View>
      </View>
    );
  }

  // Build slices with cumulative offsets
  let cumulativeOffset = 0;
  const slices = breakdown.map((item, i) => {
    const pct = item.percentage / 100;
    const offset = cumulativeOffset;
    cumulativeOffset += pct;
    return { ...item, pct, offset, index: i };
  });

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G>
          {/* Background ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={(size - STROKE) / 2}
            fill="none"
            stroke={emptyColor}
            strokeWidth={STROKE}
          />
          {slices.map((s, i) => (
            <Slice
              key={s.category}
              color={colors[s.category]?.dot ?? '#888'}
              percentage={s.percentage}
              offset={s.offset}
              index={i}
            />
          ))}
        </G>
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.totalAmount, { color: isDark ? '#f0f0ff' : '#1a0800' }]}>
          {currency}{totalSpent.toLocaleString('en-IN')}
        </Text>
        <Text style={[styles.totalLabel, { color: isDark ? '#55557a' : '#c09070' }]}>
          this month
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});