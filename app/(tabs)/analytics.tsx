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
import * as LucideIcons from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHabitStore } from '../../src/store/habitStore';
import { SkeletonChartSection } from '../../src/components/SkeletonLoader';
import type { Habit } from '../../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>;

function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return LucideIcons.Circle as LucideIcon;
  const key = name
    .split(/[-_\s]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('') as keyof typeof LucideIcons;
  return (LucideIcons[key] as LucideIcon | undefined) ?? (LucideIcons.Circle as LucideIcon);
}

// ---------------------------------------------------------------------------
// Analytics Screen
// ---------------------------------------------------------------------------

export default function AnalyticsScreen() {
  const { habits, isLoading, loadHabits, loadEntriesForYear, getMonthlyTotals, getCurrentStreak } =
    useHabitStore();
  const [refreshing, setRefreshing] = useState(false);
  const [entriesReady, setEntriesReady] = useState(false);
  const currentYear = new Date().getFullYear();

  // Load habits + entries for all habits on mount
  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  useEffect(() => {
    if (habits.length === 0) return;
    setEntriesReady(false);
    Promise.all(habits.map((h) => loadEntriesForYear(h.id, currentYear))).then(
      () => setEntriesReady(true),
    );
  // habits.length as dep is intentional — re-load when habits are added/removed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits.length, currentYear]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  }, [loadHabits]);

  const keyExtractor = useCallback((item: Habit) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Habit }) => (
      <HabitStatRow
        habit={item}
        year={currentYear}
        getMonthlyTotals={getMonthlyTotals}
        getCurrentStreak={getCurrentStreak}
      />
    ),
    [currentYear, getMonthlyTotals, getCurrentStreak],
  );

  const showSkeleton = (isLoading || !entriesReady) && habits.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <Text className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          Overview
        </Text>
        <Text className="text-xl font-bold text-gray-900 mt-0.5">
          Analytics
        </Text>
      </View>

      {showSkeleton ? (
        <View className="mx-4 mt-2 bg-white rounded-2xl p-4">
          <SkeletonChartSection />
        </View>
      ) : habits.length === 0 ? (
        <EmptyAnalytics />
      ) : (
        <FlatList
          data={habits}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<SummaryHeader habits={habits} year={currentYear} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// SummaryHeader — yearly totals across all habits
// ---------------------------------------------------------------------------

interface SummaryHeaderProps {
  habits: Habit[];
  year: number;
}

const SummaryHeader = memo(function SummaryHeader({ habits, year }: SummaryHeaderProps) {
  const getMonthlyTotals = useHabitStore((s) => s.getMonthlyTotals);

  const yearTotal = useMemo(
    () =>
      habits.reduce((sum, h) => {
        const monthly = getMonthlyTotals(h.id, year);
        return sum + monthly.reduce((s, m) => s + m, 0);
      }, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habits, year],
  );

  return (
    <View className="flex-row gap-x-3 mb-4 mt-1">
      <StatCard label="Habits" value={String(habits.length)} />
      <StatCard label={`${year} total`} value={String(yearTotal)} />
    </View>
  );
});

const StatCard = memo(function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-400 mt-0.5">{label}</Text>
    </View>
  );
});

// ---------------------------------------------------------------------------
// HabitStatRow — one row per habit showing yearly total + streak
// ---------------------------------------------------------------------------

interface HabitStatRowProps {
  habit: Habit;
  year: number;
  getMonthlyTotals: (habitId: string, year: number) => number[];
  getCurrentStreak: (habitId: string) => number;
}

const HabitStatRow = memo(function HabitStatRow({
  habit,
  year,
  getMonthlyTotals,
  getCurrentStreak,
}: HabitStatRowProps) {
  const router = useRouter();
  const Icon = resolveIcon(habit.icon);
  const color = habit.color ?? '#5b9cf6';

  const { yearTotal, monthlyAvg } = useMemo(() => {
    const monthly = getMonthlyTotals(habit.id, year);
    const total = monthly.reduce((s, m) => s + m, 0);
    const nonZeroMonths = monthly.filter((m) => m > 0).length;
    return {
      yearTotal: total,
      monthlyAvg: nonZeroMonths > 0 ? (total / nonZeroMonths).toFixed(1) : '—',
    };
  }, [habit.id, year, getMonthlyTotals]);

  const streak = habit.goalEnabled ? getCurrentStreak(habit.id) : null;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/habit/${habit.id}`)}
      activeOpacity={0.7}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <View className="flex-row items-center">
        {/* Icon + name */}
        <View
          className="w-9 h-9 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: `${color}22` }}
        >
          <Icon size={18} color={color} />
        </View>

        <Text
          className="flex-1 text-sm font-semibold text-gray-900"
          numberOfLines={1}
        >
          {habit.name}
        </Text>

        {/* Drill-down chevron */}
        <LucideIcons.ChevronRight size={16} color="#d1d5db" />
      </View>

      {/* Stats row */}
      <View className="flex-row mt-3 gap-x-4">
        <View>
          <Text className="text-xl font-bold" style={{ color }}>
            {yearTotal}
          </Text>
          <Text className="text-xs text-gray-400">year total</Text>
        </View>

        <View>
          <Text className="text-xl font-bold text-gray-700">{monthlyAvg}</Text>
          <Text className="text-xs text-gray-400">/ month avg</Text>
        </View>

        {streak !== null && (
          <View>
            <View className="flex-row items-center gap-x-1">
              <LucideIcons.Flame size={14} color={color} />
              <Text className="text-xl font-bold" style={{ color }}>
                {streak}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">streak</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ---------------------------------------------------------------------------
// EmptyAnalytics
// ---------------------------------------------------------------------------

const EmptyAnalytics = memo(function EmptyAnalytics() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
        <LucideIcons.BarChart3 size={32} color="#d1d5db" />
      </View>
      <Text className="text-base font-semibold text-gray-400 text-center">
        No data yet
      </Text>
      <Text className="text-sm text-gray-300 text-center mt-1">
        Create habits on the Track tab to see analytics here.
      </Text>
    </View>
  );
});
