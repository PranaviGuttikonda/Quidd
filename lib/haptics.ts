import * as Haptics from 'expo-haptics';

// Soft tap — logging an expense
export const tapHaptic = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium — confirming / saving
export const confirmHaptic = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy thud — over budget warning
export const warningHaptic = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Triple buzz — milestone / goal reached
export const celebrateHaptic = async () => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 150);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
};

// Error — something went wrong
export const errorHaptic = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);