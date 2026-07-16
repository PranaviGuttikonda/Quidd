// ─── Confetti helper ──────────────────────────────────────────────────────────
// Thin wrapper around react-native-confetti-cannon.
// Import triggerConfetti() anywhere and call it on savings goals / milestones.
//
// Install: npx expo install react-native-confetti-cannon
// (or: npm install react-native-confetti-cannon)

import { useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
// react-native-confetti-cannon exports a ref-based API.
// We expose a hook so screens can attach the ref and trigger easily.

export interface ConfettiRef {
  start: () => void;
}

// ─── Config presets ───────────────────────────────────────────────────────────

/** Standard celebration — hitting a savings goal, paying off a budget */
export const CONFETTI_PRESET = {
  count: 120,
  origin: { x: -10, y: 0 },   // fires from top-left corner
  fallSpeed: 3500,
  fadeOut: true,
  autoStart: false,
  colors: [
    '#ff6ec7', // candy pink
    '#c77dff', // purple
    '#3af4ff', // cyan
    '#6bff9e', // mint
    '#ffca3a', // yellow
    '#ff9f43', // orange
  ],
} as const;

/** Mini burst — smaller pop for streak milestone, first expense logged */
export const CONFETTI_MINI = {
  count: 60,
  origin: { x: -10, y: 0 },
  fallSpeed: 2800,
  fadeOut: true,
  autoStart: false,
  colors: ['#ff6ec7', '#c77dff', '#6bff9e'],
} as const;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useConfetti()
 *
 * Usage:
 *   const { confettiRef, shoot } = useConfetti();
 *
 *   <ConfettiCannon ref={confettiRef} {...CONFETTI_PRESET} />
 *
 *   // then on goal hit:
 *   shoot();
 */
export function useConfetti() {
  const confettiRef = useRef<ConfettiRef>(null);
  const shoot = () => confettiRef.current?.start();
  return { confettiRef, shoot };
}