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

export default function LoginScreen() {
  const isDark = useIsDark();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ─── Staggered entrance animations ───────────────────────────────────────
  const logoY = useSharedValue(30);
  const logoOpacity = useSharedValue(0);
  const formY = useSharedValue(40);
  const formOpacity = useSharedValue(0);
  const footerY = useSharedValue(20);
  const footerOpacity = useSharedValue(0);

  useAnimatedEffect(() => {
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    logoY.value = withDelay(100, withSpring(0, { damping: 20, stiffness: 180 }));
    formOpacity.value = withDelay(280, withTiming(1, { duration: 400 }));
    formY.value = withDelay(280, withSpring(0, { damping: 20, stiffness: 160 }));
    footerOpacity.value = withDelay(450, withTiming(1, { duration: 350 }));
    footerY.value = withDelay(450, withSpring(0, { damping: 22, stiffness: 180 }));
  });

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoY.value }],
    opacity: logoOpacity.value,
  }));
  const formStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formY.value }],
    opacity: formOpacity.value,
  }));
  const footerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: footerY.value }],
    opacity: footerOpacity.value,
  }));

  // ─── Button press animation ───────────────────────────────────────────────
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      errorHaptic();
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    tapHaptic();
    btnScale.value = withSequence(
      withSpring(0.96, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 14, stiffness: 260 })
    );

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      errorHaptic();
      Alert.alert('Login failed', error.message);
    } else {
      confirmHaptic();
      router.replace('/(tabs)/');
    }
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
  const accentSub = isDark ? '#c77dff' : '#cc5de8';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <FloatingBlobs variant={isDark ? 'dark' : 'light'} />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo block */}
          <Animated.View style={[styles.logoBlock, logoStyle]}>
            <View style={[styles.logoCircle, {
              backgroundColor: isDark ? 'rgba(255,110,199,0.15)' : '#fff0f0',
              borderColor: isDark ? 'rgba(255,110,199,0.35)' : '#ffb3b3',
            }]}>
              <Text style={styles.logoEmoji}>🐷</Text>
            </View>
            <Text style={[styles.appName, { color: textPrimary }]}>Quidd</Text>
            <Text style={[styles.tagline, { color: textMuted }]}>
              Track smarter, spend better
            </Text>
          </Animated.View>

          {/* Form card */}
          <Animated.View style={[styles.card, formStyle, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Welcome back 👋</Text>
            <Text style={[styles.cardSub, { color: textMuted }]}>Sign in to your account</Text>

            {/* Email */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: textMuted }]}>Email</Text>
              <View style={[
                styles.inputWrap,
                {
                  backgroundColor: inputBg,
                  borderColor: emailFocused ? focusBorder : inputBorder,
                },
              ]}>
                <Ionicons name="mail-outline" size={16} color={emailFocused ? focusBorder : textMuted} />
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
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: textMuted }]}>Password</Text>
                <Pressable onPress={() => router.push('/forgot-password')}>
                  <Text style={[styles.forgotLink, { color: accentSub }]}>Forgot?</Text>
                </Pressable>
              </View>
              <View style={[
                styles.inputWrap,
                {
                  backgroundColor: inputBg,
                  borderColor: passwordFocused ? focusBorder : inputBorder,
                },
              ]}>
                <Ionicons name="lock-closed-outline" size={16} color={passwordFocused ? focusBorder : textMuted} />
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="••••••••"
                  placeholderTextColor={textMuted}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color={textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Sign in button */}
            <Animated.View style={btnStyle}>
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={[styles.primaryBtn, { backgroundColor: accent }]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Sign in</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </>
                )}
              </Pressable>
            </Animated.View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,100,0,0.10)' }]} />
              <Text style={[styles.dividerText, { color: textMuted }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,100,0,0.10)' }]} />
            </View>

            {/* Google OAuth */}
            <Pressable
              onPress={() => Alert.alert('Coming soon', 'Google login coming soon!')}
              style={[styles.googleBtn, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                borderColor: cardBorder,
              }]}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleBtnText, { color: textPrimary }]}>Continue with Google</Text>
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[styles.footer, footerStyle]}>
            <Text style={[styles.footerText, { color: textMuted }]}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text style={[styles.footerLink, { color: accent }]}>Sign up free</Text>
            </Pressable>
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
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
    gap: 24,
  },
  logoBlock: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoEmoji: { fontSize: 36 },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 13,
    marginTop: -8,
  },
  field: { gap: 7 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
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
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '500' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  googleIcon: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});