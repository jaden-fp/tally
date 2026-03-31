import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { useHabitStore } from '../store/habitStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarEditorProps {
  habitId: string;
  color: string;
}

interface DayPopupState {
  date: string;         // "YYYY-MM-DD"
  label: string;        // "Mar 15, 2026"
  currentCount: number;
}

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------

function daysInMonth(year: number, month: number): number {
  // month is 0-indexed
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  // 0 = Sunday … 6 = Saturday
  return new Date(year, month, 1).getDay();
}

function toDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function formatLabel(year: number, month: number, day: number): string {
  return `${SHORT_MONTH_NAMES[month]} ${day}, ${year}`;
}

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const CalendarEditor = memo(function CalendarEditor({
  habitId,
  color,
}: CalendarEditorProps) {
  const { entries, loadEntriesForYear, setCount } = useHabitStore();

  const today = todayString();
  const todayDate = new Date();

  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [popup, setPopup] = useState<DayPopupState | null>(null);
  const [editCount, setEditCount] = useState(0);

  // Load entries whenever the viewed year changes
  useEffect(() => {
    loadEntriesForYear(habitId, viewYear);
  }, [habitId, viewYear, loadEntriesForYear]);

  // Build a fast lookup map: "YYYY-MM-DD" → count
  const countMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const e of entries[habitId] ?? []) {
      map[e.date] = e.count;
    }
    return map;
  }, [entries, habitId]);

  // Month navigation
  const goToPrevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const isNextMonthFuture = useMemo(() => {
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    return (
      nextYear > todayDate.getFullYear() ||
      (nextYear === todayDate.getFullYear() && nextMonth > todayDate.getMonth())
    );
  }, [viewMonth, viewYear, todayDate]);

  // Build grid cells: null = empty padding, number = day of month
  const gridCells = useMemo<(number | null)[]>(() => {
    const offset = firstDayOfMonth(viewYear, viewMonth);
    const total = daysInMonth(viewYear, viewMonth);
    const cells: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    // Pad to multiple of 7
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const handleDayPress = useCallback(
    (day: number) => {
      const dateStr = toDateString(viewYear, viewMonth, day);
      if (dateStr > today) return; // future — disabled
      const currentCount = countMap[dateStr] ?? 0;
      setPopup({
        date: dateStr,
        label: formatLabel(viewYear, viewMonth, day),
        currentCount,
      });
      setEditCount(currentCount);
    },
    [viewYear, viewMonth, today, countMap],
  );

  const handleSave = useCallback(async () => {
    if (!popup) return;
    await setCount(habitId, popup.date, editCount);
    setPopup(null);
  }, [popup, editCount, setCount, habitId]);

  return (
    <View className="bg-white rounded-2xl overflow-hidden">
      {/* Month navigation header */}
      <View
        className="flex-row items-center justify-between px-5 py-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <TouchableOpacity
          onPress={goToPrevMonth}
          activeOpacity={0.7}
          className="w-8 h-8 items-center justify-center"
        >
          <LucideIcons.ChevronLeft size={20} color={color} />
        </TouchableOpacity>

        <Text className="text-base font-semibold text-gray-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>

        <TouchableOpacity
          onPress={goToNextMonth}
          activeOpacity={0.7}
          disabled={isNextMonthFuture}
          className="w-8 h-8 items-center justify-center"
          style={{ opacity: isNextMonthFuture ? 0.3 : 1 }}
        >
          <LucideIcons.ChevronRight size={20} color={color} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week labels */}
      <View className="flex-row px-3 pt-3 pb-1">
        {DAY_LABELS.map((label, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="text-xs font-medium text-gray-400">{label}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View className="px-3 pb-4">
        {chunk(gridCells, 7).map((week, rowIdx) => (
          <View key={rowIdx} className="flex-row mb-1">
            {week.map((day, colIdx) => (
              <DayCell
                key={colIdx}
                day={day}
                dateStr={day ? toDateString(viewYear, viewMonth, day) : null}
                count={day ? (countMap[toDateString(viewYear, viewMonth, day)] ?? 0) : 0}
                today={today}
                color={color}
                onPress={handleDayPress}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Day edit popup */}
      {popup && (
        <DayEditPopup
          popup={popup}
          editCount={editCount}
          color={color}
          onIncrement={() => setEditCount((c) => c + 1)}
          onDecrement={() => setEditCount((c) => Math.max(0, c - 1))}
          onSave={handleSave}
          onClose={() => setPopup(null)}
        />
      )}
    </View>
  );
});

// ---------------------------------------------------------------------------
// DayCell
// ---------------------------------------------------------------------------

interface DayCellProps {
  day: number | null;
  dateStr: string | null;
  count: number;
  today: string;
  color: string;
  onPress: (day: number) => void;
}

const DayCell = memo(function DayCell({
  day,
  dateStr,
  count,
  today,
  color,
  onPress,
}: DayCellProps) {
  if (!day || !dateStr) {
    return <View className="flex-1 aspect-square" />;
  }

  const isFuture = dateStr > today;
  const isToday = dateStr === today;
  const hasCount = count > 0;

  return (
    <Pressable
      onPress={() => !isFuture && onPress(day)}
      disabled={isFuture}
      className="flex-1 aspect-square items-center justify-center"
    >
      {({ pressed }) => (
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={[
            hasCount
              ? { backgroundColor: color }
              : isToday
              ? { backgroundColor: `${color}20`, borderWidth: 1.5, borderColor: color }
              : undefined,
            pressed && !isFuture ? { opacity: 0.7 } : undefined,
          ]}
        >
          <Text
            className="text-xs font-semibold"
            style={{
              color: isFuture
                ? '#d1d5db'
                : hasCount
                ? '#ffffff'
                : isToday
                ? color
                : '#374151',
            }}
          >
            {day}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// DayEditPopup
// ---------------------------------------------------------------------------

interface DayEditPopupProps {
  popup: DayPopupState;
  editCount: number;
  color: string;
  onIncrement: () => void;
  onDecrement: () => void;
  onSave: () => void;
  onClose: () => void;
}

const DayEditPopup = memo(function DayEditPopup({
  popup,
  editCount,
  color,
  onIncrement,
  onDecrement,
  onSave,
  onClose,
}: DayEditPopupProps) {
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/40 items-center justify-center px-8"
        onPress={onClose}
      >
        {/* Card — stop propagation */}
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="bg-white rounded-2xl px-6 pt-5 pb-6 w-72 shadow-lg">
            {/* Date label */}
            <Text className="text-center text-sm font-medium text-gray-400 mb-4">
              {popup.label}
            </Text>

            {/* Count + steppers */}
            <View className="flex-row items-center justify-between mb-5">
              <TouchableOpacity
                onPress={onDecrement}
                activeOpacity={0.7}
                className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center"
              >
                <LucideIcons.Minus size={18} color="#374151" />
              </TouchableOpacity>

              <Text
                className="text-5xl font-bold"
                style={{ color, lineHeight: 56, minWidth: 64, textAlign: 'center' }}
              >
                {editCount}
              </Text>

              <TouchableOpacity
                onPress={onIncrement}
                activeOpacity={0.7}
                className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center"
              >
                <LucideIcons.Plus size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Save button */}
            <TouchableOpacity
              onPress={onSave}
              activeOpacity={0.85}
              className="py-3.5 rounded-xl items-center"
              style={{ backgroundColor: color }}
            >
              <Text className="text-white text-sm font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
