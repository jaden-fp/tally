import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabitStore } from '../../src/store/habitStore';
import { HabitForm } from '../../src/components/HabitForm';
import { SkeletonChartSection, SkeletonTrendRows } from '../../src/components/SkeletonLoader';
import { MonthlyBarChart } from '../../src/components/MonthlyBarChart';
import { WeeklyTrends } from '../../src/components/WeeklyTrends';
import { CalendarEditor } from '../../src/components/CalendarEditor';
import type { Habit } from '../../src/types';

// ---------------------------------------------------------------------------
// Constants / helpers
// ---------------------------------------------------------------------------

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>;

function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return LucideIcons.Circle as LucideIcon;
  const key = name
    .split(/[-_\s]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('') as keyof typeof LucideIcons;
  return (LucideIcons[key] as LucideIcon | undefined) ?? (LucideIcons.Circle as LucideIcon);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function toDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    habits,
    entries,
    loadEntriesForYear,
    editHabit,
    removeHabit,
    getMonthlyTotals,
    getCurrentStreak,
    getBestStreak,
  } = useHabitStore();

  const habit = habits.find((h) => h.id === id);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(true);

  // Load entries when year changes
  useEffect(() => {
    if (!habit) return;
    setEntriesLoading(true);
    loadEntriesForYear(habit.id, viewYear).finally(() => setEntriesLoading(false));
  }, [habit, viewYear, loadEntriesForYear]);

  const color = habit?.color ?? '#5b9cf6';
  const Icon = resolveIcon(habit?.icon);

  // Monthly totals for the bar chart
  const monthlyTotals = useMemo(
    () =>
      getMonthlyTotals(id ?? '', viewYear).map((total, i) => ({
        month: SHORT_MONTHS[i],
        total,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, viewYear, entries],
  );

  const yearTotal = monthlyTotals.reduce((s, m) => s + m.total, 0);
  const average = yearTotal / 12;

  const habitEntries = useMemo(() => entries[id ?? ''] ?? [], [entries, id]);

  // Streaks
  const currentStreak = habit?.goalEnabled ? getCurrentStreak(id ?? '') : 0;
  const bestStreak = habit?.goalEnabled ? getBestStreak(id ?? '') : 0;

  const handleYearPrev = useCallback(() => setViewYear((y) => y - 1), []);
  const handleYearNext = useCallback(() => {
    if (viewYear < today.getFullYear()) setViewYear((y) => y + 1);
  }, [viewYear, today]);

  if (!habit) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-400">Habit not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center" activeOpacity={0.7}>
          <LucideIcons.ChevronLeft size={22} color={color} />
        </TouchableOpacity>

        <View className="flex-row items-center gap-x-2.5 flex-1 mx-3">
          <Icon size={22} color={color} />
          <Text
            className="text-base font-bold flex-1"
            style={{ color: '#1a1a1a' }}
            numberOfLines={1}
          >
            {habit.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setEditVisible(true)}
          className="w-8 h-8 items-center justify-center"
          activeOpacity={0.7}
        >
          <LucideIcons.Settings size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Year navigation */}
        <View className="flex-row items-center justify-center gap-x-5 mt-5 mb-1">
          <TouchableOpacity onPress={handleYearPrev} activeOpacity={0.7}>
            <LucideIcons.ChevronLeft size={18} color={color} />
          </TouchableOpacity>
          <Text className="text-sm font-semibold text-gray-700 w-12 text-center">
            {viewYear}
          </Text>
          <TouchableOpacity
            onPress={handleYearNext}
            disabled={viewYear >= today.getFullYear()}
            activeOpacity={0.7}
            style={{ opacity: viewYear >= today.getFullYear() ? 0.25 : 1 }}
          >
            <LucideIcons.ChevronRight size={18} color={color} />
          </TouchableOpacity>
        </View>

        {/* ── Section: Year overview ── */}
        <Section>
          {entriesLoading ? (
            <SkeletonChartSection />
          ) : (
            <MonthlyBarChart
              data={monthlyTotals}
              color={color}
              average={average}
              onMonthPress={setSelectedMonth}
            />
          )}
        </Section>

        {/* ── Section: Monthly drill-down ── */}
        {!entriesLoading && (
          <MonthDrillDown
            selectedMonth={selectedMonth}
            year={viewYear}
            habitId={id ?? ''}
            color={color}
          />
        )}

        {/* ── Section: Weekly trends ── */}
        <Section>
          {entriesLoading ? (
            <SkeletonTrendRows />
          ) : (
            <WeeklyTrends entries={habitEntries} color={color} />
          )}
        </Section>

        {/* ── Section: Streaks ── */}
        {habit.goalEnabled && (
          <Section>
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Streaks
            </Text>
            <View className="flex-row gap-x-3">
              <StreakCard
                icon="Flame"
                label="Current"
                value={currentStreak}
                unit="day streak"
                color={color}
              />
              <StreakCard
                icon="Trophy"
                label="Best ever"
                value={bestStreak}
                unit="days"
                color={color}
              />
            </View>
          </Section>
        )}

        {/* ── Edit history button ── */}
        <View className="px-4 mt-2 mb-2">
          <TouchableOpacity
            onPress={() => setCalendarVisible(true)}
            className="flex-row items-center justify-center gap-x-2 py-3.5 rounded-2xl border border-gray-200 bg-white"
            activeOpacity={0.7}
          >
            <LucideIcons.CalendarDays size={16} color="#6b7280" />
            <Text className="text-sm font-medium text-gray-600">Edit History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Calendar editor modal ── */}
      <Modal
        visible={calendarVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
          <View className="flex-row items-center justify-between px-5 py-4">
            <Text className="text-base font-semibold text-gray-900">Edit History</Text>
            <TouchableOpacity onPress={() => setCalendarVisible(false)} activeOpacity={0.7}>
              <Text className="text-sm text-gray-500">Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <CalendarEditor habitId={id ?? ''} color={color} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Edit habit form ── */}
      <HabitForm
        visible={editVisible}
        mode="edit"
        initialValues={habit}
        onSubmit={(data) => editHabit(habit.id, data)}
        onDelete={() => { removeHabit(habit.id); router.back(); }}
        onClose={() => setEditVisible(false)}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

