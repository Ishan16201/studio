import type { Timestamp } from 'firebase/firestore';

export interface Habit {
  id: string;
  name: string;
  completed: boolean;
}

export interface DailyHabits {
  date: string; // YYYY-MM-DD
  habits: Record<string, boolean>; // e.g., { "Wake up early": true, "Exercise": false }
}

export interface JournalEntry {
  content: string;
  lastUpdated: Timestamp | Date; // Store as Firestore Timestamp, can be Date in client
}

export type PomodoroMode = 'work' | 'break';

export interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number; // in seconds
  isRunning: boolean;
  cycleCount: number; // To track pomodoro cycles
}

export interface TodoItem {
  id: string; // Firestore document ID
  text: string;
  completed: boolean;
  createdAt: Timestamp; // Always Firestore Timestamp when fetched/saved
  userId?: string; // To associate tasks with a user
}
