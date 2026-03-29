import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Mood } from '@/types';
import { useIsDark } from '@/hooks/useTheme';
import { tapHaptic } from '@/lib/haptics';

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'necessary', emoji: '✅', label: 'Needed' },
  { value: 'happy',     emoji: '🎉', label: 'Treat' },
  { value: 'impulse',   emoji: '😅', label: 'Oops' },
  { value: 'regret',    emoji: '😤', label: 'Regret' },
];

const DARK_MOOD_COLORS: Record<Mood, { bg: string; border: string; text: string }> = {
  necessary: { bg: 'rgba(107,255,158,0.12)', border: 'rgba(107,255,158,0.3)',  text: '#6bff9e' },
  happy:     { bg: 'rgba(255,202,58,0.12)',  border: 'rgba(255,202,58,0.35)',  text: '#ffca3a' },
  impulse:   { bg: 'rgba(255,110,199,0.12)', border: 'rgba(255,110,199,0.35)', text: '#ff6ec7' },
  regret:    { bg: 'rgba(255,92,122,0.12)',  border: 'rgba(255,92,122,0.35)',  text: '#ff5c7a' },
};

const LIGHT_MOOD_COLORS: Record<Mood, { bg: string; border: string; text: string }> = {
  necessary: { bg: '#eaffef', border: '#86efac', text: '#166534' },
  happy:     { bg: '#fff8e0', border: '#fcd34d', text: '#92400e' },
  impulse:   { bg: '#fff0f5', border: '#ffb3d1', text: '#c42b8a' },
  regret:    { bg: '#fff0f0', border: '#fca5a5', text: '#991b1b' },
};

interface MoodTagProps {
  selected?: Mood | null;
  onSelect?: (mood: Mood) => void;
  readonly?: boolean;
}

function MoodButton({
  mood,
  selected,
  isDark,
  onPress,
}: {
  mood: (typeof MOODS)[number];
  selected: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  const colors = (isDark ? DARK_MOOD_COLORS : LIGHT_MOOD_COLORS)[mood.value];
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.88, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 14, stiffness: 260 })
    );
    tapHaptic();
    onPress();
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.moodBtn,
          {
            backgroundColor: selected ? colors.bg : isDark ? 'rgba(255,255,255,0.03)' : '#f5f5f5',
            borderColor: selected ? colors.border : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.1)',
          },
        ]}
      >
        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
        <Text style={[styles.moodLabel, { color: selected ? colors.text : isDark ? '#55557a' : '#c09070' }]}>
          {mood.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function MoodTag({ selected, onSelect, readonly = false }: MoodTagProps) {
  const isDark = useIsDark();

  if (readonly && selected) {
    const mood = MOODS.find((m) => m.value === selected);
    if (!mood) return null;
    const colors = (isDark ? DARK_MOOD_COLORS : LIGHT_MOOD_COLORS)[selected];
    return (
      <View style={[styles.readonlyPill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
        <Text style={[styles.moodLabel, { color: colors.text }]}>{mood.label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {MOODS.map((mood) => (
        <MoodButton
          key={mood.value}
          mood={mood}
          selected={selected === mood.value}
          isDark={isDark}
          onPress={() => onSelect?.(mood.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  moodEmoji: { fontSize: 13 },
  moodLabel: { fontSize: 12, fontWeight: '500' },
  readonlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});