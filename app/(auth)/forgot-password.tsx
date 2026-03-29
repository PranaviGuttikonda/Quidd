import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  useEffect as useAnimatedEffect,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import FloatingBlobs from '@/components/FloatingBlobs';
import { useIsDark } from '@/hooks/useTheme';
import { tapHaptic, confirmHaptic, errorHaptic } from '@/lib/haptics';

type Step = 'input' | 'sent';

export default function ForgotPasswordScreen() {
  const isDark = useIsDark();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('input');
  const [emailFocused, setEmailFocused] = useState(false);

  // ─── Entrance animations ──────────────────────────────────────────────────
  const contentY = useSharedValue(30);
  const contentOpacity = useSharedValue(0);

  useAnimatedEffect(() => {
    contentOpacity.value = withDelay(100, withTiming(1, { duration: 380 }));
    contentY.value = withDelay(100, withSpring(0, { damping: 20, stiffness: 160 }));
  });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentY.value }],
    opacity: contentOpacity.value,
  }));

  // Success state animation
  const checkScale = useSharedValue(0);
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleReset = async () => {
    if (!email.trim()) {
      errorHaptic();
      Alert.alert('Enter your email', 'We need your email address to send a reset link.');
      return;
    }

    tapHaptic();
    btnScale.value = withSequence(
      withSpring(0.96, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 14, stiffness: 260 })
    );

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'quidd://reset-password',
    });
    setLoading(false);

    if (error) {
      errorHaptic();
      Alert.alert('Error', error.message);
      return;
    }

    confirmHaptic();
    setStep('sent');
    checkScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.2, { damping: 10, stiffness: 260 }),
        withSpring(1, { damping: 14, stiffness: 220 })
      )
    );
  };

  // ─── Theme tokens ─────────────────────────────────────────────────────────
  const bg = isDark ? '#0a0a1a' : '#fff8f0';
  const cardBg = isDark ? '#13132b' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)';
  const textPrimary = isDark ? '#f0f0ff' : '#1a0800';
  const textMuted = isDark ? '#55557a' : '#c09070';
  const inputBg = isDark ? '#1e1e40' : '#fff8f0';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.12)';
  const focusBorder = isDark ? '#c77dff' : '#ff6b6b';
  const accent = isDark ? '#ff6ec7' : '#ff6b6b';
  const purple = isDark ? '#c77dff' : '#cc5de8';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <FloatingBlobs variant={isDark ? 'dark' : 'light'} />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,100,0,0.06)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,100,0,0.10)',
            }]}
          >
            <Ionicons name="chevron-back" size={18} color={textMuted} />
            <Text style={[styles.backText, { color: textMuted }]}>Back</Text>
          </Pressable>

          <Animated.View style={[styles.inner, contentStyle]}>
            {step === 'input' ? (
              <>
                {/* Icon */}
                <View style={[styles.iconCircle, {
                  backgroundColor: isDark ? 'rgba(199,125,255,0.15)' : '#f5eaff',
                  borderColor: isDark ? 'rgba(199,125,255,0.35)' : '#d4a0ff',
                }]}>
                  <Ionicons name="lock-open-outline" size={32} color={purple} />
                </View>

                <View style={styles.textBlock}>
                  <Text style={[styles.title, { color: textPrimary }]}>Forgot password?</Text>
                  <Text style={[styles.subtitle, { color: textMuted }]}>
                    No worries! Enter your email and we'll send you a reset link.
                  </Text>
                </View>

                {/* Form card */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: textMuted }]}>Email address</Text>
                    <View style={[
                      styles.inputWrap,
                      {
                        backgroundColor: inputBg,
                        borderColor: emailFocused ? focusBorder : inputBorder,
                      },
                    ]}>
                      <Ionicons
                        name="mail-outline"
                        size={16}
                        color={emailFocused ? focusBorder : textMuted}
                      />
                      <TextInput
                        style={[styles.input, { color: textPrimary }]}
                        placeholder="you@example.com"
                        placeholderTextColor={textMuted}
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                        autoFocus
                      />
                    </View>
                  </View>

                  <Animated.View style={btnStyle}>
                    <Pressable
                      onPress={handleReset}
                      disabled={loading}
                      style={[styles.primaryBtn, { backgroundColor: accent }]}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryBtnText}>Send reset link</Text>
                          <Ionicons name="send" size={15} color="#fff" />
                        </>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>
              </>
            ) : (
              /* ─── Success state ──────────────────────────────────────── */
              <View style={styles.successBlock}>
                <Animated.View style={[styles.successCircle, checkStyle, {
                  backgroundColor: isDark ? 'rgba(107,255,158,0.12)' : '#eaffef',
                  borderColor: isDark ? 'rgba(107,255,158,0.3)' : '#86efac',
                }]}>
                  <Ionicons
                    name="checkmark-circle"
                    size={48}
                    color={isDark ? '#6bff9e' : '#51cf66'}
                  />
                </Animated.View>

                <Text style={[styles.title, { color: textPrimary, textAlign: 'center' }]}>
                  Check your inbox! 📬
                </Text>
                <Text style={[styles.subtitle, { color: textMuted, textAlign: 'center' }]}>
                  We sent a reset link to{'\n'}
                  <Text style={{ color: accent, fontWeight: '600' }}>{email}</Text>
                </Text>

                <Text style={[styles.hint, { color: textMuted }]}>
                  Didn't get it? Check your spam folder or try again.
                </Text>

                <Pressable
                  onPress={() => setStep('input')}
                  style={[styles.outlineBtn, {
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(180,100,0,0.15)',
                  }]}
                >
                  <Text style={[styles.outlineBtnText, { color: textMuted }]}>
                    Try a different email
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => router.replace('/login')}
                  style={[styles.primaryBtn, { backgroundColor: accent }]}
                >
                  <Text style={styles.primaryBtnText}>Back to sign in</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 40,
  },
  backText: { fontSize: 14, fontWeight: '500' },
  inner: {
    flex: 1,
    gap: 24,
    alignItems: 'stretch',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  textBlock: { gap: 8, alignItems: 'center' },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  field: { gap: 7 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Success state
  successBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 20,
    paddingTop: 20,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  outlineBtn: {
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});