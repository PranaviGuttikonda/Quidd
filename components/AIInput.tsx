import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useIsDark } from '@/hooks/useTheme';
import { parseExpenseFromText } from '@/lib/gemini';
import { Category } from '@/types';
import { tapHaptic, confirmHaptic } from '@/lib/haptics';

interface ParsedResult {
  amount: number;
  category: Category;
  description: string;
  note?: string;
}

interface AIInputProps {
  onParsed: (result: ParsedResult) => void;
  onError?: (msg: string) => void;
}

function Bubble({
  text,
  side,
  isDark,
}: {
  text: string;
  side: 'left' | 'right';
  isDark: boolean;
}) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useState(() => {
    scale.value = withSpring(1, { damping: 18, stiffness: 260 });
    opacity.value = withTiming(1, { duration: 200 });
  });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const isLeft = side === 'left';

  return (
    <Animated.View
      style={[
        styles.bubble,
        animStyle,
        isLeft ? styles.bubbleLeft : styles.bubbleRight,
        {
          backgroundColor: isLeft
            ? isDark ? 'rgba(199,125,255,0.15)' : '#fff0f0'
            : isDark ? 'rgba(107,255,158,0.12)' : '#fff8f0',
          borderColor: isLeft
            ? isDark ? 'rgba(199,125,255,0.3)' : '#ffb3b3'
            : isDark ? 'rgba(107,255,158,0.3)' : '#ffcc99',
        },
      ]}
    >
      <Text
        style={[
          styles.bubbleText,
          {
            color: isLeft
              ? isDark ? '#d4a0ff' : '#c42b2b'
              : isDark ? '#6bff9e' : '#a05000',
          },
        ]}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

export default function AIInput({ onParsed, onError }: AIInputProps) {
  const isDark = useIsDark();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBubble, setUserBubble] = useState<string | null>(null);
  const [replyBubble, setReplyBubble] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const accent = isDark ? '#c77dff' : '#ff6b6b';

  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    tapHaptic();
    buttonScale.value = withSequence(
      withSpring(0.88, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 14, stiffness: 260 })
    );

    setUserBubble(trimmed);
    setReplyBubble(null);
    setText('');
    Keyboard.dismiss();
    setLoading(true);

    try {
      const result = await parseExpenseFromText(trimmed);
      confirmHaptic();

      const replyText =
        result.amount > 0
          ? `Got it! ${getCategoryEmoji(result.category)} ${result.description} · ₹${result.amount.toLocaleString('en-IN')} saved`
          : `Hmm, I couldn't parse an amount. Try something like "spent ₹200 on food"`;

      setReplyBubble(replyText);

      if (result.amount > 0) {
        setTimeout(() => onParsed(result), 600);
      }
    } catch {
      setReplyBubble("Sorry, I couldn't understand that. Try again?");
      onError?.('Parsing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Ionicons name="sparkles" size={13} color={accent} />
        <Text style={[styles.label, { color: accent }]}>
          Tell Quiddy what you spent
        </Text>
      </View>

      {(userBubble || replyBubble) && (
        <View style={styles.chatArea}>
          {userBubble && (
            <Bubble text={userBubble} side="right" isDark={isDark} />
          )}
          {loading && (
            <View
              style={[
                styles.bubble,
                styles.bubbleLeft,
                {
                  backgroundColor: isDark ? 'rgba(199,125,255,0.1)' : '#fff0f0',
                  borderColor: isDark ? 'rgba(199,125,255,0.2)' : '#ffb3b3',
                },
              ]}
            >
              <ActivityIndicator size="small" color={accent} />
            </View>
          )}
          {replyBubble && !loading && (
            <Bubble text={replyBubble} side="left" isDark={isDark} />
          )}
        </View>
      )}

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: isDark ? '#1e1e40' : '#ffffff',
            borderColor: isDark
              ? 'rgba(199,125,255,0.3)'
              : 'rgba(255,107,107,0.25)',
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: isDark ? '#f0f0ff' : '#1a0800' }]}
          placeholder='e.g. "spent ₹200 on food"'
          placeholderTextColor={isDark ? '#55557a' : '#c09070'}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
        />
        <Animated.View style={buttonStyle}>
          <Pressable
            onPress={handleSend}
            disabled={loading || !text.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: text.trim()
                  ? accent
                  : isDark ? '#2a2a50' : '#ffe8e0',
              },
            ]}
          >
            <Ionicons
              name="arrow-up"
              size={16}
              color={text.trim() ? '#fff' : isDark ? '#55557a' : '#c09070'}
            />
          </Pressable>
        </Animated.View>
      </View>

      <View style={styles.hints}>
        {HINTS.map((hint) => (
          <Pressable
            key={hint}
            onPress={() => {
              setText(hint);
              inputRef.current?.focus();
            }}
            style={[
              styles.hint,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff8f0',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(180,100,0,0.12)',
              },
            ]}
          >
            <Text style={[styles.hintText, { color: isDark ? '#9090bb' : '#7a4a2a' }]}>
              {hint}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const HINTS = ['chai ₹30', 'uber ₹150', 'groceries ₹800', 'netflix ₹199'];

function getCategoryEmoji(cat: Category): string {
  const map: Record<Category, string> = {
    food: '🍕', travel: '🚌', shopping: '🛍️',
    health: '💊', entertainment: '🎬', bills: '🧾',
    savings: '💰', other: '📦',
  };
  return map[cat] ?? '📦';
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  chatArea: { gap: 8, paddingVertical: 4 },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  bubbleLeft: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleRight: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 2 },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hints: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  hint: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  hintText: { fontSize: 11, fontWeight: '500' },
});