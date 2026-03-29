import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface BlobProps {
  size: number;
  color: string;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  delay?: number;
  duration?: number;
}

function Blob({ size, color, top, bottom, left, right, delay = 0, duration = 3000 }: BlobProps) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: duration * 1.2, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: duration * 1.2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top: top as any,
          bottom: bottom as any,
          left: left as any,
          right: right as any,
        },
        animStyle,
      ]}
    />
  );
}

interface FloatingBlobsProps {
  variant?: 'dark' | 'light';
}

export default function FloatingBlobs({ variant = 'dark' }: FloatingBlobsProps) {
  if (variant === 'light') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Blob size={180} color="rgba(255,107,107,0.10)" top={-40} right={-40} delay={0} duration={3200} />
        <Blob size={130} color="rgba(255,159,67,0.10)" top={80} left={-30} delay={600} duration={2800} />
        <Blob size={100} color="rgba(255,202,58,0.10)" bottom={120} right={20} delay={1200} duration={3500} />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Blob size={200} color="rgba(255,110,199,0.12)" top={-60} right={-50} delay={0} duration={3200} />
      <Blob size={150} color="rgba(199,125,255,0.10)" top={100} left={-40} delay={800} duration={2800} />
      <Blob size={120} color="rgba(58,244,255,0.08)" bottom={150} right={-20} delay={400} duration={3600} />
    </View>
  );
}