const Section = memo(function Section({ children }: { children: React.ReactNode }) {
  return (
    <View className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
      {children}
    </View>
  );
});

// ---------------------------------------------------------------------------
// MonthDrillDown — animated expand/collapse
// ---------------------------------------------------------------------------

interface MonthDrillDownProps {
  selectedMonth: number | null;
  year: number;
  habitId: string;
  color: string;
}

const MonthDrillDown = memo(function MonthDrillDown({
  selectedMonth,
  year,
  habitId,
  color,
}: MonthDrillDownProps) {
  const { entries } = useHabitStore();
  const heightAnim = useSharedValue(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [renderedMonth, setRenderedMonth] = useState<number | null>(null);

  // Keep content rendered during collapse animation
  useEffect(() => {
    if (selectedMonth !== null) setRenderedMonth(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedMonth !== null && contentHeight > 0) {
      heightAnim.value = withSpring(contentHeight + 32, { damping: 18, stiffness: 120 });
    } else if (selectedMonth === null) {
      heightAnim.value = withSpring(0, { damping: 18, stiffness: 120 });
    }
  }, [selectedMonth, contentHeight, heightAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
    overflow: 'hidden',
  }));

  const countMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const e of entries[habitId] ?? []) {
      map[e.date] = e.count;
    }
    return map;
  }, [entries, habitId]);

  if (renderedMonth === null) return null;

  const month = renderedMonth;
  const totalDays = daysInMonth(year, month);
  const today = todayString();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const monthTotal = days.reduce((sum, d) => {
    const key = toDateString(year, month, d);
    return sum + (countMap[key] ?? 0);
  }, 0);
  const trackedDays = days.filter((d) => (countMap[toDateString(year, month, d)] ?? 0) > 0).length;
  const dailyAvg = trackedDays > 0 ? (monthTotal / totalDays).toFixed(1) : '0';

  return (
    <Animated.View style={[animatedStyle, { marginHorizontal: 16, marginTop: 3 }]}>
      <View
        className="bg-white rounded-2xl p-4 shadow-sm"
        onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
      >
        {/* Month title + stats */}
        <View className="flex-row items-baseline justify-between mb-3">
          <Text className="text-sm font-bold text-gray-900">
            {FULL_MONTHS[month]} {year}
          </Text>
          <View className="flex-row gap-x-3">
            <Text className="text-xs text-gray-400">
              <Text className="text-xs font-semibold text-gray-600">{monthTotal}</Text> total
            </Text>
            <Text className="text-xs text-gray-400">
              <Text className="text-xs font-semibold text-gray-600">{dailyAvg}</Text>/day avg
            </Text>
          </View>
        </View>

        {/* Day grid — 7 per row */}
        <View className="flex-row flex-wrap">
          {days.map((day) => {
            const dateStr = toDateString(year, month, day);
            const count = countMap[dateStr] ?? 0;
            const isFuture = dateStr > today;
            const hasCount = count > 0;

            return (
              <View
                key={day}
                style={{ width: `${100 / 7}%`, alignItems: 'center', marginBottom: 6 }}
              >
                <View
                  className="w-9 h-9 rounded-lg items-center justify-center"
                  style={
                    hasCount
                      ? { backgroundColor: `${color}22` }
                      : undefined
                  }
                >
                  <Text
                    className="text-xs"
                    style={{
                      color: isFuture ? '#d1d5db' : hasCount ? color : '#9ca3af',
                      fontWeight: hasCount ? '700' : '400',
                      fontSize: 11,
                    }}
                  >
                    {day}
                  </Text>
                  {hasCount && (
                    <Text style={{ fontSize: 9, color, fontWeight: '600', marginTop: -1 }}>
                      {count}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// StreakCard
// ---------------------------------------------------------------------------

interface StreakCardProps {
  icon: 'Flame' | 'Trophy';
  label: string;
  value: number;
  unit: string;
  color: string;
}

const StreakCard = memo(function StreakCard({
  icon,
  label,
  value,
  unit,
  color,
}: StreakCardProps) {
  const IconComp = icon === 'Flame' ? LucideIcons.Flame : LucideIcons.Trophy;
  return (
    <View className="flex-1 bg-gray-50 rounded-xl p-3">
      <View className="flex-row items-center gap-x-1.5 mb-1">
        <IconComp size={14} color={color} />
        <Text className="text-xs font-medium text-gray-400">{label}</Text>
      </View>
      <Text className="text-2xl font-bold" style={{ color }}>
        {value}
      </Text>
      <Text className="text-xs text-gray-400 mt-0.5">{unit}</Text>
    </View>
  );
});

