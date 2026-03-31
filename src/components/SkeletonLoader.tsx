import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Shared shimmer hook — each instance pulses independently
// ---------------------------------------------------------------------------

function useShimmerStyle() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

// ---------------------------------------------------------------------------
// SkeletonBox — generic rectangular placeholder
// ---------------------------------------------------------------------------

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonBoxProps) {
  const animatedStyle = useShimmerStyle();

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: '#e5e7eb' },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard — shaped like a HabitWidget card
// ---------------------------------------------------------------------------

export function SkeletonCard() {
  const animatedStyle = useShimmerStyle();

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#e5e7eb',
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        },
        animatedStyle,
      ]}
    >
      {/* Icon */}
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#f3f4f6' }} />
      {/* Name */}
      <View style={{ width: '70%', height: 12, borderRadius: 6, backgroundColor: '#f3f4f6', marginTop: 10 }} />
      {/* Count */}
      <View style={{ width: '40%', height: 32, borderRadius: 6, backgroundColor: '#f3f4f6', marginTop: 14 }} />
      {/* Footer */}
      <View style={{ width: '60%', height: 10, borderRadius: 5, backgroundColor: '#f3f4f6', marginTop: 12 }} />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// SkeletonChartSection — placeholder for a bar chart + header stat row
// ---------------------------------------------------------------------------

export function SkeletonChartSection() {
  return (
    <View>
      {/* Stat row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <SkeletonBox width="35%" height={28} borderRadius={6} />
        <SkeletonBox width="25%" height={16} borderRadius={6} style={{ alignSelf: 'flex-end' }} />
      </View>
      {/* Bars */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 }}>
        {[60, 90, 45, 110, 75, 55, 100, 80, 65, 40, 95, 70].map((h, i) => (
          <SkeletonBox
            key={i}
            width={`${Math.floor(100 / 12)}%` as any}
            height={h}
            borderRadius={4}
          />
        ))}
      </View>
      {/* Month labels row */}
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBox key={i} width={`${Math.floor(100 / 12)}%` as any} height={10} borderRadius={5} style={{ marginHorizontal: 1 }} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SkeletonTrendRows — placeholder for WeeklyTrends
// ---------------------------------------------------------------------------

const TREND_WIDTHS: Array<`${number}%`> = ['72%', '55%', '88%', '45%', '80%', '60%', '68%'];

export function SkeletonTrendRows() {
  return (
    <View style={{ gap: 10 }}>
      {TREND_WIDTHS.map((w, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <SkeletonBox width="28%" height={12} borderRadius={6} />
          <SkeletonBox width={w} height={14} borderRadius={7} style={{ flex: 1 }} />
        </View>
      ))}
    </View>
  );
}
