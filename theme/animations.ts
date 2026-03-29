// ─── Quidd Shared Animation Presets ──────────────────────────────────────────
// All animation config lives here so screens stay clean.
// Uses react-native-reanimated spring/timing configs.

import {
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

// ─── Spring presets ───────────────────────────────────────────────────────────

export const springs = {
  // Snappy pop — button press, card appear
  snappy: { damping: 18, stiffness: 300, mass: 0.8 },

  // Gentle settle — budget bars, number counters
  gentle: { damping: 22, stiffness: 180, mass: 1 },

  // Bouncy — coin bounce, success feedback
  bouncy: { damping: 10, stiffness: 260, mass: 0.7 },
} as const;

// ─── Timing presets ───────────────────────────────────────────────────────────

export const timings = {
  fast:   { duration: 150, easing: Easing.out(Easing.cubic) },
  normal: { duration: 250, easing: Easing.out(Easing.cubic) },
  slow:   { duration: 400, easing: Easing.out(Easing.cubic) },
} as const;

// ─── Reusable animation builders ─────────────────────────────────────────────

/** Slide + fade in from bottom — for new expense cards */
export const slideInFromBottom = (delay = 0) => ({
  opacity: withDelay(delay, withTiming(1, timings.normal)),
  translateY: withDelay(delay, withSpring(0, springs.gentle)),
});

/** Scale pop — for save confirmation, badges */
export const scalePop = () =>
  withSequence(
    withSpring(1.12, springs.bouncy),
    withSpring(1.0, springs.snappy)
  );

/** Budget bar fill — animates width from 0 to target on mount */
export const barFill = (toValue: number) =>
  withDelay(200, withSpring(toValue, springs.gentle));

/**
 * Number counter — animate a shared value to a new number.
 * Use with useDerivedValue + Animated.Text for the ₹ total on dashboard.
 */
export const countTo = (toValue: number) =>
  withSpring(toValue, springs.gentle);

/** Coin bounce sequence — triggered after saving an expense */
export const coinBounce = () =>
  withSequence(
    withSpring(-14, springs.bouncy),   // up
    withSpring(0, springs.snappy),     // settle
  );

/** Blob float — infinite gentle up-down for dashboard blobs */
export const blobFloat = (offset = 0) =>
  withDelay(
    offset,
    withSequence(
      withTiming(-8, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      withTiming(0,  { duration: 2800, easing: Easing.inOut(Easing.sin) }),
    )
  );