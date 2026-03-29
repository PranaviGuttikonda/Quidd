import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import FloatingBlobs from '@/components/FloatingBlobs';
import AIInput from '@/components/AIInput';
import { useIsDark } from '@/hooks/useTheme';
import { useExpenseStore } from '@/store/useExpenseStore';
import { useAuthStore } from '@/store/useAuthStore';
import { confirmHaptic, celebrateHaptic, errorHaptic } from '@/lib/haptics';
import { CATEGORIES, Category, CATEGORY_EMOJI, CATEGORY_LABELS } from '@/types';

interface ExpenseForm {
  amount: string;
  category: Category;
  description: string;
  note: string;
  date: string;
  recurring: boolean;
}

const today = () => new Date().toISOString().split('T')[0];

const DEFAULT_FORM: ExpenseForm = {
  amount: '',
  category: 'food',
  description: '',
  note: '',
  date: today(),
  recurring: false,
};

export default function AddScreen() {
  const isDark = useIsDark();
  const { session } = useAuthStore();
  const { addExpense } = useExpenseStore();

  const [form, setForm] = useState<ExpenseForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  const coinY = useSharedValue(0);
  const coinOpacity = useSharedValue(0);
  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: coinY.value }],
    opacity: coinOpacity.value,
  }));

  const triggerCoinBounce = () => {
    coinOpacity.value = 1;
    coinY.value = withSequence(
      withSpring(-40, { damping: 8, stiffness: 260 }),
      withSpring(0, { damping: 12, stiffness: 200 })
    );
    setTimeout(() => { coinOpacity.value = 0; }, 800);
  };

  const handleAIParsed = (result: {
    amount: number;
    category: Category;
    description: string;
    note?: string;
  }) => {
    setForm((f) => ({
      ...f,
      amount: String(result.amount),
      category: result.category,
      description: result.description,
      note: result.note ?? '',
    }));
    setMode('manual');
  };

  const handleSave = async () => {
    if (!form.amount || !form.description) {
      Alert.alert('Missing fields', 'Please fill in amount and description.');
      errorHaptic();
      return;
    }
    if (!session?.user?.id) {
      Alert.alert('Not logged in', 'Please log in to save expenses.');
      return;
    }

    setSaving(true);
    try {
      await addExpense({
        user_id: session.user.id,
        amount: parseFloat(form.amount),
        category: form.category,
        description: form.description,
        note: form.note || null,
        date: form.date,
        recurring: form.recurring,
        mood: null,
      });

      triggerCoinBounce();
      await celebrateHaptic();
      setForm(DEFAULT_FORM);
      setMode('ai');

      setTimeout(() => router.push('/(tabs)/'), 400);
    } catch (e: any) {
      errorHaptic();
      Alert.alert('Error', e.message ?? 'Could not save expense.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Theme tokens ────────────────────────────────────────────────────────────
  const bg = isDark ? '#0a0a1a' : '#fff8f0';
  const cardBg = isDark ? '#13132b' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)';
  const textPrimary = isDark ? '#f0f0ff' : '#1a0800';
  const textMuted = isDark ? '#55557a' : '#c09070';
  const inputBg = isDark ? '#1e1e40' : '#fff8f0';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.12)';

  // Single accent rule: purple in dark, coral in light
  const accent = isDark ? '#c77dff' : '#ff6b6b';
  const accentBg = isDark ? 'rgba(199,125,255,0.15)' : '#fff0f0';
  const accentBorder = isDark ? '#c77dff' : '#ff6b6b';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <FloatingBlobs variant={isDark ? 'dark' : 'light'} />

      <Animated.View style={[styles.coinOverlay, coinStyle]} pointerEvents="none">
        <Text style={styles.coinEmoji}>🪙</Text>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={textMuted} />
          </Pressable>
          <Text style={[styles.title, { color: textPrimary }]}>Log expense</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Mode toggle */}
        <View style={[styles.modeToggle, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {(['ai', 'manual'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.modeBtn,
                mode === m && { backgroundColor: accent },
              ]}
            >
              <Ionicons
                name={m === 'ai' ? 'sparkles' : 'create'}
                size={13}
                color={mode === m ? '#fff' : textMuted}
              />
              <Text style={[styles.modeBtnText, { color: mode === m ? '#fff' : textMuted }]}>
                {m === 'ai' ? 'AI input' : 'Manual'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* AI Input */}
        {mode === 'ai' && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <AIInput
              onParsed={handleAIParsed}
              onError={(msg) => console.warn(msg)}
            />
          </View>
        )}

        {/* Manual form */}
        {mode === 'manual' && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>

            {/* Amount */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>Amount (₹)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }]}
                placeholder="0"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                value={form.amount}
                onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>Description</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }]}
                placeholder="What did you spend on?"
                placeholderTextColor={textMuted}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              />
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>Category</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = form.category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setForm((f) => ({ ...f, category: cat }))}
                      style={[
                        styles.catBtn,
                        {
                          backgroundColor: isSelected ? accentBg : inputBg,
                          borderColor: isSelected ? accentBorder : inputBorder,
                        },
                      ]}
                    >
                      <Text style={styles.catEmoji}>{CATEGORY_EMOJI[cat]}</Text>
                      <Text style={[styles.catLabel, { color: isSelected ? accent : textMuted }]}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Note */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>Note (optional)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }]}
                placeholder="Any extra context..."
                placeholderTextColor={textMuted}
                value={form.note}
                onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
              />
            </View>

            {/* Recurring toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>Recurring</Text>
                <Text style={[styles.toggleSub, { color: textMuted }]}>Repeats every month</Text>
              </View>
              <Switch
                value={form.recurring}
                onValueChange={(v) => setForm((f) => ({ ...f, recurring: v }))}
                trackColor={{
                  false: isDark ? '#2a2a50' : '#e0d5c8',
                  true: accent,
                }}
                thumbColor="#fff"
              />
            </View>

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: isDark ? '#ff6ec7' : '#ff6b6b' }]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Save expense</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeBtnText: { fontSize: 13, fontWeight: '600' },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  field: { gap: 7 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, fontWeight: '500' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleSub: { fontSize: 11, marginTop: 2 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  coinOverlay: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    zIndex: 100,
  },
  coinEmoji: { fontSize: 40 },
});