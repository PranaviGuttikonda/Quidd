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

type QuiddyMood = 'happy' | 'neutral' | 'sad' | 'celebrating';

interface QuiddyProps {
  mood?: QuiddyMood;
  healthPct?: number; // 0–100, how good the budget is
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
  showMessage?: boolean;
}

const MOOD_MESSAGES: Record<QuiddyMood, string> = {
  happy:       "You're crushing it! 🎉",
  neutral:     "Keep tracking, champ!",
  sad:         "Oof, let's rein it in 😬",
  celebrating: "Goal reached! 🚀",
};

const MOOD_EMOJI: Record<QuiddyMood, string> = {
  happy:       '🐷',
  neutral:     '🐷',
  sad:         '🐷',
  celebrating: '🐷',
};

function getMood(healthPct: number): QuiddyMood {
  if (healthPct >= 80) return 'happy';
  if (healthPct >= 40) return 'neutral';
  return 'sad';
}

const SIZES = { sm: 32, md: 48, lg: 64 };
const FONT_SIZES = { sm: 20, md: 32, lg: 46 };

export default function Quiddy({
  mood,
  healthPct = 70,
  size = 'md',
  showBar = true,
  showMessage = false,
}: QuiddyProps) {
  const isDark = useIsDark();
  const resolvedMood = mood ?? getMood(healthPct);

  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    if (resolvedMood === 'celebrating') {
      rotate.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 150 }),
          withTiming(8, { duration: 150 }),
        ),
        6,
        true
      );
    } else {
      rotate.value = withSpring(0);
    }
  }, [resolvedMood]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const barWidth = useSharedValue(0);
  useEffect(() => {
    barWidth.value = withSpring(Math.min(healthPct, 100), { damping: 20, stiffness: 140 });
  }, [healthPct]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const barColor =
    healthPct >= 70
      ? isDark ? '#6bff9e' : '#51cf66'
      : healthPct >= 40
      ? isDark ? '#ffca3a' : '#ffa94d'
      : isDark ? '#ff5c7a' : '#ff4d4d';

  return (
    <View style={styles.wrapper}>
      <Animated.Text style={[{ fontSize: FONT_SIZES[size] }, animStyle]}>
        {MOOD_EMOJI[resolvedMood]}
      </Animated.Text>

      {showMessage && (
        <Text style={[styles.message, { color: isDark ? '#9090bb' : '#7a4a2a' }]}>
          {MOOD_MESSAGES[resolvedMood]}
        </Text>
      )}

      {showBar && (
        <View style={[styles.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.1)' }]}>
          <Animated.View style={[styles.barFill, barStyle, { backgroundColor: barColor }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 6,
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  barTrack: {
    width: 80,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 5,
    borderRadius: 3,
  },
});