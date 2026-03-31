import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import type { Entry } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeeklyTrendsProps {
  entries: Entry[]; // all entries for the habit (any year slice)
  color: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// ISO weekday order: Mon=0 … Sun=6
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_BAR_WIDTH = 120; // px

// ---------------------------------------------------------------------------
// WeeklyTrends
// ---------------------------------------------------------------------------

export const WeeklyTrends = memo(function WeeklyTrends({
  entries,
  color,
}: WeeklyTrendsProps) {
  const averages = useMemo(() => computeWeekdayAverages(entries), [entries]);
  const max = Math.max(...averages, 0.01); // avoid divide-by-zero

  return (
    <View>
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Day of Week
      </Text>

      {DAY_LABELS.map((label, i) => {
        const avg = averages[i];
        const barWidth = (avg / max) * MAX_BAR_WIDTH;
        const isEmpty = avg === 0;

        return (
          <View key={i} className="flex-row items-center mb-2.5">
            {/* Day label */}
            <Text
              className="text-xs font-medium text-gray-400"
              style={{ width: 30 }}
            >
              {label}
            </Text>

            {/* Bar */}
            <View className="flex-1 flex-row items-center">
              <View
                style={{
                  height: 8,
                  width: isEmpty ? 2 : barWidth,
                  backgroundColor: isEmpty ? '#e5e7eb' : color,
                  borderRadius: 4,
                  opacity: isEmpty ? 1 : 0.75,
                }}
              />
            </View>

            {/* Average label */}
            <Text
              className="text-xs font-medium"
              style={{
                color: isEmpty ? '#d1d5db' : '#374151',
                width: 32,
                textAlign: 'right',
              }}
            >
              {isEmpty ? '—' : avg % 1 === 0 ? avg.toFixed(0) : avg.toFixed(1)}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Weekday average calculation
// ---------------------------------------------------------------------------

/**
 * Returns an array of 7 numbers: average count per occurrence of each weekday.
 * Index 0 = Monday, index 6 = Sunday (ISO order).
 */
function computeWeekdayAverages(entries: Entry[]): number[] {
  // sums[i] = total count on weekday i
  // counts[i] = number of distinct dates with that weekday (denominator)
  const sums = new Array<number>(7).fill(0);
  const counts = new Array<number>(7).fill(0);

  for (const entry of entries) {
    if (entry.count <= 0) continue;
    const dayOfWeek = isoWeekday(entry.date); // 0=Mon … 6=Sun
    sums[dayOfWeek] += entry.count;
    counts[dayOfWeek]++;
  }

  return sums.map((sum, i) => (counts[i] === 0 ? 0 : sum / counts[i]));
}

/** Returns ISO weekday index: 0=Monday … 6=Sunday */
function isoWeekday(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const jsDay = d.getUTCDay(); // 0=Sun … 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0 … Sun=6
}
