export interface Habit {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  goalEnabled: boolean;
  goalTarget?: number; // target count per day
  userId: string;
  createdAt: string; // ISO date string
  order?: number;
}

export type NewHabit = Omit<Habit, 'id' | 'createdAt'>;

export interface Entry {
  id: string;
  habitId: string;
  date: string; // "YYYY-MM-DD"
  count: number;
}
