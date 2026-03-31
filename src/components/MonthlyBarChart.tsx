import React, { memo, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BAR_HEIGHT = 120; // px — tallest possible bar
const TOOLTIP_SPACE = 36;  // px — reserved above bars for tooltips
const CHART_HEIGHT = MAX_BAR_HEIGHT + TOOLTIP_SPACE;
const MIN_FILLED_HEIGHT = 4; // ensure non-zero bars are always visible

const MONTH_SHORTS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MonthlyBarChartProps {
  data: { month: string; total: number }[]; // 12 items, Jan → Dec
  color: string;
  average: number;
  /** Called with the 0-indexed month when a bar is tapped. */
  onMonthPress?: (monthIndex: number) => void;
}

// ---------------------------------------------------------------------------
// MonthlyBarChart
// ---------------------------------------------------------------------------

export const MonthlyBarChart = memo(function MonthlyBarChart({
  data,
  color,
  average,
  onMonthPress,
}: MonthlyBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const currentMonthIndex = new Date().getMonth();
  const maxValue = Math.max(...data.map((d) => d.total), 1);
  const total = data.reduce((sum, d) => sum + d.total, 0);
  const avgDisplay = average.toFixed(1);

  // Position of the average line from the bottom of the bars area (in px)
  const avgLineBottom = (average / maxValue) * MAX_BAR_HEIGHT;

  const handleBarPress = (index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
    onMonthPress?.(index);
  };

  return (
    <View>
      {/* Summary stats */}
      <View className="flex-row items-baseline justify-between mb-5">
        <Text className="text-2xl font-bold text-gray-900">
          {total}{' '}
          <Text className="text-sm font-normal text-gray-400">total</Text>
        </Text>
        <Text className="text-sm text-gray-400">
          <Text className="text-sm font-semibold text-gray-600">{avgDisplay}</Text>
          {' / month'}
        </Text>
      </View>

      {/* Chart area */}
      <View style={{ height: CHART_HEIGHT }}>
        {/* Bars row (stretched to full chart height; bars are bottom-aligned inside) */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: CHART_HEIGHT,
            flexDirection: 'row',
          }}
        >
          {data.map((item, index) => {
            const barHeight =
              item.total > 0
                ? Math.max((item.total / maxValue) * MAX_BAR_HEIGHT, MIN_FILLED_HEIGHT)
                : 0;
            const isSelected = selectedIndex === index;
            const isCurrentMonth = index === currentMonthIndex;

            return (
              <Pressable
                key={index}
                onPress={() => handleBarPress(index)}
                style={{
                  flex: 1,
                  height: CHART_HEIGHT,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  overflow: 'visible',
                }}
              >
                {/* Tooltip */}
                {isSelected && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: barHeight + 6,
                      left: 0,
                      right: 0,
                      alignItems: 'center',
                      zIndex: 20,
                    }}
                    pointerEvents="none"
                  >
                    <View
                      className="rounded-lg px-2 py-1"
                      style={{ backgroundColor: '#1f2937' }}
                    >
                      <Text className="text-white" style={{ fontSize: 10, fontWeight: '600' }}>
                        {MONTH_NAMES[index]}: {item.total}
                      </Text>
                    </View>
                    {/* Caret */}
                    <View
                      style={{
                        width: 0,
                        height: 0,
                        borderLeftWidth: 4,
                        borderRightWidth: 4,
                        borderTopWidth: 4,
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                        borderTopColor: '#1f2937',
                        marginTop: -1,
                      }}
                    />
                  </View>
                )}

                {/* Animated bar */}
                <AnimatedBar
                  targetHeight={barHeight}
                  delay={index * 40}
                  color={color}
                  opacity={isCurrentMonth ? 1 : 0.75}
                  highlighted={isSelected}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Average dashed line — positioned absolutely over the bars */}
        {average > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: avgLineBottom,
              left: 0,
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            pointerEvents="none"
          >
            {/* Label */}
            <Text
              style={{
                fontSize: 9,
                fontWeight: '600',
                color,
                opacity: 0.7,
                marginRight: 4,
                width: 34,
              }}
            >
              avg {avgDisplay}
            </Text>
            {/* Dashed line (manually drawn for cross-platform reliability) */}
            <DashedLine color={color} />
          </View>
        )}
      </View>

      {/* Month labels */}
      <View className="flex-row mt-1">
        {MONTH_SHORTS.map((label, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: i === new Date().getMonth() ? '700' : '400',
                color: i === new Date().getMonth() ? color : '#9ca3af',
              }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// AnimatedBar
// ---------------------------------------------------------------------------

interface AnimatedBarProps {
  targetHeight: number;
  delay: number;
  color: string;
  opacity: number;
  highlighted: boolean;
}

const AnimatedBar = memo(function AnimatedBar({
  targetHeight,
  delay,
  color,
  opacity,
  highlighted,
}: AnimatedBarProps) {
  const heightAnim = useSharedValue(0);

  // Animate on mount and whenever targetHeight changes (new data / year change)
  useEffect(() => {
    heightAnim.value = 0;
    heightAnim.value = withDelay(
      delay,
      withSpring(targetHeight, { damping: 14, stiffness: 120, mass: 0.8 }),
    );
  }, [targetHeight, delay, heightAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: '68%',
          backgroundColor: color,
          opacity: highlighted ? 1 : opacity,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
        },
        animatedStyle,
      ]}
    />
  );
});

// ---------------------------------------------------------------------------
// DashedLine — manually rendered for cross-platform reliability
// ---------------------------------------------------------------------------

const DASH_WIDTH = 4;
const GAP_WIDTH = 3;

const DashedLine = memo(function DashedLine({ color }: { color: string }) {
  // Render enough dashes to fill the available width
  // 60 dashes × (4+3)px = 420px — more than enough for any phone width
  const dashCount = 60;

  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
      {Array.from({ length: dashCount }).map((_, i) => (
        <View
          key={i}
          style={{
            width: DASH_WIDTH,
            height: 1,
            backgroundColor: color,
            opacity: 0.5,
            marginRight: GAP_WIDTH,
          }}
        />
      ))}
    </View>
  );
});
