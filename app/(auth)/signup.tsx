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

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['#ff5c7a', '#ff9f43', '#ffca3a', '#6bff9e'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <View style={pwStyles.wrap}>
      <View style={pwStyles.bars}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              pwStyles.bar,
              { backgroundColor: i < score ? colors[score - 1] : 'rgba(255,255,255,0.08)' },
            ]}
          />
        ))}
      </View>
      <Text style={[pwStyles.label, { color: score > 0 ? colors[score - 1] : '#55557a' }]}>
        {score > 0 ? labels[score - 1] : ''}
      </Text>
    </View>
  );
}

const pwStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '600', width: 44, textAlign: 'right' },
});

export default function SignupScreen() {
  const isDark = useIsDark();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [focused, setFocused] = useState<string | null>(null);

  // ─── Entrance animations ──────────────────────────────────────────────────
  const logoY = useSharedValue(30);
  const logoOpacity = useSharedValue(0);
  const formY = useSharedValue(40);
  const formOpacity = useSharedValue(0);
  const footerY = useSharedValue(20);
  const footerOpacity = useSharedValue(0);

  useAnimatedEffect(() => {
    logoOpacity.value = withDelay(80, withTiming(1, { duration: 380 }));
    logoY.value = withDelay(80, withSpring(0, { damping: 20, stiffness: 180 }));
    formOpacity.value = withDelay(240, withTiming(1, { duration: 380 }));
    formY.value = withDelay(240, withSpring(0, { damping: 20, stiffness: 160 }));
    footerOpacity.value = withDelay(420, withTiming(1, { duration: 350 }));
    footerY.value = withDelay(420, withSpring(0, { damping: 22, stiffness: 180 }));
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

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      errorHaptic();
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      errorHaptic();
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      errorHaptic();
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    tapHaptic();
    btnScale.value = withSequence(
      withSpring(0.96, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 14, stiffness: 260 })
    );

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
      },
    });
    setLoading(false);

    if (error) {
      errorHaptic();
      Alert.alert('Sign up failed', error.message);
      return;
    }

    // Insert profile row
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: name.trim(),
        currency: 'INR',
      });
    }

    confirmHaptic();
    Alert.alert(
      'Almost there! 🎉',
      'Check your email to verify your account, then sign in.',
      [{ text: 'Go to login', onPress: () => router.replace('/login') }]
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

  const inputBorderFor = (field: string) =>
    focused === field ? focusBorder : inputBorder;

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
          {/* Logo block */}
          <Animated.View style={[styles.logoBlock, logoStyle]}>
            <View style={[styles.logoCircle, {
              backgroundColor: isDark ? 'rgba(107,255,158,0.12)' : '#eaffef',
              borderColor: isDark ? 'rgba(107,255,158,0.3)' : '#86efac',
            }]}>
              <Text style={styles.logoEmoji}>🐷</Text>
            </View>
            <Text style={[styles.appName, { color: textPrimary }]}>Join Quidd</Text>
            <Text style={[styles.tagline, { color: textMuted }]}>
              Your finances, finally sorted
            </Text>
          </Animated.View>

          {/* Form card */}
          <Animated.View style={[styles.card, formStyle, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Create account ✨</Text>

            {/* Name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: textMuted }]}>Your name</Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorderFor('name') }]}>
                <Ionicons name="person-outline" size={16} color={focused === 'name' ? focusBorder : textMuted} />
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="What should Quiddy call you?"
                  placeholderTextColor={textMuted}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: textMuted }]}>Email</Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorderFor('email') }]}>
                <Ionicons name="mail-outline" size={16} color={focused === 'email' ? focusBorder : textMuted} />
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="you@example.com"
                  placeholderTextColor={textMuted}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: textMuted }]}>Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorderFor('password') }]}>
                <Ionicons name="lock-closed-outline" size={16} color={focused === 'password' ? focusBorder : textMuted} />
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={textMuted}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color={textMuted}
                  />
                </Pressable>
              </View>
              <PasswordStrength password={password} />
            </View>

            {/* Confirm password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: textMuted }]}>Confirm password</Text>
              <View style={[
                styles.inputWrap,
                {
                  backgroundColor: inputBg,
                  borderColor: confirmPassword && confirmPassword !== password
                    ? isDark ? '#ff5c7a' : '#ff4d4d'
                    : inputBorderFor('confirm'),
                },
              ]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={
                    confirmPassword && confirmPassword === password
                      ? isDark ? '#6bff9e' : '#51cf66'
                      : focused === 'confirm' ? focusBorder : textMuted
                  }
                />
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused(null)}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                />
                {confirmPassword.length > 0 && (
                  <Ionicons
                    name={confirmPassword === password ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={confirmPassword === password
                      ? isDark ? '#6bff9e' : '#51cf66'
                      : isDark ? '#ff5c7a' : '#ff4d4d'}
                  />
                )}
              </View>
            </View>

            {/* Sign up button */}
            <Animated.View style={btnStyle}>
              <Pressable
                onPress={handleSignup}
                disabled={loading}
                style={[styles.primaryBtn, { backgroundColor: accent }]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Create account</Text>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                  </>
                )}
              </Pressable>
            </Animated.View>

            <Text style={[styles.terms, { color: textMuted }]}>
              By signing up you agree to our Terms & Privacy Policy
            </Text>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[styles.footer, footerStyle]}>
            <Text style={[styles.footerText, { color: textMuted }]}>Already have an account?</Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={[styles.footerLink, { color: accent }]}>Sign in</Text>
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
    paddingTop: 70,
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
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
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
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  terms: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
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