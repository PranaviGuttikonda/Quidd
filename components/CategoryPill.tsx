import { View, Text, StyleSheet } from 'react-native';
import { Category, CATEGORY_LABELS, CATEGORY_EMOJI } from '@/types';
import { useIsDark } from '@/hooks/useTheme';

const DARK_COLORS: Record<Category, { bg: string; border: string; text: string; dot: string }> = {
  food:          { bg: 'rgba(255,110,199,0.15)', border: 'rgba(255,110,199,0.4)',  text: '#ff9ee0', dot: '#ff6ec7' },
  travel:        { bg: 'rgba(58,244,255,0.10)',  border: 'rgba(58,244,255,0.35)',  text: '#67e8f9', dot: '#3af4ff' },
  shopping:      { bg: 'rgba(199,125,255,0.15)', border: 'rgba(199,125,255,0.4)',  text: '#d4a0ff', dot: '#c77dff' },
  health:        { bg: 'rgba(107,255,158,0.10)', border: 'rgba(107,255,158,0.3)',  text: '#6bff9e', dot: '#6bff9e' },
  entertainment: { bg: 'rgba(255,202,58,0.12)',  border: 'rgba(255,202,58,0.35)',  text: '#ffe033', dot: '#ffca3a' },
  bills:         { bg: 'rgba(255,159,67,0.12)',  border: 'rgba(255,159,67,0.35)',  text: '#ffb347', dot: '#ff9f43' },
  savings:       { bg: 'rgba(184,240,255,0.10)', border: 'rgba(184,240,255,0.3)',  text: '#b8f0ff', dot: '#b8f0ff' },
  other:         { bg: 'rgba(136,136,136,0.12)', border: 'rgba(136,136,136,0.3)',  text: '#aaaaaa', dot: '#888888' },
};

const LIGHT_COLORS: Record<Category, { bg: string; border: string; text: string; dot: string }> = {
  food:          { bg: '#fff0f5', border: '#ffb3d1', text: '#c42b8a', dot: '#ff6b6b' },
  travel:        { bg: '#e8f7ff', border: '#90d4f7', text: '#0369a1', dot: '#4dabf7' },
  shopping:      { bg: '#f5eaff', border: '#d4a0ff', text: '#7b3bbf', dot: '#cc5de8' },
  health:        { bg: '#eaffef', border: '#86efac', text: '#166534', dot: '#51cf66' },
  entertainment: { bg: '#fff8e0', border: '#fcd34d', text: '#92400e', dot: '#ffa94d' },
  bills:         { bg: '#fff3e8', border: '#fdba74', text: '#9a3412', dot: '#ff922b' },
  savings:       { bg: '#e8f4ff', border: '#93c5fd', text: '#1e40af', dot: '#74c0fc' },
  other:         { bg: '#f5f5f5', border: '#d1d5db', text: '#6b7280', dot: '#868e96' },
};

interface CategoryPillProps {
  category: Category;
  showEmoji?: boolean;
  size?: 'sm' | 'md';
}

export default function CategoryPill({ category, showEmoji = false, size = 'md' }: CategoryPillProps) {
  const isDark = useIsDark();
  const colors = isDark ? DARK_COLORS[category] : LIGHT_COLORS[category];
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.pill,
      {
        backgroundColor: colors.bg,
        borderColor: colors.border,
        paddingHorizontal: isSmall ? 8 : 10,
        paddingVertical: isSmall ? 3 : 4,
      }
    ]}>
      {showEmoji ? (
        <Text style={{ fontSize: isSmall ? 10 : 12 }}>{CATEGORY_EMOJI[category]}</Text>
      ) : (
        <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      )}
      <Text style={[styles.label, { color: colors.text, fontSize: isSmall ? 10 : 11 }]}>
        {CATEGORY_LABELS[category]}
      </Text>
    </View>
  );
}

// Export colors for use in other components (charts, etc.)
export { DARK_COLORS, LIGHT_COLORS };

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});