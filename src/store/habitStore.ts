import { Alert } from 'react-native';
import { create } from 'zustand';
import type { Habit, NewHabit, Entry } from '../types';
import { getTodayString } from '../utils/dateHelpers';
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  getEntries,
  setEntry,
} from '../services/firebase';

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

interface HabitState {
  habits: Habit[];
  entries: Record<string, Entry[]>; // keyed by habitId
  isLoading: boolean;
  selectedYear: number;
  todayDate: string;
  userId: string;

  // Auth
  setUserId: (id: string) => void;

  // Actions
  loadHabits: () => Promise<void>;
  loadEntriesForYear: (habitId: string, year: number) => Promise<void>;
  addHabit: (habit: NewHabit) => Promise<void>;
  editHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  increment: (habitId: string, date?: string) => Promise<void>;
  decrement: (habitId: string, date?: string) => Promise<void>;
  setCount: (habitId: string, date: string, count: number) => Promise<void>;

  // Derived getters
  getTodayCount: (habitId: string) => number;
  getMonthlyTotals: (habitId: string, year: number) => number[];
  getCurrentStreak: (habitId: string) => number;
  getBestStreak: (habitId: string) => number;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  entries: {},
  isLoading: false,
  selectedYear: new Date().getFullYear(),
  todayDate: getTodayString(),
  userId: '',

  // -------------------------------------------------------------------------
  // setUserId
  // -------------------------------------------------------------------------
  setUserId(id) {
    set({ userId: id });
  },

  // -------------------------------------------------------------------------
  // loadHabits
  // -------------------------------------------------------------------------
  async loadHabits() {
    const userId = get().userId;
    if (!userId) return;
    set({ isLoading: true });
    try {
      const habits = await getHabits(userId);
      set({ habits });
    } catch (err) {
      console.error('loadHabits failed:', err);
      Alert.alert('Error', "Couldn't load habits — please try again.");
    } finally {
      set({ isLoading: false });
    }
  },

  // -------------------------------------------------------------------------
  // loadEntriesForYear
  // -------------------------------------------------------------------------
  async loadEntriesForYear(habitId, year) {
    try {
      const fetched = await getEntries(habitId, year);
      set((state) => ({
        entries: {
          ...state.entries,
          [habitId]: mergeEntries(state.entries[habitId] ?? [], fetched),
        },
      }));
    } catch (err) {
      console.error(`loadEntriesForYear(${habitId}, ${year}) failed:`, err);
      Alert.alert('Error', "Couldn't load history — please try again.");
    }
  },

