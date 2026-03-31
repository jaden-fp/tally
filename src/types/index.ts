export type GoalFrequency = 'daily' | 'weekly' | 'yearly';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  goalEnabled: boolean;
  goalFrequency?: GoalFrequency;
  goalTarget?: number; // target count per day/week/year depending on goalFrequency
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
