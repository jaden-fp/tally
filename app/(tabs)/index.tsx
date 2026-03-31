import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as LucideIcons from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HabitWidget from '../../src/components/HabitWidget';
import { HabitForm } from '../../src/components/HabitForm';
import { SkeletonCard } from '../../src/components/SkeletonLoader';
import { useHabitStore } from '../../src/store/habitStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTodayHeader(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

// Approximate height of one HabitWidget card + its bottom margin.
// Used by getItemLayout to avoid layout measurement on every scroll.
// With numColumns={2} both items in a row share the same row height.
const CARD_ROW_HEIGHT = 200;

// ---------------------------------------------------------------------------
// Track Tab
// ---------------------------------------------------------------------------

export default function TrackScreen() {
  const { habits, isLoading, loadHabits, getTodayCount, addHabit } = useHabitStore();
  const [createVisible, setCreateVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  }, [loadHabits]);

  // Precompute today counts so HabitWidget doesn't call the store inline
  const todayCounts = useMemo(
    () => Object.fromEntries(habits.map((h) => [h.id, getTodayCount(h.id)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habits],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof habits)[number]; index: number }) => (
      <View
        className="flex-1"
        style={{
          marginLeft: index % 2 === 0 ? 0 : 6,
          marginRight: index % 2 === 0 ? 6 : 0,
          marginBottom: 12,
        }}
      >
        <HabitWidget
          habit={item}
          todayCount={todayCounts[item.id] ?? 0}
          lastTrackedDaysAgo={null}
        />
      </View>
    ),
    [todayCounts],
  );

  const keyExtractor = useCallback((item: (typeof habits)[number]) => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <View>
          <Text className="text-xs font-medium text-gray-400 uppercase tracking-widest">
            Today
          </Text>
          <Text className="text-xl font-bold text-gray-900 mt-0.5">
            {formatTodayHeader(new Date())}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setCreateVisible(true)}
          className="w-9 h-9 rounded-full bg-gray-900 items-center justify-center"
          activeOpacity={0.75}
        >
          <LucideIcons.Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List / Empty state / Skeleton */}
      {isLoading && habits.length === 0 ? (
        <HabitGridSkeleton />
      ) : habits.length === 0 ? (
        <EmptyState onAdd={() => setCreateVisible(true)} />
      ) : (
        <FlatList
          data={habits}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 }}
          getItemLayout={(_data, index) => ({
            length: CARD_ROW_HEIGHT,
            offset: CARD_ROW_HEIGHT * Math.floor(index / 2),
            index,
          })}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* Create habit form */}
      <HabitForm
        visible={createVisible}
        mode="create"
        onSubmit={(data) => addHabit(data)}
        onClose={() => setCreateVisible(false)}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

const EmptyState = memo(function EmptyState({ onAdd }: { onAdd: () => void }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Animated.View
        style={pulseStyle}
        className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4"
      >
        <LucideIcons.Sparkles size={32} color="#d1d5db" />
      </Animated.View>
      <Text className="text-base font-semibold text-gray-400 text-center">
        No habits yet
      </Text>
      <Text className="text-sm text-gray-300 text-center mt-1">
        Tap{' '}
        <Text
          className="text-gray-700 font-semibold"
          onPress={onAdd}
        >
          +
        </Text>{' '}
        to start tracking
      </Text>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Habit Grid Skeleton
// ---------------------------------------------------------------------------

const HabitGridSkeleton = memo(function HabitGridSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
      {[0, 1].map((row) => (
        <View key={row} style={{ flexDirection: 'row', marginBottom: 12 }}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <SkeletonCard />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <SkeletonCard />
          </View>
        </View>
      ))}
    </View>
  );
});

