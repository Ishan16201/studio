
import type { Timestamp } from 'firebase/firestore';

export interface Habit {
  id: string; // Firestore document ID for the habit definition
  name: string;
  createdAt?: Timestamp; // When the habit definition was created
  userId?: string;
}

export interface DailyHabits {
  date: string; // YYYY-MM-DD
  habits: Record<string, boolean>; // e.g., { "Wake up early": true, "Exercise": false } - key is habit NAME
}

export interface JournalEntry {
  content: string;
  lastUpdated: Timestamp | Date; // Store as Firestore Timestamp, can be Date in client
  userId?: string;
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

// For Register Form
export interface UserProfile {
  name: string;
  phone?: string; // Optional
  email: string;
}

export interface CalendarEvent {
  id: string; // Firestore document ID
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  userId: string;
  createdAt: Timestamp;
}