  // -------------------------------------------------------------------------
  // addHabit — optimistic
  // -------------------------------------------------------------------------
  async addHabit(habit) {
    const userId = get().userId;
    const habitWithUser: NewHabit = { ...habit, userId };

    const tempId = `temp_${Date.now()}`;
    const optimistic: Habit = {
      ...habitWithUser,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ habits: [...state.habits, optimistic] }));

    try {
      const created = await createHabit(habitWithUser);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === tempId ? created : h)),
      }));
    } catch (err) {
      console.error('addHabit failed, reverting:', err);
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== tempId),
      }));
      Alert.alert('Error', "Couldn't save — please try again.");
    }
  },

  // -------------------------------------------------------------------------
  // editHabit — optimistic
  // -------------------------------------------------------------------------
  async editHabit(id, updates) {
    const prev = get().habits.find((h) => h.id === id);
    if (!prev) return;

    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, ...updates } : h,
      ),
    }));

    try {
      await updateHabit(id, updates);
    } catch (err) {
      console.error('editHabit failed, reverting:', err);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? prev : h)),
      }));
      Alert.alert('Error', "Couldn't save — please try again.");
    }
  },

  // -------------------------------------------------------------------------
  // removeHabit — optimistic
  // -------------------------------------------------------------------------
  async removeHabit(id) {
    const prev = get().habits;

    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    }));

    try {
      await deleteHabit(id);
    } catch (err) {
      console.error('removeHabit failed, reverting:', err);
      set({ habits: prev });
      Alert.alert('Error', "Couldn't save — please try again.");
    }
  },

  // -------------------------------------------------------------------------
  // increment — optimistic
  // -------------------------------------------------------------------------
  async increment(habitId, date) {
    const targetDate = date ?? get().todayDate;
    const current = getEntryCount(get().entries[habitId], targetDate);
    const nextCount = current + 1;

    applyOptimisticEntry(set, habitId, targetDate, nextCount);

    try {
      await setEntry(habitId, targetDate, nextCount);
    } catch (err) {
      console.error('increment failed, reverting:', err);
      applyOptimisticEntry(set, habitId, targetDate, current);
      Alert.alert('Error', "Couldn't save — please try again.");
    }
  },

  // -------------------------------------------------------------------------
  // decrement — optimistic
  // -------------------------------------------------------------------------
  async decrement(habitId, date) {
    const targetDate = date ?? get().todayDate;
    const current = getEntryCount(get().entries[habitId], targetDate);
    const nextCount = Math.max(0, current - 1);

    applyOptimisticEntry(set, habitId, targetDate, nextCount);

    try {
      await setEntry(habitId, targetDate, nextCount);
    } catch (err) {
      console.error('decrement failed, reverting:', err);
      applyOptimisticEntry(set, habitId, targetDate, current);
      Alert.alert('Error', "Couldn't save — please try again.");
    }
  },

  // -------------------------------------------------------------------------
  // setCount — optimistic
  // -------------------------------------------------------------------------
  async setCount(habitId, date, count) {
    const current = getEntryCount(get().entries[habitId], date);

    applyOptimisticEntry(set, habitId, date, count);

    try {
      await setEntry(habitId, date, count);
    } catch (err) {
      console.error('setCount failed, reverting:', err);
      applyOptimisticEntry(set, habitId, date, current);
      Alert.alert('Error', "Couldn't save — please try again.");
    }
  },

  // -------------------------------------------------------------------------
  // getTodayCount — derived
  // -------------------------------------------------------------------------
  getTodayCount(habitId) {
    return getEntryCount(get().entries[habitId], get().todayDate);
  },

  // -------------------------------------------------------------------------
  // getMonthlyTotals — derived
  // -------------------------------------------------------------------------
  getMonthlyTotals(habitId, year) {
    const totals = new Array<number>(12).fill(0);
    const habitEntries = get().entries[habitId] ?? [];

    for (const entry of habitEntries) {
      if (getYear(entry.date) === year && entry.count > 0) {
        totals[getMonth(entry.date)] += entry.count;
      }
    }

    return totals;
  },

  // -------------------------------------------------------------------------
  // getCurrentStreak — derived
  // -------------------------------------------------------------------------
  getCurrentStreak(habitId) {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit?.goalEnabled) return 0;

    const entryMap = buildEntryMap(get().entries[habitId]);
    const today = get().todayDate;

    let streak = 0;
    let cursor = parseDate(today);

    while (true) {
      const key = formatDate(cursor);
      if ((entryMap[key] ?? 0) > 0) {
        streak++;
        cursor = addDays(cursor, -1);
      } else {
        break;
      }
    }

    return streak;
  },

  // -------------------------------------------------------------------------
  // getBestStreak — derived
  // -------------------------------------------------------------------------
  getBestStreak(habitId) {
    const habitEntries = get().entries[habitId] ?? [];
    if (habitEntries.length === 0) return 0;

    const dates = habitEntries
      .filter((e) => e.count > 0)
      .map((e) => e.date)
      .sort();

    if (dates.length === 0) return 0;

    let best = 1;
    let current = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = parseDate(dates[i - 1]);
      const curr = parseDate(dates[i]);
      const diff = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diff === 1) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 1;
      }
    }

    return best;
  },
}));

// =============================================================================
// Helpers (module-private)
// =============================================================================

function getYear(date: string): number {
  return parseInt(date.split('-')[0], 10);
}

function getMonth(date: string): number {
  return parseInt(date.split('-')[1], 10) - 1;
}

function getEntryCount(entries: Entry[] | undefined, date: string): number {
  return entries?.find((e) => e.date === date)?.count ?? 0;
}

function buildEntryMap(entries: Entry[] | undefined): Record<string, number> {
  const map: Record<string, number> = {};
  for (const e of entries ?? []) {
    map[e.date] = e.count;
  }
  return map;
}

/** Upsert an entry into the local cache. */
function applyOptimisticEntry(
  set: Parameters<Parameters<typeof create<HabitState>>[0]>[0],
  habitId: string,
  date: string,
  count: number,
) {
  set((state) => {
    const existing = state.entries[habitId] ?? [];
    const entryId = `${habitId}_${date}`;
    const hasEntry = existing.some((e) => e.date === date);

    const updated = hasEntry
      ? existing.map((e) => (e.date === date ? { ...e, count } : e))
      : [...existing, { id: entryId, habitId, date, count }];

    return {
      entries: { ...state.entries, [habitId]: updated },
    };
  });
}

/** Merge fetched entries with cached entries, preferring fetched data. */
function mergeEntries(cached: Entry[], fetched: Entry[]): Entry[] {
  const map = new Map<string, Entry>();
  for (const e of cached) map.set(e.date, e);
  for (const e of fetched) map.set(e.date, e);
  return Array.from(map.values());
}

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
