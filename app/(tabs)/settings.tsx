import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  TextInput,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FloatingBlobs from '@/components/FloatingBlobs';
import { useIsDark } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { supabase } from '@/lib/supabase';
import { tapHaptic, confirmHaptic } from '@/lib/haptics';

type ColorScheme = 'dark' | 'light' | 'system';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
];

function exportToCSV(expenses: any[]): string {
  const header = 'Date,Description,Category,Amount,Note,Recurring';
  const rows = expenses.map((e) =>
    [e.date, `"${e.description}"`, e.category, e.amount, `"${e.note ?? ''}"`, e.recurring].join(',')
  );
  return [header, ...rows].join('\n');
}

function SettingRow({
  icon,
  label,
  sublabel,
  right,
  onPress,
  isDark,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: isDark ? '#13132b' : '#ffffff',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)',
          opacity: pressed && onPress ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,100,0,0.07)' }]}>
        <Ionicons name={icon as any} size={16} color={isDark ? '#9090bb' : '#7a4a2a'} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: isDark ? '#f0f0ff' : '#1a0800' }]}>{label}</Text>
        {sublabel && <Text style={[styles.rowSub, { color: isDark ? '#55557a' : '#c09070' }]}>{sublabel}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={14} color={isDark ? '#55557a' : '#c09070'} />)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const isDark = useIsDark();
  const { session, profile, reset } = useAuthStore();
  const { currency, colorScheme, notificationsEnabled, setCurrency, setColorScheme, setNotificationsEnabled } = useSettingsStore();
  const { expenses } = useExpenseStore();

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const textPrimary = isDark ? '#f0f0ff' : '#1a0800';
  const textMuted = isDark ? '#55557a' : '#c09070';
  const accent = isDark ? '#ff6ec7' : '#ff6b6b';
  const bg = isDark ? '#0a0a1a' : '#fff8f0';
  const cardBg = isDark ? '#13132b' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)';
  const inputBg = isDark ? '#1e1e40' : '#fff8f0';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.12)';

  const userEmail = session?.user?.email ?? 'Not signed in';
  const userName = profile?.name ?? userEmail.split('@')[0];
  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? '₹';
  const themeLabel = colorScheme === 'system' ? 'System' : colorScheme === 'dark' ? 'Dark' : 'Light';

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          reset();
        },
      },
    ]);
  };

  const handleExportCSV = async () => {
    if (expenses.length === 0) {
      Alert.alert('Nothing to export', 'Log some expenses first!');
      return;
    }
    const csv = exportToCSV(expenses);
    await Share.share({ message: csv, title: 'Quidd expenses.csv' });
    confirmHaptic();
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <FloatingBlobs variant={isDark ? 'dark' : 'light'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.title, { color: textPrimary }]}>Settings</Text>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.avatar, { backgroundColor: isDark ? 'rgba(255,110,199,0.2)' : '#ffe4e4', borderColor: isDark ? 'rgba(255,110,199,0.4)' : '#ffb3b3' }]}>
            <Text style={styles.avatarText}>{userName[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: textPrimary }]}>{userName}</Text>
            <Text style={[styles.profileEmail, { color: textMuted }]}>{userEmail}</Text>
          </View>
        </View>

        {/* Preferences */}
        <Text style={[styles.sectionLabel, { color: textMuted }]}>Preferences</Text>

        <SettingRow
          icon="cash-outline"
          label="Currency"
          sublabel={`${currency} (${currencySymbol})`}
          onPress={() => { setShowCurrencyPicker(true); tapHaptic(); }}
          isDark={isDark}
        />

        {showCurrencyPicker && (
          <View style={[styles.pickerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => { setCurrency(c.code); setShowCurrencyPicker(false); tapHaptic(); }}
                style={[styles.pickerRow, { borderColor: cardBorder }]}
              >
                <Text style={[styles.pickerLabel, { color: textPrimary }]}>{c.symbol} {c.label}</Text>
                {currency === c.code && <Ionicons name="checkmark" size={16} color={accent} />}
              </Pressable>
            ))}
          </View>
        )}

        <SettingRow
          icon="color-palette-outline"
          label="Appearance"
          sublabel={themeLabel}
          onPress={() => { setShowThemePicker(true); tapHaptic(); }}
          isDark={isDark}
        />

        {showThemePicker && (
          <View style={[styles.pickerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {(['system', 'dark', 'light'] as ColorScheme[]).map((scheme) => (
              <Pressable
                key={scheme}
                onPress={() => { setColorScheme(scheme); setShowThemePicker(false); tapHaptic(); }}
                style={[styles.pickerRow, { borderColor: cardBorder }]}
              >
                <Text style={[styles.pickerLabel, { color: textPrimary }]}>
                  {scheme === 'system' ? '📱 System' : scheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </Text>
                {colorScheme === scheme && <Ionicons name="checkmark" size={16} color={accent} />}
              </Pressable>
            ))}
          </View>
        )}

        <SettingRow
          icon="notifications-outline"
          label="Notifications"
          sublabel="Daily reminders to log expenses"
          isDark={isDark}
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={(v) => { setNotificationsEnabled(v); tapHaptic(); }}
              trackColor={{ false: isDark ? '#2a2a50' : '#e0d5c8', true: accent }}
              thumbColor="#fff"
            />
          }
        />

        {/* Data */}
        <Text style={[styles.sectionLabel, { color: textMuted }]}>Data</Text>

        <SettingRow
          icon="download-outline"
          label="Export to CSV"
          sublabel={`${expenses.length} transactions`}
          onPress={handleExportCSV}
          isDark={isDark}
        />

        {/* About */}
        <Text style={[styles.sectionLabel, { color: textMuted }]}>About</Text>

        <SettingRow
          icon="information-circle-outline"
          label="Quidd"
          sublabel="Version 1.0.0 · Made with 💜"
          isDark={isDark}
        />

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          style={[styles.signOutBtn, { borderColor: isDark ? 'rgba(255,92,122,0.35)' : 'rgba(255,77,77,0.3)' }]}
        >
          <Ionicons name="log-out-outline" size={16} color={isDark ? '#ff5c7a' : '#ff4d4d'} />
          <Text style={[styles.signOutText, { color: isDark ? '#ff5c7a' : '#ff4d4d' }]}>Sign out</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, gap: 10 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 6,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#ff6ec7' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600' },
  profileEmail: { fontSize: 12, marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 2,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '500' },
  rowSub: { fontSize: 11, marginTop: 2 },
  pickerCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: -4,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerLabel: { fontSize: 14, fontWeight: '500' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
  },
  signOutText: { fontSize: 14, fontWeight: '600' },
});