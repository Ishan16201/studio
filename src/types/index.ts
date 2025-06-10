
import type { Timestamp } from 'firebase/firestore';

export interface Habit {
  id: string; // Firestore document ID for the habit definition
  name: string;
  createdAt: Timestamp | Date; // Firestore Timestamp or Date
  userId?: string;
}

export interface DailyHabits {
  date: string; // YYYY-MM-DD
  habits: Record<string, boolean>; // e.g., { "Wake up early": true, "Exercise": false } - key is habit NAME
}

export interface JournalEntry {
  id: string; // Firestore document ID
  content: string;
  createdAt: Timestamp | Date; // Firestore Timestamp for creation, Date when working in client
  lastUpdated?: Timestamp | Date; // Firestore Timestamp for last update, Date when working in client
  userId?: string;
}

export type PomodoroMode = 'work' | 'break';

export interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number; // in seconds
  isRunning: boolean;
  cycleCount: number; // To track pomodoro cycles
}

export type TaskPriority = 'low' | 'medium' | 'urgent';

export interface TodoItem {
  id: string; // Firestore document ID
  text: string;
  completed: boolean;
  priority: TaskPriority;
  createdAt: Timestamp | Date; // Firestore Timestamp or Date
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
  createdAt: Timestamp | Date; // Firestore Timestamp or Date
}
